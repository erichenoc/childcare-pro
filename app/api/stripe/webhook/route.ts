import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { SubscriptionPlanType } from '@/shared/types/database.types'
import { emailService } from '@/features/notifications/services/email.service'

// --- Stripe v20 (API 2025-12-15.clover) field accessors -------------------
// current_period_start/end moved from Subscription onto SubscriptionItem.
function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: string | null
  end: string | null
} {
  const item = subscription.items?.data?.[0]
  const start = item?.current_period_start
  const end = item?.current_period_end
  return {
    start: typeof start === 'number' ? new Date(start * 1000).toISOString() : null,
    end: typeof end === 'number' ? new Date(end * 1000).toISOString() : null,
  }
}

// invoice.subscription was removed; it now lives under invoice.parent.
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent as
    | { subscription_details?: { subscription?: string | { id: string } | null } }
    | null
    | undefined
  const sub = parent?.subscription_details?.subscription
  if (typeof sub === 'string') return sub
  if (sub && typeof sub === 'object' && 'id' in sub) return sub.id
  // Fallback: line item parent
  const lineParent = invoice.lines?.data?.[0]?.parent as
    | { subscription_item_details?: { subscription?: string | null } }
    | null
    | undefined
  const lineSub = lineParent?.subscription_item_details?.subscription
  return typeof lineSub === 'string' ? lineSub : null
}

// Map a raw Stripe subscription status to the DB status_type enum
// (active | inactive | pending | suspended). Writing a raw Stripe status throws.
function mapStripeStatusToDbEnum(
  status: Stripe.Subscription.Status
): 'active' | 'inactive' | 'pending' | 'suspended' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'incomplete':
      return 'pending'
    case 'unpaid':
      return 'suspended'
    case 'canceled':
    case 'incomplete_expired':
    case 'paused':
      return 'inactive'
    default:
      return 'inactive'
  }
}

// Throw on a Supabase error so the route returns 5xx and Stripe retries.
function assertNoError(error: { message: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message}`)
}

// Plan limits for updating organization
const PLAN_LIMITS: Record<string, { max_children: number; max_staff: number }> = {
  trial: { max_children: 999, max_staff: 999 },
  starter: { max_children: 50, max_staff: 10 },
  professional: { max_children: 200, max_staff: 50 },
  enterprise: { max_children: 9999, max_staff: 9999 },
}

// Dunning escalation thresholds
const DUNNING_CONFIG = {
  maxRetries: 4,
  // Days after first failure to downgrade or cancel
  gracePeriodDays: 14,
  // Escalation messages based on attempt count
  messages: {
    1: 'We had trouble processing your payment. Please update your payment method.',
    2: 'Second payment attempt failed. Your account may be restricted soon.',
    3: 'Third payment attempt failed. Please update your payment method to avoid service interruption.',
    4: 'Final payment attempt failed. Your account has been suspended. Please update your payment method to restore access.',
  } as Record<number, string>,
}

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabaseAdmin = getSupabaseAdmin()

  // --- Idempotency: claim this event id. If already claimed, it is a Stripe
  // retry/duplicate of an event we already processed → ack with 200 and skip.
  const { error: claimError } = await supabaseAdmin
    .from('processed_webhook_events')
    .insert({ stripe_event_id: event.id, event_type: event.type })

  if (claimError) {
    // 23505 = unique_violation → already processed (or in-flight). Safe to ack.
    if (claimError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    // Tracking-table failure shouldn't silently drop the event; retry.
    console.error('Webhook idempotency claim failed:', claimError)
    return NextResponse.json({ error: 'Idempotency store unavailable' }, { status: 503 })
  }

  try {
    // Handle the event
    switch (event.type) {
      // ========== SUBSCRIPTION EVENTS ==========
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await handleSubscriptionChange(supabaseAdmin, stripe, event.data.object as Stripe.Subscription)
        break
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionCanceled(supabaseAdmin, event.data.object as Stripe.Subscription)
        break
      }
      case 'customer.subscription.trial_will_end': {
        await handleTrialEnding(supabaseAdmin, event.data.object as Stripe.Subscription)
        break
      }

      // ========== INVOICE EVENTS (subscription payments) ==========
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        if (getInvoiceSubscriptionId(invoice)) {
          await handleInvoicePaid(supabaseAdmin, invoice)
        }
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (getInvoiceSubscriptionId(invoice)) {
          await handleInvoicePaymentFailed(supabaseAdmin, stripe, invoice)
        }
        break
      }

      // ========== ONE-TIME PAYMENT EVENTS (invoices) ==========
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription') {
          console.log('Subscription checkout completed:', session.id)
        } else if (session.payment_status === 'paid') {
          await handleOneTimePayment(supabaseAdmin, session)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', paymentIntent.id)
        break
      }

      case 'customer.discount.created': {
        const discount = event.data.object as Stripe.Discount
        const discountPromo = discount.promotion_code
        console.log('Discount applied:', typeof discountPromo === 'string' ? discountPromo : discountPromo?.id || discount.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // Release the idempotency claim so Stripe's retry reprocesses this event.
    console.error(`Webhook handler failed for ${event.type} (${event.id}):`, error)
    await supabaseAdmin
      .from('processed_webhook_events')
      .delete()
      .eq('stripe_event_id', event.id)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Handle subscription creation or update
async function handleSubscriptionChange(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  _stripe: Stripe,
  subscription: Stripe.Subscription
) {
  // Resolve organization id: prefer metadata, else fall back to customer lookup
  // (subscriptions created via the Stripe Dashboard/Customer Portal carry no metadata).
  let organizationId = subscription.metadata.organizationId
  if (!organizationId) {
    const customerId = subscription.customer as string
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()
    if (error || !org) {
      // Unknown customer — nothing we can map. Ack (don't retry forever).
      console.error('Could not find organization for subscription:', subscription.id)
      return
    }
    organizationId = org.id
  }

  const determinedPlan: SubscriptionPlanType =
    (subscription.metadata.plan as SubscriptionPlanType) || 'starter'
  const billingCycle = subscription.metadata.billingCycle || 'monthly'
  const limits = PLAN_LIMITS[determinedPlan] || PLAN_LIMITS.starter
  const period = getSubscriptionPeriod(subscription)
  const dbStatus = mapStripeStatusToDbEnum(subscription.status)

  // Update organization with full subscription data
  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: dbStatus,
      plan: determinedPlan,
      billing_cycle: billingCycle,
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      max_children: limits.max_children,
      max_staff: limits.max_staff,
      // Reset payment failure tracking on successful subscription update
      payment_retry_count: 0,
      last_payment_failed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId)
  assertNoError(orgError, 'organizations update')

  const unitAmountCents = subscription.items.data[0]?.price?.unit_amount || 0
  const childCount = parseInt(subscription.metadata.childCount || '0', 10)

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  const subscriptionData = {
    organization_id: organizationId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    status: subscription.status,
    plan: determinedPlan,
    billing_cycle: billingCycle,
    current_period_start: period.start,
    current_period_end: period.end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    child_count_at_signup: childCount,
    unit_amount_cents: unitAmountCents,
    updated_at: new Date().toISOString(),
  }

  if (existingSub) {
    const { error } = await supabase.from('subscriptions').update(subscriptionData).eq('id', existingSub.id)
    assertNoError(error, 'subscriptions update')
  } else {
    const { error } = await supabase.from('subscriptions').insert(subscriptionData)
    assertNoError(error, 'subscriptions insert')
  }

  // Best-effort audit log (non-fatal)
  await supabase.from('subscription_events').insert({
    subscription_id: subscription.id,
    organization_id: organizationId,
    event_type: 'subscription.updated',
    data: {
      status: subscription.status,
      plan: determinedPlan,
      billingCycle,
      cancel_at_period_end: subscription.cancel_at_period_end,
      periodEnd: period.end,
    },
  })

  console.log(`Subscription updated for org ${organizationId}: ${subscription.status} -> ${dbStatus} (${determinedPlan})`)
}

// Handle subscription cancellation
async function handleSubscriptionCanceled(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  subscription: Stripe.Subscription
) {
  // Resolve org id (metadata, else by subscription id)
  let organizationId = subscription.metadata.organizationId
  if (!organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single()
    if (!org) {
      console.error('No organization found for cancelled subscription:', subscription.id)
      return
    }
    organizationId = org.id
  }

  // Update organization to cancelled state.
  // subscription_status must be a valid status_type enum (active|inactive|pending|suspended);
  // 'inactive' represents a cancelled/non-paying org. plan='cancelled' is a valid plan enum.
  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      subscription_status: 'inactive',
      plan: 'cancelled' as SubscriptionPlanType,
      cancel_at_period_end: false,
      max_children: 0,
      max_staff: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId)
  assertNoError(orgError, 'organizations cancel update')

  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
  assertNoError(subError, 'subscriptions cancel update')

  // Best-effort audit log + email (non-fatal)
  await supabase.from('subscription_events').insert({
    subscription_id: subscription.id,
    organization_id: organizationId,
    event_type: 'subscription.cancelled',
    data: { cancelled_at: new Date().toISOString() },
  })

  try {
    const { data: owner } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('organization_id', organizationId)
      .eq('role', 'owner')
      .single()

    if (owner?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://childcareproai.com'
      await emailService.sendGenericNotification(owner.email, {
        subject: 'Your ChildCare Pro subscription has been cancelled',
        body: `Your subscription has been cancelled. You can resubscribe at any time from your settings page: ${appUrl}/dashboard/settings?tab=billing`,
      })
    }
  } catch (emailError) {
    console.error('Cancellation email failed (non-fatal):', emailError)
  }

  console.log(`Subscription cancelled for org ${organizationId}`)
}

// Handle trial ending notification (3 days before)
async function handleTrialEnding(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  subscription: Stripe.Subscription
) {
  try {
    const organizationId = subscription.metadata.organizationId
    if (!organizationId) return

    const { data: owner } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('organization_id', organizationId)
      .eq('role', 'owner')
      .single()

    if (owner?.email) {
      const trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toLocaleDateString('en-US')
        : 'soon'
      const plan = subscription.metadata.plan || 'your plan'
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://childcareproai.com'

      await emailService.sendGenericNotification(owner.email, {
        subject: 'Your ChildCare Pro trial ends in 3 days',
        body: `Your free trial ends on ${trialEnd}. After that, your ${plan} subscription will begin billing automatically. Make sure your payment method is up to date. Manage your subscription: ${appUrl}/dashboard/settings?tab=billing`,
      })
    }

    // Log event
    await supabase.from('subscription_events').insert({
      subscription_id: subscription.id,
      organization_id: organizationId,
      event_type: 'trial.ending',
      data: {
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
      },
    })

    console.log(`Trial ending notification sent for org ${organizationId}`)
  } catch (error) {
    console.error('Error handling trial ending:', error)
  }
}

// Handle successful invoice payment (subscription renewal)
async function handleInvoicePaid(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  invoice: Stripe.Invoice
) {
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!org) {
    console.log('No organization found for subscription:', subscriptionId)
    return
  }

  // Reset payment failure state on successful payment
  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      subscription_status: 'active',
      payment_retry_count: 0,
      last_payment_failed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', org.id)
  assertNoError(orgError, 'organizations invoice.paid update')

  await supabase.from('subscription_events').insert({
    subscription_id: subscriptionId,
    organization_id: org.id,
    event_type: 'invoice.paid',
    data: {
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      invoice_id: invoice.id,
      billing_reason: invoice.billing_reason,
    },
  })

  console.log(`Invoice paid for org ${org.id}: $${invoice.amount_paid / 100}`)
}

// Handle failed invoice payment with dunning escalation
async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  stripe: Stripe,
  invoice: Stripe.Invoice
) {
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return
  const attemptCount = invoice.attempt_count || 1

  // Find organization by subscription with owner info
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, payment_retry_count')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!org) return

  const retryCount = (org.payment_retry_count || 0) + 1

  // Determine subscription status based on retry count (DB enum status_type).
  const newStatus: 'suspended' | 'pending' =
    retryCount >= DUNNING_CONFIG.maxRetries ? 'suspended' : 'pending'

  // Critical: persist failure tracking (propagate errors so Stripe retries).
  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      subscription_status: newStatus,
      payment_retry_count: retryCount,
      last_payment_failed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', org.id)
  assertNoError(orgError, 'organizations payment_failed update')

  await supabase.from('subscription_events').insert({
    subscription_id: subscriptionId,
    organization_id: org.id,
    event_type: 'invoice.payment_failed',
    data: {
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      attempt_count: attemptCount,
      retry_count: retryCount,
      status: newStatus,
      escalation: retryCount >= DUNNING_CONFIG.maxRetries ? 'suspended' : 'warning',
    },
  })

  // Best-effort: dunning email + Stripe cancel (never fail the webhook on these).
  try {
    const { data: owner } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('organization_id', org.id)
      .eq('role', 'owner')
      .single()

    if (owner?.email) {
      const amount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: invoice.currency.toUpperCase(),
      }).format(invoice.amount_due / 100)

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://childcareproai.com'
      const retryUrl = `${appUrl}/dashboard/settings?tab=billing`
      const message = DUNNING_CONFIG.messages[retryCount] || DUNNING_CONFIG.messages[1]
      const isFinal = retryCount >= DUNNING_CONFIG.maxRetries

      await emailService.sendPaymentFailed(owner.email, {
        organizationName: org.name || 'your organization',
        amount,
        retryUrl,
      })

      if (isFinal) {
        await emailService.sendGenericNotification(owner.email, {
          subject: 'URGENT: Your ChildCare Pro account has been suspended',
          body: `${message} Amount due: ${amount}. Your account features have been restricted until payment is resolved. Update your payment method: ${retryUrl}`,
        })

        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
          metadata: {
            cancelReason: 'payment_failed_max_retries',
            canceledAt: new Date().toISOString(),
          },
        })
      }
    }
  } catch (notifyError) {
    console.error('Dunning notification/cancel failed (non-fatal):', notifyError)
  }

  console.log(`Payment failed (attempt ${retryCount}/${DUNNING_CONFIG.maxRetries}) for org ${org.id}`)
}

// Handle one-time payment (regular invoice, not subscription)
async function handleOneTimePayment(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  session: Stripe.Checkout.Session
) {
  const invoiceId = session.metadata?.invoiceId
  if (!invoiceId) return

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('total, amount_paid, family_id, organization_id')
    .eq('id', invoiceId)
    .single()
  assertNoError(invoiceError, 'invoice lookup')
  if (!invoice) {
    console.error('One-time payment: invoice not found:', invoiceId)
    return
  }

  const paymentAmount = (session.amount_total || 0) / 100
  const stripePaymentId = session.payment_intent as string

  // Create payment record. The unique index on stripe_payment_id makes this
  // idempotent: a replayed checkout returns 23505, which we treat as "already
  // recorded" and skip the amount increment so the ledger isn't double-counted.
  const { error: payError } = await supabase.from('payments').insert({
    invoice_id: invoiceId,
    family_id: invoice.family_id,
    amount: paymentAmount,
    payment_method: 'card',
    stripe_payment_id: stripePaymentId,
    paid_at: new Date().toISOString(),
    organization_id: invoice.organization_id,
  })

  if (payError) {
    if (payError.code === '23505') {
      console.log(`Payment ${stripePaymentId} already recorded for invoice ${invoiceId}; skipping.`)
      return
    }
    throw new Error(`payments insert: ${payError.message}`)
  }

  // Update invoice totals
  const newAmountPaid = (invoice.amount_paid || 0) + paymentAmount
  const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partial'

  const { error: invUpdateError } = await supabase
    .from('invoices')
    .update({
      amount_paid: newAmountPaid,
      status: newStatus,
      paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', invoiceId)
  assertNoError(invUpdateError, 'invoice update')

  console.log(`Payment recorded for invoice ${invoiceId}`)
}

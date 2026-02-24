import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { SubscriptionPlanType } from '@/shared/types/database.types'
import { emailService } from '@/features/notifications/services/email.service'

// Extended types for Stripe objects
type ExtendedSubscription = Stripe.Subscription & {
  current_period_start: number
  current_period_end: number
}

type ExtendedInvoice = Stripe.Invoice & {
  subscription?: string | null
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

  // Handle the event
  switch (event.type) {
    // ==========================================
    // SUBSCRIPTION EVENTS
    // ==========================================
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as ExtendedSubscription
      await handleSubscriptionChange(supabaseAdmin, stripe, subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionCanceled(supabaseAdmin, subscription)
      break
    }

    case 'customer.subscription.trial_will_end': {
      const subscription = event.data.object as Stripe.Subscription
      await handleTrialEnding(supabaseAdmin, subscription)
      break
    }

    // ==========================================
    // INVOICE EVENTS (for subscription payments)
    // ==========================================
    case 'invoice.paid': {
      const invoice = event.data.object as ExtendedInvoice
      if (invoice.subscription) {
        await handleInvoicePaid(supabaseAdmin, invoice)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as ExtendedInvoice
      if (invoice.subscription) {
        await handleInvoicePaymentFailed(supabaseAdmin, stripe, invoice)
      }
      break
    }

    // ==========================================
    // ONE-TIME PAYMENT EVENTS (for invoices)
    // ==========================================
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

    // ==========================================
    // COUPON EVENTS
    // ==========================================
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
}

// Handle subscription creation or update
async function handleSubscriptionChange(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  _stripe: Stripe,
  subscription: ExtendedSubscription
) {
  try {
    const organizationId = subscription.metadata.organizationId
    const plan = subscription.metadata.plan as SubscriptionPlanType
    const billingCycle = subscription.metadata.billingCycle || 'monthly'

    if (!organizationId) {
      // Try to find org by customer ID
      const customerId = subscription.customer as string
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!org) {
        console.error('Could not find organization for subscription:', subscription.id)
        return
      }
    }

    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter

    let determinedPlan = plan
    if (!determinedPlan && subscription.items.data.length > 0) {
      determinedPlan = 'starter'
    }

    // Determine status: trialing counts as active for feature access
    const isActive = subscription.status === 'active' || subscription.status === 'trialing'

    // Update organization with full subscription data
    await supabase
      .from('organizations')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: isActive ? 'active' : subscription.status,
        plan: determinedPlan as SubscriptionPlanType,
        billing_cycle: billingCycle,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
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

    // Get unit amount from subscription item
    const unitAmountCents = subscription.items.data[0]?.price?.unit_amount || 0
    const childCount = parseInt(subscription.metadata.childCount || '0', 10)

    // Create or update subscription record
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    const subscriptionData = {
      organization_id: organizationId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      plan: determinedPlan as SubscriptionPlanType,
      billing_cycle: billingCycle,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
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
      await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSub.id)
    } else {
      await supabase.from('subscriptions').insert(subscriptionData)
    }

    // Log event
    await supabase.from('subscription_events').insert({
      subscription_id: subscription.id,
      organization_id: organizationId,
      event_type: 'subscription.updated',
      data: {
        status: subscription.status,
        plan: determinedPlan,
        billingCycle,
        cancel_at_period_end: subscription.cancel_at_period_end,
        periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      },
    })

    console.log(`Subscription updated for org ${organizationId}: ${subscription.status} (${determinedPlan})`)
  } catch (error) {
    console.error('Error handling subscription change:', error)
  }
}

// Handle subscription cancellation
async function handleSubscriptionCanceled(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  subscription: Stripe.Subscription
) {
  try {
    const organizationId = subscription.metadata.organizationId

    if (!organizationId) {
      console.error('No organization ID in subscription metadata:', subscription.id)
      return
    }

    // Update organization to cancelled state
    await supabase
      .from('organizations')
      .update({
        subscription_status: 'cancelled',
        plan: 'cancelled' as SubscriptionPlanType,
        cancel_at_period_end: false,
        max_children: 0,
        max_staff: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)

    // Update subscription record
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)

    // Log event
    await supabase.from('subscription_events').insert({
      subscription_id: subscription.id,
      organization_id: organizationId,
      event_type: 'subscription.cancelled',
      data: { cancelled_at: new Date().toISOString() },
    })

    // Send cancellation email
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

    console.log(`Subscription cancelled for org ${organizationId}`)
  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
  }
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
  invoice: ExtendedInvoice
) {
  try {
    const subscriptionId = invoice.subscription as string

    // Find organization by subscription
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
    await supabase
      .from('organizations')
      .update({
        subscription_status: 'active',
        payment_retry_count: 0,
        last_payment_failed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', org.id)

    // Log payment event
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
  } catch (error) {
    console.error('Error handling invoice paid:', error)
  }
}

// Handle failed invoice payment with dunning escalation
async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  stripe: Stripe,
  invoice: ExtendedInvoice
) {
  try {
    const subscriptionId = invoice.subscription as string
    const attemptCount = invoice.attempt_count || 1

    // Find organization by subscription with owner info
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, payment_retry_count')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (!org) return

    const retryCount = (org.payment_retry_count || 0) + 1

    // Determine subscription status based on retry count
    // Uses DB enum: active | inactive | pending | suspended
    let newStatus: string
    if (retryCount >= DUNNING_CONFIG.maxRetries) {
      newStatus = 'suspended'
    } else {
      // Still active but payment pending - mark as pending
      newStatus = 'pending'
    }

    // Update organization with failure tracking
    await supabase
      .from('organizations')
      .update({
        subscription_status: newStatus,
        payment_retry_count: retryCount,
        last_payment_failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', org.id)

    // Log event with escalation details
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

    // Send dunning email with escalating urgency
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

      // If final attempt, also send a more urgent notification
      if (isFinal) {
        await emailService.sendGenericNotification(owner.email, {
          subject: 'URGENT: Your ChildCare Pro account has been suspended',
          body: `${message} Amount due: ${amount}. Your account features have been restricted until payment is resolved. Update your payment method: ${retryUrl}`,
        })

        // Cancel the subscription in Stripe after max retries
        try {
          await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
            metadata: {
              cancelReason: 'payment_failed_max_retries',
              canceledAt: new Date().toISOString(),
            },
          })
        } catch (cancelError) {
          console.error('Error canceling subscription after max retries:', cancelError)
        }
      }

      console.log(`Payment failed (attempt ${retryCount}/${DUNNING_CONFIG.maxRetries}) for org ${org.id}: ${amount}`)
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
  }
}

// Handle one-time payment (regular invoice, not subscription)
async function handleOneTimePayment(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  session: Stripe.Checkout.Session
) {
  try {
    const invoiceId = session.metadata?.invoiceId

    if (!invoiceId) return

    // Get current invoice with family_id and organization_id
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('total, amount_paid, family_id, organization_id')
      .eq('id', invoiceId)
      .single()

    if (invoiceError) throw invoiceError

    const paymentAmount = (session.amount_total || 0) / 100

    // Create payment record
    await supabase.from('payments').insert({
      invoice_id: invoiceId,
      family_id: invoice.family_id,
      amount: paymentAmount,
      payment_method: 'card',
      stripe_payment_id: session.payment_intent as string,
      paid_at: new Date().toISOString(),
      organization_id: invoice.organization_id,
    })

    // Update invoice
    const newAmountPaid = (invoice.amount_paid || 0) + paymentAmount
    const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partial'

    await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
      })
      .eq('id', invoiceId)

    console.log(`Payment recorded for invoice ${invoiceId}`)
  } catch (error) {
    console.error('Error processing one-time payment:', error)
  }
}

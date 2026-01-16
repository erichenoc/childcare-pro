import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { SubscriptionPlanType } from '@/shared/types/database.types'

// Plan limits for updating organization
const PLAN_LIMITS: Record<string, { max_children: number; max_staff: number }> = {
  trial: { max_children: 15, max_staff: 3 },
  starter: { max_children: 50, max_staff: 5 },
  professional: { max_children: 150, max_staff: 15 },
  enterprise: { max_children: 9999, max_staff: 9999 },
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
      const subscription = event.data.object as Stripe.Subscription
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
      // Could send notification that trial is ending in 3 days
      console.log(`Trial ending soon for subscription: ${subscription.id}`)
      break
    }

    // ==========================================
    // INVOICE EVENTS (for subscription payments)
    // ==========================================
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await handleInvoicePaid(supabaseAdmin, invoice)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await handleInvoicePaymentFailed(supabaseAdmin, invoice)
      }
      break
    }

    // ==========================================
    // ONE-TIME PAYMENT EVENTS (for invoices)
    // ==========================================
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      // Check if this is a subscription or one-time payment
      if (session.mode === 'subscription') {
        // Subscription is handled by customer.subscription.created
        console.log('Subscription checkout completed:', session.id)
      } else if (session.payment_status === 'paid') {
        // Handle one-time invoice payment
        await handleOneTimePayment(supabaseAdmin, session)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment failed:', paymentIntent.id)
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
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  try {
    const organizationId = subscription.metadata.organizationId
    const plan = subscription.metadata.plan as SubscriptionPlanType

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

    const orgId = organizationId || (subscription.customer as string)
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter

    // Get the subscription item price to determine the plan if not in metadata
    let determinedPlan = plan
    if (!determinedPlan && subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id
      // Could map price IDs to plans here
      determinedPlan = 'starter' // Default
    }

    // Update organization
    await supabase
      .from('organizations')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : subscription.status,
        plan: determinedPlan as SubscriptionPlanType,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        trial_ends_at: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        max_children: limits.max_children,
        max_staff: limits.max_staff,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)

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
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
    })

    console.log(`Subscription updated for org ${organizationId}:`, subscription.status)
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

    console.log(`Subscription cancelled for org ${organizationId}`)
  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
  }
}

// Handle successful invoice payment (subscription renewal)
async function handleInvoicePaid(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  invoice: Stripe.Invoice
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

    // Log payment event
    await supabase.from('subscription_events').insert({
      subscription_id: subscriptionId,
      organization_id: org.id,
      event_type: 'invoice.paid',
      data: {
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        invoice_id: invoice.id,
      },
    })

    console.log(`Invoice paid for org ${org.id}: $${invoice.amount_paid / 100}`)
  } catch (error) {
    console.error('Error handling invoice paid:', error)
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  invoice: Stripe.Invoice
) {
  try {
    const subscriptionId = invoice.subscription as string

    // Find organization by subscription
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (!org) return

    // Update organization status to past_due
    await supabase
      .from('organizations')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('id', org.id)

    // Log event
    await supabase.from('subscription_events').insert({
      subscription_id: subscriptionId,
      organization_id: org.id,
      event_type: 'invoice.payment_failed',
      data: {
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        attempt_count: invoice.attempt_count,
      },
    })

    // TODO: Send notification to organization owner about failed payment
    console.log(`Payment failed for org ${org.id}`)
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

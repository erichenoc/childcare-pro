import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/shared/lib/supabase/server'
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'
import { AuditLogger } from '@/shared/lib/audit-logger'
import { calculateMonthlyPrice, calculateAnnualPrice, PLAN_PRICING, TRIAL_CONFIG } from '@/shared/lib/plan-config'

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimited = checkRateLimit(request, RateLimits.strict, 'subscription-checkout')
    if (rateLimited) return rateLimited

    // Authentication via SSR client (uses cookies)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 403 })
    }

    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json(
        {
          error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.',
          demo: true,
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      plan,
      billingCycle = 'monthly',
      customerEmail,
      customerName,
    } = body

    // Use the authenticated user's organization (ignore client-sent organizationId for security)
    const organizationId = profile.organization_id

    // Validate plan
    if (!plan || !['starter', 'professional', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be starter, professional, or enterprise.' },
        { status: 400 }
      )
    }

    // Validate billing cycle
    if (!['monthly', 'annual'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Must be monthly or annual.' },
        { status: 400 }
      )
    }

    // Get organization to check current state (using authenticated client)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, email, stripe_customer_id, stripe_subscription_id, plan, trial_ends_at')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      console.error('Org lookup failed:', { organizationId, orgError })
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // If already has an active subscription, use plan change instead
    if (org.stripe_subscription_id) {
      return NextResponse.json(
        {
          error: 'Organization already has an active subscription. Use /api/stripe/subscription/change to switch plans.',
          hasSubscription: true,
        },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    let customerId = org.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: customerEmail || org.email || user.email || undefined,
        name: customerName || org.name,
        metadata: {
          organizationId: org.id,
        },
      })
      customerId = customer.id

      // Save customer ID to organization
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId)
    }

    // Count active children for pricing calculation
    const { count: childCount } = await supabase
      .from('children')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    const activeChildren = childCount ?? 0

    // Calculate the price based on the billing cycle
    let unitAmount: number
    let intervalConfig: { interval: 'month' | 'year'; interval_count?: number }

    if (billingCycle === 'annual') {
      const { annual } = calculateAnnualPrice(plan, activeChildren)
      unitAmount = annual * 100
      intervalConfig = { interval: 'year' }
    } else {
      const monthly = calculateMonthlyPrice(plan, activeChildren)
      unitAmount = Math.round(monthly * 100)
      intervalConfig = { interval: 'month' }
    }

    // Determine trial period:
    // - If currently on trial plan, give remaining trial days (min 0)
    // - If new subscriber (no previous plan), give full trial
    // - If returning from cancelled, no trial
    let trialDays: number | undefined
    if (org.plan === 'trial' && org.trial_ends_at) {
      const remaining = Math.ceil(
        (new Date(org.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      trialDays = Math.max(remaining, 0)
    } else if (!org.plan || org.plan === 'trial') {
      trialDays = TRIAL_CONFIG.durationDays
    }
    // Cancelled/existing plans get no trial

    // Idempotency key: org + plan + cycle to prevent duplicate sessions
    const idempotencyKey = `sub-checkout-${organizationId}-${plan}-${billingCycle}-${Date.now()}`

    // Create Checkout Session for subscription
    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `ChildCare Pro - ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
                description: `${activeChildren} children @ $${PLAN_PRICING[plan as keyof typeof PLAN_PRICING].perChild}/child/month`,
              },
              unit_amount: unitAmount,
              recurring: intervalConfig,
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${request.nextUrl.origin}/dashboard/settings?tab=billing&success=true&plan=${plan}`,
        cancel_url: `${request.nextUrl.origin}/dashboard/settings?tab=billing&canceled=true`,
        subscription_data: {
          metadata: {
            organizationId,
            plan,
            billingCycle,
            childCount: String(activeChildren),
          },
          ...(trialDays && trialDays > 0 ? { trial_period_days: trialDays } : {}),
        },
        metadata: {
          organizationId,
          plan,
          billingCycle,
          childCount: String(activeChildren),
          type: 'subscription',
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto',
        },
        payment_method_collection: 'always',
      },
      {
        idempotencyKey,
      }
    )

    // Audit logging
    await AuditLogger.paymentInitiated(
      user.id,
      organizationId,
      'subscription',
      unitAmount / 100,
      request.headers
    )

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      trialDays: trialDays || 0,
    })
  } catch (error) {
    console.error('Stripe subscription checkout error:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

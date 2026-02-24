import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/shared/lib/supabase/server'
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'
import { AuditLogger } from '@/shared/lib/audit-logger'
import { calculateMonthlyPrice, calculateAnnualPrice } from '@/shared/lib/plan-config'

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

/**
 * Change subscription plan (upgrade/downgrade) with proration
 * POST /api/stripe/subscription/change
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimited = checkRateLimit(request, RateLimits.strict, 'subscription-change')
    if (rateLimited) return rateLimited

    // Authentication via SSR client
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        { error: 'Stripe is not configured.', demo: true },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { plan, billingCycle } = body

    // Use authenticated user's organization
    const organizationId = profile.organization_id

    if (!plan || !['starter', 'professional', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be starter, professional, or enterprise.' },
        { status: 400 }
      )
    }

    // Get organization with subscription
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, stripe_customer_id, stripe_subscription_id, plan')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    if (!org.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found. Create a new subscription first.' },
        { status: 400 }
      )
    }

    if (org.plan === plan && !billingCycle) {
      return NextResponse.json(
        { error: 'Already on this plan.' },
        { status: 400 }
      )
    }

    // Get current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id)

    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription is canceled. Create a new subscription.' },
        { status: 400 }
      )
    }

    // Count active children for pricing
    const { count: childCount } = await supabase
      .from('children')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    const activeChildren = childCount ?? 0
    const cycle = billingCycle || subscription.metadata.billingCycle || 'monthly'

    // Calculate new price
    let unitAmount: number
    let intervalConfig: { interval: 'month' | 'year' }

    if (cycle === 'annual') {
      const { annual } = calculateAnnualPrice(plan, activeChildren)
      unitAmount = annual * 100
      intervalConfig = { interval: 'year' }
    } else {
      const monthly = calculateMonthlyPrice(plan, activeChildren)
      unitAmount = Math.round(monthly * 100)
      intervalConfig = { interval: 'month' }
    }

    // Get the current subscription item
    const subscriptionItemId = subscription.items.data[0]?.id
    if (!subscriptionItemId) {
      return NextResponse.json(
        { error: 'No subscription items found.' },
        { status: 500 }
      )
    }

    // Determine proration behavior:
    // - Upgrade: charge immediately (create_prorations)
    // - Downgrade: apply at next billing cycle (none, effective at period end)
    const planTiers = { starter: 1, professional: 2, enterprise: 3 }
    const currentTier = planTiers[org.plan as keyof typeof planTiers] || 0
    const newTier = planTiers[plan as keyof typeof planTiers] || 0
    const isUpgrade = newTier > currentTier

    // Update subscription with new price and proration
    const updatedSubscription = await stripe.subscriptions.update(
      org.stripe_subscription_id,
      {
        items: [
          {
            id: subscriptionItemId,
            price_data: {
              currency: 'usd',
              product: subscription.items.data[0].price.product as string,
              unit_amount: unitAmount,
              recurring: intervalConfig,
            },
          },
        ],
        proration_behavior: isUpgrade ? 'create_prorations' : 'none',
        metadata: {
          ...subscription.metadata,
          plan,
          billingCycle: cycle,
          childCount: String(activeChildren),
          previousPlan: org.plan || '',
          changedAt: new Date().toISOString(),
        },
      },
      {
        idempotencyKey: `sub-change-${organizationId}-${plan}-${cycle}-${Date.now()}`,
      }
    )

    // Update organization in Supabase
    const PLAN_LIMITS: Record<string, { max_children: number; max_staff: number }> = {
      starter: { max_children: 50, max_staff: 10 },
      professional: { max_children: 200, max_staff: 50 },
      enterprise: { max_children: 9999, max_staff: 9999 },
    }

    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter

    await supabase
      .from('organizations')
      .update({
        plan,
        billing_cycle: cycle,
        max_children: limits.max_children,
        max_staff: limits.max_staff,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)

    // Log the plan change event (non-blocking)
    supabase.from('subscription_events').insert({
      subscription_id: updatedSubscription.id,
      organization_id: organizationId,
      event_type: isUpgrade ? 'plan.upgraded' : 'plan.downgraded',
      data: {
        previousPlan: org.plan,
        newPlan: plan,
        billingCycle: cycle,
        proration: isUpgrade ? 'immediate' : 'next_period',
        unitAmount: unitAmount / 100,
        childCount: activeChildren,
      },
    })

    // Audit logging
    await AuditLogger.paymentInitiated(
      user.id,
      organizationId,
      `plan-change-${org.plan}-to-${plan}`,
      unitAmount / 100,
      request.headers
    )

    return NextResponse.json({
      success: true,
      plan,
      billingCycle: cycle,
      isUpgrade,
      prorated: isUpgrade,
      newPrice: unitAmount / 100,
      subscriptionId: updatedSubscription.id,
    })
  } catch (error) {
    console.error('Stripe plan change error:', error)

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

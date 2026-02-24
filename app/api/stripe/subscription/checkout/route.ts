import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { SubscriptionPlanType } from '@/shared/types/database.types'
import { verifyUserAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'
import { AuditLogger } from '@/shared/lib/audit-logger'
import { calculateMonthlyPrice, calculateAnnualPrice, PLAN_PRICING } from '@/shared/lib/plan-config'

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
  try {
    // Rate limiting
    const rateLimited = checkRateLimit(request, RateLimits.strict, 'subscription-checkout')
    if (rateLimited) return rateLimited

    // Authentication
    const auth = await verifyUserAuth()
    if (isAuthError(auth)) return auth.response

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
      organizationId,
      plan,
      billingCycle = 'monthly', // 'monthly' or 'annual'
      customerEmail,
      customerName,
    } = body

    // Validate required fields
    if (!organizationId || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, plan' },
        { status: 400 }
      )
    }

    // Validate plan
    if (!['starter', 'professional', 'enterprise'].includes(plan)) {
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

    const supabaseAdmin = getSupabaseAdmin()

    // Get organization to check current state
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, email, stripe_customer_id, stripe_subscription_id, plan')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // If already has an active subscription, redirect to customer portal instead
    if (org.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Organization already has an active subscription. Use the customer portal to manage it.' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    let customerId = org.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: customerEmail || org.email || undefined,
        name: customerName || org.name,
        metadata: {
          organizationId: org.id,
        },
      })
      customerId = customer.id

      // Save customer ID to organization
      await supabaseAdmin
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId)
    }

    // Count active children for pricing calculation
    const { count: childCount } = await supabaseAdmin
      .from('children')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    const activeChildren = childCount ?? 0

    // Calculate the price based on the billing cycle
    let unitAmount: number // in cents for Stripe
    let intervalConfig: { interval: 'month' | 'year'; interval_count?: number }

    if (billingCycle === 'annual') {
      const { annual } = calculateAnnualPrice(plan, activeChildren)
      unitAmount = annual * 100 // convert to cents
      intervalConfig = { interval: 'year' }
    } else {
      const monthly = calculateMonthlyPrice(plan, activeChildren)
      unitAmount = Math.round(monthly * 100) // convert to cents
      intervalConfig = { interval: 'month' }
    }

    // Create Checkout Session for subscription using dynamic price_data
    const session = await stripe.checkout.sessions.create({
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
        trial_period_days: org.plan === 'trial' ? 0 : undefined,
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
    })

    // Audit logging
    await AuditLogger.paymentInitiated(
      auth.user.id,
      organizationId,
      'subscription',
      0,
      request.headers
    )

    return NextResponse.json({ url: session.url, sessionId: session.id })
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

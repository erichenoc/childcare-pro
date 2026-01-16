import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { SubscriptionPlanType } from '@/shared/types/database.types'

// Plan Price IDs - these should be created in Stripe Dashboard
// In production, these would be stored in environment variables
const PLAN_PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || 'price_starter_annual',
  },
  professional: {
    monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_professional_monthly',
    annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL || 'price_professional_annual',
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || 'price_enterprise_annual',
  },
}

// Plan limits for updating organization
const PLAN_LIMITS: Record<string, { max_children: number; max_staff: number }> = {
  starter: { max_children: 50, max_staff: 5 },
  professional: { max_children: 150, max_staff: 15 },
  enterprise: { max_children: 9999, max_staff: 9999 }, // Unlimited
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
  try {
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

    // Get the price ID for the selected plan and billing cycle
    const priceId = PLAN_PRICE_IDS[plan]?.[billingCycle as 'monthly' | 'annual']

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price configuration not found for this plan' },
        { status: 500 }
      )
    }

    // Create Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
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
        },
        trial_period_days: org.plan === 'trial' ? undefined : 0, // No extra trial if upgrading from trial
      },
      metadata: {
        organizationId,
        plan,
        billingCycle,
        type: 'subscription',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    })

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

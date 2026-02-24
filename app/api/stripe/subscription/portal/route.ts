import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/shared/lib/supabase/server'
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'
import { AuditLogger } from '@/shared/lib/audit-logger'

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimited = checkRateLimit(request, RateLimits.strict, 'subscription-portal')
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

    // Use authenticated user's organization
    const organizationId = profile.organization_id

    // Get organization's Stripe customer ID
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    if (!org.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this organization. Please subscribe first.' },
        { status: 400 }
      )
    }

    // Create Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${request.nextUrl.origin}/dashboard/settings?tab=billing`,
    })

    await AuditLogger.adminAccess(
      user.email || 'unknown',
      user.id,
      'stripe-portal',
      request.headers
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)

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

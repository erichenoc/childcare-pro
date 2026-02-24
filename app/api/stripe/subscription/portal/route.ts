import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { verifyUserAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'
import { AuditLogger } from '@/shared/lib/audit-logger'

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
    const rateLimited = checkRateLimit(request, RateLimits.strict, 'subscription-portal')
    if (rateLimited) return rateLimited

    // Authentication
    const auth = await verifyUserAuth()
    if (isAuthError(auth)) return auth.response

    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json(
        {
          error: 'Stripe is not configured.',
          demo: true,
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { organizationId } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing required field: organizationId' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get organization's Stripe customer ID
    const { data: org, error: orgError } = await supabaseAdmin
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
      auth.user.email || 'unknown',
      auth.user.id,
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

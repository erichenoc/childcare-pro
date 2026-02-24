import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/shared/lib/supabase/server'
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'
import { createCheckoutSessionSchema } from '@/shared/lib/validations'
import { AuditLogger } from '@/shared/lib/audit-logger'

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

export async function POST(request: NextRequest) {
  try {
    // 🛡️ RATE LIMITING
    const rateLimited = checkRateLimit(request, RateLimits.strict, 'stripe-checkout')
    if (rateLimited) return rateLimited

    // 🔐 AUTHENTICATION: Verify user is logged in
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Stripe Checkout] Unauthorized access attempt')
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

    // Check if Stripe is configured
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

    // 🛡️ VALIDATION: Parse and validate request body with Zod
    const validationResult = createCheckoutSessionSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('[Stripe Checkout] Validation failed:', validationResult.error.flatten())
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      invoiceId,
      amount, // in dollars (will be converted to cents)
      familyName,
      invoiceNumber,
      description,
      successUrl = `${request.nextUrl.origin}/dashboard/billing?success=true&invoice=${invoiceId}`,
      cancelUrl = `${request.nextUrl.origin}/dashboard/billing?canceled=true&invoice=${invoiceId}`,
    } = validationResult.data

    // 🔒 AUTHORIZATION: Verify invoice belongs to user's organization
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, total, organization_id, status')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      console.error('[Stripe Checkout] Invoice not found:', invoiceId)
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Verify organization ownership
    if (invoice.organization_id !== profile.organization_id) {
      console.error('[Stripe Checkout] Forbidden - invoice belongs to different organization')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify invoice is not already paid
    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
    }

    // 🔒 SECURITY: Verify amount matches invoice total (prevent tampering)
    const invoiceTotal = Number(invoice.total)
    const requestedAmount = Number(amount)
    if (Math.abs(invoiceTotal - requestedAmount) > 0.01) {
      console.error('[Stripe Checkout] Amount mismatch - possible tampering', {
        invoiceTotal,
        requestedAmount,
      })

      // 🚨 AUDIT: Log security alert for potential tampering
      await AuditLogger.securityAlert(
        'Payment amount mismatch detected',
        { invoiceId, invoiceTotal, requestedAmount, userId: user.id },
        request.headers
      )

      return NextResponse.json({ error: 'Amount does not match invoice' }, { status: 400 })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Factura ${invoiceNumber}`,
              description: description || `Pago para ${familyName}`,
            },
            unit_amount: Math.round(invoiceTotal * 100), // Use verified invoice total
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        invoiceId,
        invoiceNumber,
        familyName: familyName ?? '',
        organizationId: profile.organization_id ?? '',
        userId: user.id,
      },
    })

    console.log('[Stripe Checkout] Session created:', session.id, 'for invoice:', invoiceId)

    // 📝 AUDIT: Log payment initiation
    await AuditLogger.paymentInitiated(
      user.id,
      profile.organization_id,
      invoiceId,
      invoiceTotal,
      request.headers
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)

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

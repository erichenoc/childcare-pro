import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe with secret key
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  : null

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
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
      invoiceId,
      amount, // in cents
      familyName,
      invoiceNumber,
      description,
      successUrl = `${request.nextUrl.origin}/dashboard/billing?success=true&invoice=${invoiceId}`,
      cancelUrl = `${request.nextUrl.origin}/dashboard/billing?canceled=true&invoice=${invoiceId}`,
    } = body

    // Validate required fields
    if (!invoiceId || !amount || !invoiceNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: invoiceId, amount, invoiceNumber' },
        { status: 400 }
      )
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
            unit_amount: Math.round(amount * 100), // Convert to cents
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
        familyName,
      },
      customer_email: undefined, // Could be passed from family data
    })

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

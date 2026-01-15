import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Create admin client for webhook processing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

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

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status === 'paid') {
        const invoiceId = session.metadata?.invoiceId

        if (invoiceId) {
          try {
            // Get current invoice with family_id
            const { data: invoice, error: invoiceError } = await supabaseAdmin
              .from('invoices')
              .select('total, amount_paid, family_id')
              .eq('id', invoiceId)
              .single()

            if (invoiceError) throw invoiceError

            const paymentAmount = (session.amount_total || 0) / 100 // Convert from cents

            // Create payment record
            await supabaseAdmin.from('payments').insert({
              invoice_id: invoiceId,
              family_id: invoice.family_id,
              amount: paymentAmount,
              payment_method: 'card',
              stripe_payment_id: session.payment_intent as string,
              paid_at: new Date().toISOString(),
              organization_id: DEMO_ORG_ID,
            })

            // Update invoice
            const newAmountPaid = (invoice.amount_paid || 0) + paymentAmount
            const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partial'

            await supabaseAdmin
              .from('invoices')
              .update({
                amount_paid: newAmountPaid,
                status: newStatus,
                paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
              })
              .eq('id', invoiceId)

            console.log(`Payment recorded for invoice ${invoiceId}`)
          } catch (error) {
            console.error('Error processing payment:', error)
            return NextResponse.json(
              { error: 'Error processing payment' },
              { status: 500 }
            )
          }
        }
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment failed:', paymentIntent.id)
      // Could add notification logic here
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

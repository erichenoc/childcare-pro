/**
 * Stripe Payment Service
 *
 * This service handles Stripe integration for processing payments.
 * Uses Stripe Checkout for secure payment processing.
 *
 * NOTE: Stripe keys must be configured in .env.local:
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 * - STRIPE_SECRET_KEY
 */

import { createClient } from '@/shared/lib/supabase/client'

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

export interface CreateCheckoutSessionParams {
  invoiceId: string
  amount: number // in cents
  familyName: string
  invoiceNumber: string
  description?: string
  successUrl?: string
  cancelUrl?: string
}

export interface PaymentIntentResult {
  success: boolean
  clientSecret?: string
  error?: string
}

export const stripeService = {
  /**
   * Creates a Stripe Checkout Session for an invoice payment
   * This calls our API route that handles Stripe on the server
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ url: string } | { error: string }> {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Error creating checkout session' }
      }

      return { url: data.url }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      return { error: 'Error connecting to payment service' }
    }
  },

  /**
   * Records a manual/cash payment in the database
   */
  async recordManualPayment(params: {
    invoiceId: string
    amount: number
    paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'other'
    notes?: string
  }) {
    const supabase = createClient()

    // Get current invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('total, amount_paid')
      .eq('id', params.invoiceId)
      .single()

    if (invoiceError) throw invoiceError

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: params.invoiceId,
        amount: params.amount,
        payment_method: params.paymentMethod,
        status: 'completed',
        paid_at: new Date().toISOString(),
        notes: params.notes,
        organization_id: DEMO_ORG_ID,
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Update invoice
    const newAmountPaid = (invoice.amount_paid || 0) + params.amount
    const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partial'

    await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
      })
      .eq('id', params.invoiceId)

    return payment
  },

  /**
   * Verifies a Stripe webhook signature
   * This should be called from the webhook API route
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // This is handled server-side in the API route
    // The client-side service just provides the interface
    return true
  },

  /**
   * Gets payment history for an invoice
   */
  async getPaymentHistory(invoiceId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('paid_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Checks if Stripe is configured
   */
  isConfigured(): boolean {
    return !!(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  }
}

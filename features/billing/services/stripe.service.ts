/**
 * Stripe Payment Service
 *
 * This service handles Stripe integration for processing payments and subscriptions.
 * Uses Stripe Checkout for secure payment processing.
 *
 * NOTE: Stripe keys must be configured in .env.local:
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET
 */

import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { SubscriptionPlanType } from '@/shared/types/database.types'
import {
  calculateMonthlyPrice as calcMonthly,
  calculateAnnualPrice as calcAnnual,
} from '@/shared/lib/plan-config'

// ==========================================
// INVOICE PAYMENT TYPES
// ==========================================

export interface CreateCheckoutSessionParams {
  invoiceId: string
  amount: number // in dollars
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

// ==========================================
// SUBSCRIPTION TYPES
// ==========================================

export type BillingCycle = 'monthly' | 'annual'

export interface CreateSubscriptionCheckoutParams {
  organizationId: string
  plan: 'starter' | 'professional' | 'enterprise'
  billingCycle: BillingCycle
  childCount: number  // active children count
  customerEmail?: string
  customerName?: string
}

export interface SubscriptionCheckoutResult {
  url?: string
  sessionId?: string
  trialDays?: number
  error?: string
  hasSubscription?: boolean
}

export interface PlanChangeResult {
  success?: boolean
  plan?: string
  billingCycle?: string
  isUpgrade?: boolean
  prorated?: boolean
  newPrice?: number
  error?: string
}

export interface CustomerPortalResult {
  url?: string
  error?: string
}

// ==========================================
// PLAN PRICING
// ==========================================

export {
  PLAN_PRICING,
  PLAN_DISPLAY,
  calculateMonthlyPrice,
  calculateAnnualPrice,
} from '@/shared/lib/plan-config'

// ==========================================
// SERVICE
// ==========================================

export const stripeService = {
  // ==========================================
  // SUBSCRIPTION METHODS
  // ==========================================

  /**
   * Creates a Stripe Checkout Session for subscription
   */
  async createSubscriptionCheckout(
    params: CreateSubscriptionCheckoutParams
  ): Promise<SubscriptionCheckoutResult> {
    try {
      const response = await fetch('/api/stripe/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!response.ok) {
        // If org already has subscription, signal to use plan change instead
        if (data.hasSubscription) {
          return { error: data.error, hasSubscription: true }
        }
        return { error: data.error || 'Error creating subscription checkout' }
      }

      return { url: data.url, sessionId: data.sessionId, trialDays: data.trialDays }
    } catch (error) {
      console.error('Error creating subscription checkout:', error)
      return { error: 'Error connecting to payment service' }
    }
  },

  /**
   * Change subscription plan (upgrade/downgrade) with proration
   */
  async changeSubscriptionPlan(params: {
    organizationId: string
    plan: 'starter' | 'professional' | 'enterprise'
    billingCycle?: BillingCycle
  }): Promise<PlanChangeResult> {
    try {
      const response = await fetch('/api/stripe/subscription/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Error changing plan' }
      }

      return data
    } catch (error) {
      console.error('Error changing subscription plan:', error)
      return { error: 'Error connecting to payment service' }
    }
  },

  /**
   * Opens the Stripe Customer Portal for subscription management
   */
  async openCustomerPortal(organizationId: string): Promise<CustomerPortalResult> {
    try {
      const response = await fetch('/api/stripe/subscription/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Error opening customer portal' }
      }

      return { url: data.url }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      return { error: 'Error connecting to payment service' }
    }
  },

  /**
   * Get formatted price for a plan based on active child count
   */
  getPrice(
    plan: 'starter' | 'professional' | 'enterprise',
    billingCycle: BillingCycle,
    childCount: number
  ): { monthly: number; total: number; savings: number } {
    if (billingCycle === 'annual') {
      const { annual, savings } = calcAnnual(plan, childCount)

      return {
        monthly: Math.round((annual / 12) * 100) / 100,
        total: annual,
        savings,
      }
    }

    const monthly = calcMonthly(plan, childCount)

    return { monthly, total: monthly, savings: 0 }
  },

  /**
   * Format price display
   */
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  },

  // ==========================================
  // INVOICE PAYMENT METHODS
  // ==========================================

  /**
   * Creates a Stripe Checkout Session for an invoice payment
   */
  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<{ url: string } | { error: string }> {
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
    paymentMethod: 'card' | 'cash' | 'check' | 'bank_transfer' | 'other'
    notes?: string
  }) {
    const supabase = createClient()
    const orgId = await requireOrgId()

    // Get current invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('total, amount_paid, family_id')
      .eq('id', params.invoiceId)
      .eq('organization_id', orgId)
      .single()

    if (invoiceError) throw invoiceError

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: params.invoiceId,
        family_id: invoice.family_id,
        amount: params.amount,
        payment_method: params.paymentMethod,
        paid_at: new Date().toISOString(),
        notes: params.notes,
        organization_id: orgId,
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
   * Gets payment history for an invoice
   */
  async getPaymentHistory(invoiceId: string) {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('organization_id', orgId)
      .order('paid_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Checks if Stripe is configured
   */
  isConfigured(): boolean {
    return !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  },
}

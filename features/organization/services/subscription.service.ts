import { createClient } from '@/shared/lib/supabase/client'
import type {
  Subscription,
  SubscriptionEvent,
  PlanConfig,
  SubscriptionPlanType,
  TablesInsert
} from '@/shared/types/database.types'

// Re-export from central config — single source of truth for per-child pricing
export { PLAN_PRICING, PLAN_FEATURES, calculateMonthlyPrice, calculateAnnualPrice } from '@/shared/lib/plan-config'
import { calculateAnnualPrice } from '@/shared/lib/plan-config'

export interface SubscriptionDetails {
  subscription: Subscription | null
  plan: PlanConfig | null
  isActive: boolean
  isTrial: boolean
  daysRemaining: number
  cancelAtPeriodEnd: boolean
  trialEndsAt: string | null
}

export const subscriptionService = {
  /**
   * Get subscription by organization ID
   */
  async getByOrgId(orgId: string): Promise<Subscription | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as Subscription
  },

  /**
   * Get subscription by Stripe subscription ID
   */
  async getByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as Subscription
  },

  /**
   * Get all plan configurations
   */
  async getPlans(): Promise<PlanConfig[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('plan_configs')
      .select('*')
      .order('price_monthly_cents', { ascending: true })

    if (error) throw error
    return (data || []) as PlanConfig[]
  },

  /**
   * Get plan configuration by plan type
   */
  async getPlan(planType: SubscriptionPlanType): Promise<PlanConfig | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('plan_configs')
      .select('*')
      .eq('plan', planType)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as PlanConfig
  },

  /**
   * Create a new subscription record (called from webhook)
   */
  async create(input: TablesInsert<'subscriptions'>): Promise<Subscription> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(input)
      .select()
      .single()

    if (error) throw error

    // Update organization with subscription details
    // NOTE: max_children and max_staff are managed by the Stripe webhook based on active child count
    await supabase
      .from('organizations')
      .update({
        stripe_subscription_id: input.stripe_subscription_id,
        plan: input.plan,
        subscription_status: 'active',
        current_period_start: input.current_period_start,
        current_period_end: input.current_period_end,
        cancel_at_period_end: input.cancel_at_period_end || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.organization_id)

    // Log subscription event
    await this.logEvent(input.organization_id, data.id, 'created', {
      plan: input.plan,
      stripe_subscription_id: input.stripe_subscription_id,
    })

    return data as Subscription
  },

  /**
   * Update subscription (called from webhook)
   */
  async update(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select()
      .single()

    if (error) throw error

    // Sync with organization
    if (data.organization_id) {
      await supabase
        .from('organizations')
        .update({
          plan: data.plan,
          subscription_status: data.status === 'active' ? 'active' : 'suspended',
          current_period_start: data.current_period_start,
          current_period_end: data.current_period_end,
          cancel_at_period_end: data.cancel_at_period_end || false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.organization_id)

      await this.logEvent(data.organization_id, subscriptionId, 'updated', updates)
    }

    return data as Subscription
  },

  /**
   * Cancel subscription (mark for cancellation at period end)
   */
  async cancel(subscriptionId: string): Promise<Subscription> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select()
      .single()

    if (error) throw error

    // Sync with organization
    if (data.organization_id) {
      await supabase
        .from('organizations')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.organization_id)

      await this.logEvent(data.organization_id, subscriptionId, 'cancelled', {
        cancel_at_period_end: true,
      })
    }

    return data as Subscription
  },

  /**
   * Reactivate cancelled subscription
   */
  async reactivate(subscriptionId: string): Promise<Subscription> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select()
      .single()

    if (error) throw error

    // Sync with organization
    if (data.organization_id) {
      await supabase
        .from('organizations')
        .update({
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.organization_id)

      await this.logEvent(data.organization_id, subscriptionId, 'reactivated', {})
    }

    return data as Subscription
  },

  /**
   * Mark subscription as ended
   */
  async end(subscriptionId: string): Promise<Subscription> {
    const supabase = createClient()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        ended_at: now,
        updated_at: now,
      })
      .eq('id', subscriptionId)
      .select()
      .single()

    if (error) throw error

    // Suspend organization
    if (data.organization_id) {
      await supabase
        .from('organizations')
        .update({
          subscription_status: 'suspended',
          plan: 'cancelled',
          updated_at: now,
        })
        .eq('id', data.organization_id)

      await this.logEvent(data.organization_id, subscriptionId, 'ended', {
        ended_at: now,
      })
    }

    return data as Subscription
  },

  /**
   * Log subscription event
   */
  async logEvent(
    orgId: string,
    subscriptionId: string | null,
    eventType: string,
    data: Record<string, unknown>,
    stripeEventId?: string
  ): Promise<void> {
    const supabase = createClient()
    await supabase.from('subscription_events').insert({
      organization_id: orgId,
      subscription_id: subscriptionId,
      event_type: eventType,
      stripe_event_id: stripeEventId || null,
      data: data,
    } as TablesInsert<'subscription_events'>)
  },

  /**
   * Get subscription events for an organization
   */
  async getEvents(orgId: string, limit = 50): Promise<SubscriptionEvent[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('subscription_events')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []) as SubscriptionEvent[]
  },

  /**
   * Get full subscription details for an organization
   */
  async getDetails(orgId: string): Promise<SubscriptionDetails> {
    const supabase = createClient()

    // Get organization
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (!org) {
      return {
        subscription: null,
        plan: null,
        isActive: false,
        isTrial: false,
        daysRemaining: 0,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
      }
    }

    const subscription = await this.getByOrgId(orgId)
    const plan = org.plan ? await this.getPlan(org.plan as SubscriptionPlanType) : null

    // Check if in trial
    const now = new Date()
    const isTrial = org.trial_ends_at ? new Date(org.trial_ends_at) > now : false

    // Calculate days remaining
    let daysRemaining = 0
    if (isTrial && org.trial_ends_at) {
      const diff = new Date(org.trial_ends_at).getTime() - now.getTime()
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    } else if (subscription?.current_period_end) {
      const diff = new Date(subscription.current_period_end).getTime() - now.getTime()
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    // Check if active
    const isActive = isTrial || (subscription?.status === 'active' && daysRemaining > 0)

    return {
      subscription,
      plan,
      isActive,
      isTrial,
      daysRemaining,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end || org.cancel_at_period_end || false,
      trialEndsAt: org.trial_ends_at || null,
    }
  },

  /**
   * Format price for display (always uses en-US for USD: $1,000.00)
   * Accepts dollars (not cents) to match the per-child pricing model.
   */
  formatPrice(dollars: number, locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars)
  },

  /**
   * Calculate annual savings based on child count using per-child pricing.
   * childCount defaults to 0 which results in the plan minimum being used.
   */
  getAnnualSavings(
    planType: SubscriptionPlanType,
    childCount = 0
  ): {
    monthlyTotal: number
    annualPrice: number
    savings: number
    monthsFree: number
  } {
    if (planType === 'trial' || planType === 'cancelled') {
      return { monthlyTotal: 0, annualPrice: 0, savings: 0, monthsFree: 0 }
    }

    const tierPlan = planType as 'starter' | 'professional' | 'enterprise'
    const { annual, savings } = calculateAnnualPrice(tierPlan, childCount)
    const monthlyTotal = annual + savings  // full year at monthly rate

    return {
      monthlyTotal,
      annualPrice: annual,
      savings,
      monthsFree: monthlyTotal > 0 ? Math.round(savings / (monthlyTotal / 12)) : 0,
    }
  },
}

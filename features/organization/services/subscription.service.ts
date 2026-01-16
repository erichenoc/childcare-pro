import { createClient } from '@/shared/lib/supabase/client'
import type {
  Subscription,
  SubscriptionEvent,
  PlanConfig,
  SubscriptionPlanType,
  TablesInsert
} from '@/shared/types/database.types'

// Plan pricing in cents (for display purposes - Stripe prices are configured in Stripe Dashboard)
export const PLAN_PRICING = {
  trial: { monthly: 0, annual: 0 },
  starter: { monthly: 7900, annual: 79000 },
  professional: { monthly: 14900, annual: 149000 },
  enterprise: { monthly: 29900, annual: 299000 },
} as const

// Plan limits
export const PLAN_LIMITS = {
  trial: { max_children: 15, max_staff: 3 },
  starter: { max_children: 15, max_staff: 3 },
  professional: { max_children: 50, max_staff: 10 },
  enterprise: { max_children: 150, max_staff: 999 },
} as const

// Plan features
export const PLAN_FEATURES = {
  trial: ['all_features', '14_days'],
  starter: ['check_in', 'billing', 'reports', 'ai_support', 'parent_communication'],
  professional: ['all_starter', 'ratio_tracking', 'advanced_reports', 'priority_support'],
  enterprise: ['all_professional', 'multi_location', 'api_access', 'dedicated_onboarding', 'custom_branding'],
} as const

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
    await supabase
      .from('organizations')
      .update({
        stripe_subscription_id: input.stripe_subscription_id,
        plan: input.plan,
        subscription_status: 'active',
        current_period_start: input.current_period_start,
        current_period_end: input.current_period_end,
        cancel_at_period_end: input.cancel_at_period_end || false,
        max_children: PLAN_LIMITS[input.plan as keyof typeof PLAN_LIMITS]?.max_children || 15,
        max_staff: PLAN_LIMITS[input.plan as keyof typeof PLAN_LIMITS]?.max_staff || 3,
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
   */
  formatPrice(cents: number, locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100)
  },

  /**
   * Calculate annual savings
   */
  getAnnualSavings(planType: SubscriptionPlanType): {
    monthlyTotal: number
    annualPrice: number
    savings: number
    monthsFree: number
  } {
    const pricing = PLAN_PRICING[planType]
    const monthlyTotal = pricing.monthly * 12
    const savings = monthlyTotal - pricing.annual

    return {
      monthlyTotal,
      annualPrice: pricing.annual,
      savings,
      monthsFree: Math.round(savings / pricing.monthly),
    }
  },
}

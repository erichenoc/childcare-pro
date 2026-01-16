import { createClient } from '@/shared/lib/supabase/client'
import type {
  Organization as DbOrganization,
  TablesInsert,
  TablesUpdate,
  SubscriptionPlanType
} from '@/shared/types/database.types'

// Extended organization type with subscription fields
export interface Organization extends DbOrganization {
  trial_ends_at: string | null
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  max_children: number | null
  max_staff: number | null
  plan: SubscriptionPlanType | null
}

export interface OrganizationSettings {
  license_expiry?: string
  dcf_provider_id?: string
  has_gold_seal?: boolean
  opening_time?: string
  closing_time?: string
  capacity?: number
  notification_email?: boolean
  notification_sms?: boolean
  notification_push?: boolean
  theme?: 'light' | 'dark' | 'system'
  locale?: string
}

export interface CreateOrganizationInput {
  name: string
  slug: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  license_number?: string
  logo_url?: string
}

// Default trial duration in days
const TRIAL_DURATION_DAYS = 14

// Default limits for trial plan
const TRIAL_LIMITS = {
  max_children: 15,
  max_staff: 3,
}

export const organizationService = {
  /**
   * Get organization by ID
   */
  async getById(orgId: string): Promise<Organization | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as Organization
  },

  /**
   * Get organization by slug (for public routes)
   */
  async getBySlug(slug: string): Promise<Organization | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as Organization
  },

  /**
   * Get current user's organization
   */
  async getCurrentUserOrg(): Promise<Organization | null> {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get user's profile to find organization_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.organization_id) return null

    return this.getById(profile.organization_id)
  },

  /**
   * Create a new organization with trial period
   */
  async create(input: CreateOrganizationInput, ownerId: string): Promise<Organization> {
    const supabase = createClient()

    // Calculate trial end date
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS)

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: input.name,
        slug: input.slug,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        zip_code: input.zip_code || null,
        license_number: input.license_number || null,
        logo_url: input.logo_url || null,
        plan: 'trial' as SubscriptionPlanType,
        subscription_status: 'active',
        trial_ends_at: trialEndsAt.toISOString(),
        max_children: TRIAL_LIMITS.max_children,
        max_staff: TRIAL_LIMITS.max_staff,
        settings: {
          theme: 'system',
          locale: 'es',
          notification_email: true,
          notification_sms: false,
          notification_push: true,
        },
      } as TablesInsert<'organizations'>)
      .select()
      .single()

    if (orgError) throw orgError

    // Update owner profile with organization_id and is_org_owner flag
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        organization_id: org.id,
        is_org_owner: true,
        role: 'owner',
      })
      .eq('id', ownerId)

    if (profileError) {
      // Rollback: delete organization if profile update fails
      await supabase.from('organizations').delete().eq('id', org.id)
      throw profileError
    }

    return org as Organization
  },

  /**
   * Update organization details
   */
  async update(orgId: string, updates: TablesUpdate<'organizations'>): Promise<Organization> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select()
      .single()

    if (error) throw error
    return data as Organization
  },

  /**
   * Update organization settings
   */
  async updateSettings(orgId: string, settings: Partial<OrganizationSettings>): Promise<Organization> {
    const supabase = createClient()

    // Get current settings first
    const current = await this.getById(orgId)
    const currentSettings = (current?.settings as OrganizationSettings) || {}

    const { data, error } = await supabase
      .from('organizations')
      .update({
        settings: { ...currentSettings, ...settings },
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select()
      .single()

    if (error) throw error
    return data as Organization
  },

  /**
   * Update organization logo
   */
  async updateLogo(orgId: string, logoUrl: string): Promise<Organization> {
    return this.update(orgId, { logo_url: logoUrl })
  },

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (error && error.code === 'PGRST116') return true
    return !data
  },

  /**
   * Generate unique slug from organization name
   */
  async generateSlug(name: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50)

    let slug = baseSlug
    let counter = 1

    while (!(await this.isSlugAvailable(slug))) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    return slug
  },

  /**
   * Get organization stats
   */
  async getStats(orgId: string) {
    const supabase = createClient()

    const [childrenResult, staffResult, familiesResult, classroomsResult] = await Promise.all([
      supabase
        .from('children')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'active'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .neq('role', 'parent'),
      supabase
        .from('families')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
      supabase
        .from('classrooms')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'active'),
    ])

    return {
      childrenCount: childrenResult.count || 0,
      staffCount: staffResult.count || 0,
      familiesCount: familiesResult.count || 0,
      classroomsCount: classroomsResult.count || 0,
    }
  },

  /**
   * Check if organization is within plan limits
   */
  async checkLimits(orgId: string): Promise<{
    withinLimits: boolean
    children: { current: number; max: number }
    staff: { current: number; max: number }
  }> {
    const org = await this.getById(orgId)
    if (!org) throw new Error('Organization not found')

    const stats = await this.getStats(orgId)

    const maxChildren = org.max_children || 15
    const maxStaff = org.max_staff || 3

    return {
      withinLimits: stats.childrenCount < maxChildren && stats.staffCount < maxStaff,
      children: { current: stats.childrenCount, max: maxChildren },
      staff: { current: stats.staffCount, max: maxStaff },
    }
  },

  /**
   * Check if organization subscription is active (including trial)
   */
  async isSubscriptionActive(orgId: string): Promise<boolean> {
    const org = await this.getById(orgId)
    if (!org) return false

    // Check trial
    if (org.trial_ends_at && new Date(org.trial_ends_at) > new Date()) {
      return true
    }

    // Check active subscription
    if (org.subscription_status === 'active') {
      if (!org.current_period_end) return true
      return new Date(org.current_period_end) > new Date()
    }

    return false
  },

  /**
   * Get remaining trial days
   */
  async getTrialDaysRemaining(orgId: string): Promise<number> {
    const org = await this.getById(orgId)
    if (!org || !org.trial_ends_at) return 0

    const now = new Date()
    const trialEnd = new Date(org.trial_ends_at)
    const diff = trialEnd.getTime() - now.getTime()

    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  },
}

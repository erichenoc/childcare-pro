import { createClient } from '@/shared/lib/supabase/client'
import type { TablesUpdate } from '@/shared/types/database.types'

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

export interface Organization {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  license_number: string | null
  logo_url: string | null
  settings: OrganizationSettings | null
  subscription_plan: string | null
  subscription_status: string | null
  created_at: string | null
  updated_at: string | null
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

export const organizationService = {
  async get(): Promise<Organization | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', DEMO_ORG_ID)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as Organization
  },

  async update(updates: TablesUpdate<'organizations'>): Promise<Organization> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', DEMO_ORG_ID)
      .select()
      .single()

    if (error) throw error
    return data as Organization
  },

  async updateSettings(settings: Partial<OrganizationSettings>): Promise<Organization> {
    const supabase = createClient()

    // Get current settings first
    const current = await this.get()
    const currentSettings = (current?.settings as OrganizationSettings) || {}

    const { data, error } = await supabase
      .from('organizations')
      .update({
        settings: { ...currentSettings, ...settings },
        updated_at: new Date().toISOString(),
      })
      .eq('id', DEMO_ORG_ID)
      .select()
      .single()

    if (error) throw error
    return data as Organization
  },

  async getStats() {
    const supabase = createClient()

    // Get counts from related tables
    const [childrenResult, staffResult, familiesResult] = await Promise.all([
      supabase.from('children').select('id', { count: 'exact', head: true }).eq('organization_id', DEMO_ORG_ID),
      supabase.from('staff').select('id', { count: 'exact', head: true }).eq('organization_id', DEMO_ORG_ID).eq('status', 'active'),
      supabase.from('families').select('id', { count: 'exact', head: true }).eq('organization_id', DEMO_ORG_ID),
    ])

    return {
      childrenCount: childrenResult.count || 0,
      staffCount: staffResult.count || 0,
      familiesCount: familiesResult.count || 0,
    }
  },
}

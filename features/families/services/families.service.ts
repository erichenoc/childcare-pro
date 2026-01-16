import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { Family, FamilyWithChildren, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

export const familiesService = {
  async getAll(): Promise<Family[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<FamilyWithChildren | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('families')
      .select(`
        *,
        children (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as FamilyWithChildren
  },

  async create(family: Omit<TablesInsert<'families'>, 'organization_id'>): Promise<Family> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('families')
      .insert({
        ...family,
        organization_id: orgId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, family: TablesUpdate<'families'>): Promise<Family> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('families')
      .update(family)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('families')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getStats() {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('families')
      .select('id, status, balance')
      .eq('organization_id', orgId)

    if (error) throw error

    const families = data || []
    const total = families.length
    const active = families.filter(f => f.status === 'active').length
    const withBalance = families.filter(f => (f.balance || 0) > 0).length
    const totalBalance = families.reduce((sum, f) => sum + (f.balance || 0), 0)

    return { total, active, withBalance, totalBalance }
  }
}

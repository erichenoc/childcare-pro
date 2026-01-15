import { createClient } from '@/shared/lib/supabase/client'
import type { Incident, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

export interface IncidentWithRelations extends Incident {
  child?: {
    id: string
    first_name: string
    last_name: string
  } | null
  reporter?: {
    id: string
    first_name: string
    last_name: string
  } | null
  classroom?: {
    id: string
    name: string
  } | null
}

export const incidentsService = {
  async getAll(): Promise<IncidentWithRelations[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        child:children(id, first_name, last_name),
        reporter:staff!incidents_reported_by_fkey(id, first_name, last_name),
        classroom:classrooms(id, name)
      `)
      .eq('organization_id', DEMO_ORG_ID)
      .order('occurred_at', { ascending: false })

    if (error) throw error
    return (data || []) as IncidentWithRelations[]
  },

  async getById(id: string): Promise<IncidentWithRelations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        child:children(id, first_name, last_name),
        reporter:staff!incidents_reported_by_fkey(id, first_name, last_name),
        classroom:classrooms(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as IncidentWithRelations
  },

  async getByChild(childId: string): Promise<IncidentWithRelations[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        child:children(id, first_name, last_name),
        reporter:staff!incidents_reported_by_fkey(id, first_name, last_name),
        classroom:classrooms(id, name)
      `)
      .eq('child_id', childId)
      .order('occurred_at', { ascending: false })

    if (error) throw error
    return (data || []) as IncidentWithRelations[]
  },

  async create(incident: Omit<TablesInsert<'incidents'>, 'organization_id'>): Promise<Incident> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('incidents')
      .insert({
        ...incident,
        organization_id: DEMO_ORG_ID,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, incident: TablesUpdate<'incidents'>): Promise<Incident> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('incidents')
      .update(incident)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('incidents')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getStats() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('incidents')
      .select('id, status, severity')
      .eq('organization_id', DEMO_ORG_ID)

    if (error) throw error

    const incidents = data || []
    const total = incidents.length
    const open = incidents.filter(i => i.status === 'pending' || i.status === 'active').length
    const resolved = incidents.filter(i => i.status === 'inactive').length
    const severe = incidents.filter(i => i.severity === 'high').length

    return { total, open, resolved, severe }
  },
}

import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { Incident, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

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
    const orgId = await requireOrgId()

    // Query incidents with basic relations (no foreign key hint for staff)
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        child:children(id, first_name, last_name),
        classroom:classrooms(id, name)
      `)
      .eq('organization_id', orgId)
      .order('occurred_at', { ascending: false })

    if (error) throw error

    // Fetch reporter info separately if needed
    const incidents = data || []
    const reporterIds = [...new Set(incidents.map(i => i.reported_by).filter(Boolean))]

    let reportersMap: Record<string, { id: string; first_name: string; last_name: string }> = {}
    if (reporterIds.length > 0) {
      const { data: reporters } = await supabase
        .from('staff')
        .select('id, first_name, last_name')
        .in('id', reporterIds)

      if (reporters) {
        reportersMap = Object.fromEntries(reporters.map(r => [r.id, r]))
      }
    }

    return incidents.map(incident => ({
      ...incident,
      reporter: incident.reported_by ? reportersMap[incident.reported_by] || null : null,
    })) as IncidentWithRelations[]
  },

  async getById(id: string): Promise<IncidentWithRelations | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        child:children(id, first_name, last_name),
        classroom:classrooms(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    // Fetch reporter info separately
    let reporter = null
    if (data.reported_by) {
      const { data: reporterData } = await supabase
        .from('staff')
        .select('id, first_name, last_name')
        .eq('id', data.reported_by)
        .single()
      reporter = reporterData
    }

    return { ...data, reporter } as IncidentWithRelations
  },

  async getByChild(childId: string): Promise<IncidentWithRelations[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        child:children(id, first_name, last_name),
        classroom:classrooms(id, name)
      `)
      .eq('child_id', childId)
      .order('occurred_at', { ascending: false })

    if (error) throw error

    // Fetch reporter info separately
    const incidents = data || []
    const reporterIds = [...new Set(incidents.map(i => i.reported_by).filter(Boolean))]

    let reportersMap: Record<string, { id: string; first_name: string; last_name: string }> = {}
    if (reporterIds.length > 0) {
      const { data: reporters } = await supabase
        .from('staff')
        .select('id, first_name, last_name')
        .in('id', reporterIds)

      if (reporters) {
        reportersMap = Object.fromEntries(reporters.map(r => [r.id, r]))
      }
    }

    return incidents.map(incident => ({
      ...incident,
      reporter: incident.reported_by ? reportersMap[incident.reported_by] || null : null,
    })) as IncidentWithRelations[]
  },

  async create(incident: Omit<TablesInsert<'incidents'>, 'organization_id'>): Promise<Incident> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data, error } = await supabase
      .from('incidents')
      .insert({
        ...incident,
        organization_id: orgId,
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
    const orgId = await requireOrgId()
    const { data, error } = await supabase
      .from('incidents')
      .select('id, status, severity')
      .eq('organization_id', orgId)

    if (error) throw error

    const incidents = data || []
    const total = incidents.length
    // Synced with backend status types: open, pending_signature, pending_closure, closed
    const open = incidents.filter(i => i.status === 'open' || i.status === 'pending_signature' || i.status === 'pending_closure').length
    const resolved = incidents.filter(i => i.status === 'closed').length
    // Synced with backend severity types: minor, moderate, serious, critical
    const severe = incidents.filter(i => i.severity === 'serious' || i.severity === 'critical').length

    return { total, open, resolved, severe }
  },
}

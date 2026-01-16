import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { Profile, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

export type StaffWithAssignments = Profile & {
  staff_assignments?: {
    id: string
    classroom_id: string
    is_lead: boolean
    classroom?: {
      id: string
      name: string
    }
  }[]
}

export const staffService = {
  async getAll(): Promise<Profile[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', orgId)
      .in('role', ['teacher', 'assistant', 'admin', 'director'])
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<StaffWithAssignments | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        staff_assignments (
          id,
          classroom_id,
          is_lead,
          classroom:classrooms (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as StaffWithAssignments
  },

  async create(profile: Omit<TablesInsert<'profiles'>, 'id' | 'organization_id'>): Promise<Profile> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        ...profile,
        id,
        organization_id: orgId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, profile: TablesUpdate<'profiles'>): Promise<Profile> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getStats() {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, status, role')
      .eq('organization_id', orgId)
      .in('role', ['teacher', 'assistant', 'admin', 'director'])

    if (error) throw error

    const staff = data || []
    const total = staff.length
    const active = staff.filter(s => s.status === 'active').length
    const teachers = staff.filter(s => s.role === 'teacher').length
    const assistants = staff.filter(s => s.role === 'assistant').length

    return { total, active, teachers, assistants }
  },

  async assignToClassroom(profileId: string, classroomId: string, isLead: boolean = false) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('staff_assignments')
      .insert({
        profile_id: profileId,
        classroom_id: classroomId,
        is_lead: isLead,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removeFromClassroom(assignmentId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('staff_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw error
  },
}

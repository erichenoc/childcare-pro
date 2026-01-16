import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { Child, ChildWithFamily, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

export const childrenService = {
  async getAll(): Promise<ChildWithFamily[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        family:families(*),
        classroom:classrooms(*)
      `)
      .eq('organization_id', orgId)
      .order('first_name', { ascending: true })

    if (error) throw error
    return (data || []) as ChildWithFamily[]
  },

  async getById(id: string): Promise<ChildWithFamily | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        family:families(*),
        classroom:classrooms(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as ChildWithFamily
  },

  async getByClassroom(classroomId: string): Promise<ChildWithFamily[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        family:families(*),
        classroom:classrooms(*)
      `)
      .eq('classroom_id', classroomId)
      .eq('status', 'active')
      .order('first_name', { ascending: true })

    if (error) throw error
    return (data || []) as ChildWithFamily[]
  },

  async create(child: Omit<TablesInsert<'children'>, 'organization_id'>): Promise<Child> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('children')
      .insert({
        ...child,
        organization_id: orgId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, child: TablesUpdate<'children'>): Promise<Child> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('children')
      .update(child)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getStats(date: string = new Date().toISOString().split('T')[0]) {
    const supabase = createClient()
    const orgId = await requireOrgId()

    // Get all children
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, status')
      .eq('organization_id', orgId)
      .eq('status', 'active')

    if (childrenError) throw childrenError

    // Get attendance for today
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('child_id, status')
      .eq('organization_id', orgId)
      .eq('date', date)

    if (attendanceError) throw attendanceError

    const total = children?.length || 0
    const present = attendance?.filter(a => a.status === 'present').length || 0
    const absent = total - present

    return { total, present, absent }
  }
}

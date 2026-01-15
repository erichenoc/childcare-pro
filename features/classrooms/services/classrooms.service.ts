import { createClient } from '@/shared/lib/supabase/client'
import type { Classroom, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

export type ClassroomWithStats = Classroom & {
  children_count: number
  staff_count: number
  current_ratio: number
}

export const classroomsService = {
  async getAll(): Promise<Classroom[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('organization_id', DEMO_ORG_ID)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Classroom | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  async getWithStats(): Promise<ClassroomWithStats[]> {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Get classrooms
    const { data: classrooms, error: classroomsError } = await supabase
      .from('classrooms')
      .select('*')
      .eq('organization_id', DEMO_ORG_ID)
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (classroomsError) throw classroomsError

    // Get children count per classroom (present today)
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('classroom_id')
      .eq('organization_id', DEMO_ORG_ID)
      .eq('date', today)
      .eq('status', 'present')

    if (attendanceError) throw attendanceError

    // Get staff assignments
    const { data: staffAssignments, error: staffError } = await supabase
      .from('staff_assignments')
      .select('classroom_id')
      .eq('organization_id', DEMO_ORG_ID)
      .eq('status', 'active')

    if (staffError) throw staffError

    // Calculate stats for each classroom
    return (classrooms || []).map(classroom => {
      const children_count = attendance?.filter(a => a.classroom_id === classroom.id).length || 0
      const staff_count = staffAssignments?.filter(s => s.classroom_id === classroom.id).length || 0
      const current_ratio = staff_count > 0 ? Math.round((children_count / staff_count) * 10) / 10 : 0

      return {
        ...classroom,
        children_count,
        staff_count,
        current_ratio,
      }
    })
  },

  async create(classroom: Omit<TablesInsert<'classrooms'>, 'organization_id'>): Promise<Classroom> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('classrooms')
      .insert({
        ...classroom,
        organization_id: DEMO_ORG_ID,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, classroom: TablesUpdate<'classrooms'>): Promise<Classroom> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('classrooms')
      .update(classroom)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('classrooms')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

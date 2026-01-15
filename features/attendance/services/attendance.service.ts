import { createClient } from '@/shared/lib/supabase/client'
import type { Attendance, AttendanceWithChild, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

export const attendanceService = {
  async getByDate(date: string): Promise<AttendanceWithChild[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        child:children(*),
        classroom:classrooms(*)
      `)
      .eq('organization_id', DEMO_ORG_ID)
      .eq('date', date)
      .order('check_in_time', { ascending: true })

    if (error) throw error
    return (data || []) as AttendanceWithChild[]
  },

  async getByChild(childId: string, startDate?: string, endDate?: string): Promise<Attendance[]> {
    const supabase = createClient()
    let query = supabase
      .from('attendance')
      .select('*')
      .eq('child_id', childId)
      .order('date', { ascending: false })

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async checkIn(childId: string, classroomId: string, checkedInBy?: string): Promise<Attendance> {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // Check if already has attendance record for today
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('child_id', childId)
      .eq('date', today)
      .single()

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('attendance')
        .update({
          check_in_time: now,
          status: 'present',
          checked_in_by: checkedInBy,
          classroom_id: classroomId,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          organization_id: DEMO_ORG_ID,
          child_id: childId,
          classroom_id: classroomId,
          date: today,
          check_in_time: now,
          status: 'present',
          checked_in_by: checkedInBy,
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  async checkOut(childId: string, checkedOutBy?: string): Promise<Attendance> {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out_time: now,
        checked_out_by: checkedOutBy,
      })
      .eq('child_id', childId)
      .eq('date', today)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async markAbsent(childId: string, date: string, notes?: string): Promise<Attendance> {
    const supabase = createClient()

    // Get child's classroom
    const { data: child } = await supabase
      .from('children')
      .select('classroom_id')
      .eq('id', childId)
      .single()

    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        organization_id: DEMO_ORG_ID,
        child_id: childId,
        classroom_id: child?.classroom_id,
        date,
        status: 'absent',
        notes,
      }, {
        onConflict: 'child_id,date',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getDailyStats(date: string) {
    const supabase = createClient()

    // Get all active children
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, classroom_id')
      .eq('organization_id', DEMO_ORG_ID)
      .eq('status', 'active')

    if (childrenError) throw childrenError

    // Get attendance for the date
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('child_id, status, classroom_id')
      .eq('organization_id', DEMO_ORG_ID)
      .eq('date', date)

    if (attendanceError) throw attendanceError

    const total = children?.length || 0
    const present = attendance?.filter(a => a.status === 'present').length || 0
    const absent = total - present
    const late = attendance?.filter(a => a.status === 'late').length || 0
    const sick = attendance?.filter(a => a.status === 'sick').length || 0

    // Group by classroom
    const byClassroom = new Map<string, { present: number; total: number }>()
    children?.forEach(child => {
      if (child.classroom_id) {
        const existing = byClassroom.get(child.classroom_id) || { present: 0, total: 0 }
        existing.total++
        byClassroom.set(child.classroom_id, existing)
      }
    })
    attendance?.forEach(record => {
      if (record.classroom_id && record.status === 'present') {
        const existing = byClassroom.get(record.classroom_id) || { present: 0, total: 0 }
        existing.present++
        byClassroom.set(record.classroom_id, existing)
      }
    })

    return {
      total,
      present,
      absent,
      late,
      sick,
      byClassroom: Object.fromEntries(byClassroom),
    }
  },

  async getStats() {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('organization_id', DEMO_ORG_ID)
      .eq('date', today)

    if (error) throw error

    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      total: data?.length || 0,
    }

    data?.forEach(record => {
      if (record.status === 'present') stats.present++
      else if (record.status === 'absent') stats.absent++
      else if (record.status === 'late') stats.late++
    })

    return stats
  }
}

import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { StaffAttendance, TablesInsert } from '@/shared/types/database.types'

export type StaffAttendanceWithStaff = StaffAttendance & {
  staff?: {
    id: string
    first_name: string
    last_name: string
    role: string
  } | null
}

export const staffAttendanceService = {
  async getByDate(date: string): Promise<StaffAttendanceWithStaff[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data, error } = await supabase
      .from('staff_attendance')
      .select(`
        *,
        staff:staff_id (
          id,
          first_name,
          last_name,
          role
        )
      `)
      .eq('organization_id', orgId)
      .eq('date', date)
      .order('check_in', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getByStaff(staffId: string, startDate?: string, endDate?: string): Promise<StaffAttendance[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    let query = supabase
      .from('staff_attendance')
      .select('*')
      .eq('organization_id', orgId)
      .eq('staff_id', staffId)
      .order('date', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async checkIn(staffId: string, classroomId?: string): Promise<StaffAttendance> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('staff_attendance')
      .insert({
        organization_id: orgId,
        staff_id: staffId,
        classroom_id: classroomId || null,
        date: today,
        check_in: now,
        status: 'present',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async checkOut(attendanceId: string): Promise<StaffAttendance> {
    const supabase = createClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('staff_attendance')
      .update({
        check_out: now,
      })
      .eq('id', attendanceId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateStatus(
    attendanceId: string,
    status: 'present' | 'absent' | 'late' | 'left_early'
  ): Promise<StaffAttendance> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('staff_attendance')
      .update({ status })
      .eq('id', attendanceId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async create(attendance: Omit<TablesInsert<'staff_attendance'>, 'organization_id'>): Promise<StaffAttendance> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('staff_attendance')
      .insert({
        ...attendance,
        organization_id: orgId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getTodayStats() {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('staff_attendance')
      .select('status')
      .eq('organization_id', orgId)
      .eq('date', today)

    if (error) throw error

    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      left_early: 0,
      total: data?.length || 0,
    }

    data?.forEach(record => {
      if (record.status === 'present') stats.present++
      else if (record.status === 'absent') stats.absent++
      else if (record.status === 'late') stats.late++
      else if (record.status === 'left_early') stats.left_early++
    })

    return stats
  },

  async getWeeklyStats(staffId: string) {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('staff_attendance')
      .select('date, status, check_in, check_out')
      .eq('organization_id', orgId)
      .eq('staff_id', staffId)
      .gte('date', weekAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) throw error

    // Calculate total hours worked
    let totalHours = 0
    data?.forEach(record => {
      if (record.check_in && record.check_out) {
        const checkIn = new Date(record.check_in)
        const checkOut = new Date(record.check_out)
        const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
        totalHours += hours
      }
    })

    return {
      records: data || [],
      totalHours: Math.round(totalHours * 10) / 10,
      daysWorked: data?.filter(r => r.status === 'present' || r.status === 'late').length || 0,
    }
  },
}

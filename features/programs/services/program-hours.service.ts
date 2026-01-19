// =====================================================
// Program Hours Service
// Automatically track VPK and School Readiness hours
// =====================================================

import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'

// Types for program hours tracking
export interface ProgramHoursResult {
  vpk_hours?: number
  sr_hours?: number
  total_hours: number
  vpk_enrollment_id?: string
  sr_enrollment_id?: string
  errors: string[]
}

// Helper to calculate hours between two timestamps
function calculateHours(checkInTime: string, checkOutTime: string): number {
  const checkIn = new Date(checkInTime)
  const checkOut = new Date(checkOutTime)
  const diffMs = checkOut.getTime() - checkIn.getTime()
  const hours = diffMs / (1000 * 60 * 60)
  // Round to 2 decimal places
  return Math.round(hours * 100) / 100
}

// Get current school year (August to July)
function getCurrentSchoolYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-12

  if (month >= 8) {
    // August or later: current year - next year
    return `${year}-${year + 1}`
  } else {
    // Before August: previous year - current year
    return `${year - 1}-${year}`
  }
}

export const programHoursService = {
  /**
   * Get child's program type and active enrollment IDs
   */
  async getChildProgramInfo(childId: string): Promise<{
    program_type: string | null
    vpk_enrollment_id: string | null
    sr_enrollment_id: string | null
  }> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const schoolYear = getCurrentSchoolYear()

    // Get child's program type
    const { data: child } = await supabase
      .from('children')
      .select('program_type')
      .eq('id', childId)
      .single()

    if (!child?.program_type) {
      return { program_type: null, vpk_enrollment_id: null, sr_enrollment_id: null }
    }

    let vpk_enrollment_id: string | null = null
    let sr_enrollment_id: string | null = null

    // Check for VPK enrollment if VPK program
    if (child.program_type === 'vpk' || child.program_type === 'vpk_wraparound') {
      const { data: vpkEnrollment } = await supabase
        .from('vpk_enrollments')
        .select('id')
        .eq('organization_id', orgId)
        .eq('child_id', childId)
        .eq('school_year', schoolYear)
        .eq('status', 'active')
        .single()

      vpk_enrollment_id = vpkEnrollment?.id || null
    }

    // Check for SR enrollment if SR program
    if (child.program_type === 'school_readiness' || child.program_type === 'sr_copay') {
      const { data: srEnrollment } = await supabase
        .from('sr_enrollments')
        .select('id')
        .eq('organization_id', orgId)
        .eq('child_id', childId)
        .eq('school_year', schoolYear)
        .eq('status', 'active')
        .single()

      sr_enrollment_id = srEnrollment?.id || null
    }

    return {
      program_type: child.program_type,
      vpk_enrollment_id,
      sr_enrollment_id,
    }
  },

  /**
   * Record program hours after check-out
   * This creates entries in vpk_attendance or sr_attendance tables
   * The database triggers will automatically update the enrollment hours_completed
   */
  async recordProgramHours(
    childId: string,
    attendanceId: string,
    checkInTime: string,
    checkOutTime: string,
    date: string
  ): Promise<ProgramHoursResult> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const errors: string[] = []

    // Calculate total hours
    const totalHours = calculateHours(checkInTime, checkOutTime)

    // Get child's program info
    const programInfo = await this.getChildProgramInfo(childId)

    const result: ProgramHoursResult = {
      total_hours: totalHours,
      errors,
    }

    // If no program type, return early
    if (!programInfo.program_type || programInfo.program_type === 'private') {
      return result
    }

    // VPK hours tracking
    if (programInfo.vpk_enrollment_id) {
      try {
        // VPK is typically 3 hours/day (school year) or 6 hours/day (summer)
        // We record up to the max VPK hours allowed
        const vpkHours = Math.min(totalHours, 6) // Max 6 hours per day for summer VPK

        const { error: vpkError } = await supabase
          .from('vpk_attendance')
          .upsert({
            organization_id: orgId,
            vpk_enrollment_id: programInfo.vpk_enrollment_id,
            child_id: childId,
            date: date,
            hours: vpkHours,
            attendance_id: attendanceId,
          }, {
            onConflict: 'vpk_enrollment_id,date',
          })

        if (vpkError) {
          console.error('Error recording VPK hours:', vpkError)
          errors.push(`VPK: ${vpkError.message}`)
        } else {
          result.vpk_hours = vpkHours
          result.vpk_enrollment_id = programInfo.vpk_enrollment_id
        }
      } catch (error) {
        console.error('Error recording VPK hours:', error)
        errors.push(`VPK: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // SR hours tracking
    if (programInfo.sr_enrollment_id) {
      try {
        const checkInTimePart = new Date(checkInTime).toTimeString().split(' ')[0]
        const checkOutTimePart = new Date(checkOutTime).toTimeString().split(' ')[0]

        const { error: srError } = await supabase
          .from('sr_attendance')
          .upsert({
            organization_id: orgId,
            sr_enrollment_id: programInfo.sr_enrollment_id,
            child_id: childId,
            date: date,
            check_in_time: checkInTimePart,
            check_out_time: checkOutTimePart,
            hours: totalHours,
            is_absent: false,
            attendance_id: attendanceId,
          }, {
            onConflict: 'sr_enrollment_id,date',
          })

        if (srError) {
          console.error('Error recording SR hours:', srError)
          errors.push(`SR: ${srError.message}`)
        } else {
          result.sr_hours = totalHours
          result.sr_enrollment_id = programInfo.sr_enrollment_id
        }
      } catch (error) {
        console.error('Error recording SR hours:', error)
        errors.push(`SR: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  },

  /**
   * Get VPK hours summary for a child
   */
  async getVPKHoursSummary(childId: string): Promise<{
    total_required: number
    hours_completed: number
    hours_remaining: number
    is_complete: boolean
    percent_complete: number
    schedule_type: string
  } | null> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const schoolYear = getCurrentSchoolYear()

    const { data, error } = await supabase
      .from('vpk_enrollments')
      .select('*')
      .eq('organization_id', orgId)
      .eq('child_id', childId)
      .eq('school_year', schoolYear)
      .eq('status', 'active')
      .single()

    if (error || !data) {
      return null
    }

    return {
      total_required: data.required_hours || (data.program_type === 'summer' ? 300 : 540),
      hours_completed: data.hours_completed || 0,
      hours_remaining: data.hours_remaining || 0,
      is_complete: data.is_hours_complete || false,
      percent_complete: data.required_hours
        ? Math.round(((data.hours_completed || 0) / data.required_hours) * 100)
        : 0,
      schedule_type: data.program_type || 'school_year',
    }
  },

  /**
   * Get SR hours summary for a child (for current week)
   */
  async getSRHoursSummary(childId: string, weekStart?: string): Promise<{
    authorized_weekly: number
    hours_used: number
    hours_remaining: number
    percent_used: number
    total_absences: number
    consecutive_absences: number
  } | null> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const schoolYear = getCurrentSchoolYear()

    // Get SR enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('sr_enrollments')
      .select('*')
      .eq('organization_id', orgId)
      .eq('child_id', childId)
      .eq('school_year', schoolYear)
      .eq('status', 'active')
      .single()

    if (enrollError || !enrollment) {
      return null
    }

    // Calculate week boundaries
    const today = new Date()
    const startOfWeek = weekStart
      ? new Date(weekStart)
      : new Date(today.setDate(today.getDate() - today.getDay() + 1)) // Monday

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6) // Sunday

    // Get hours for this week
    const { data: attendance } = await supabase
      .from('sr_attendance')
      .select('hours')
      .eq('sr_enrollment_id', enrollment.id)
      .gte('date', startOfWeek.toISOString().split('T')[0])
      .lte('date', endOfWeek.toISOString().split('T')[0])

    const hoursUsed = attendance?.reduce((sum, a) => sum + (a.hours || 0), 0) || 0
    const authorizedWeekly = enrollment.authorized_hours_weekly || 0

    return {
      authorized_weekly: authorizedWeekly,
      hours_used: hoursUsed,
      hours_remaining: Math.max(0, authorizedWeekly - hoursUsed),
      percent_used: authorizedWeekly > 0 ? Math.round((hoursUsed / authorizedWeekly) * 100) : 0,
      total_absences: enrollment.total_absences || 0,
      consecutive_absences: enrollment.consecutive_absences || 0,
    }
  },
}

export default programHoursService

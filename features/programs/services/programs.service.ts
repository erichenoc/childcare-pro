// Programs Service - VPK and School Readiness
// Florida early education funding programs management

import { createClient } from '@/shared/lib/supabase/client'

// ============================================
// TYPES
// ============================================

export type ProgramType = 'vpk' | 'school_readiness'
export type VPKScheduleType = 'school_year' | 'summer'
export type EnrollmentStatus = 'pending' | 'active' | 'completed' | 'withdrawn' | 'expired'

export interface VPKEnrollment {
  id: string
  organization_id: string
  child_id: string
  child_name?: string
  schedule_type: VPKScheduleType
  student_cert_number: string // VPK certificate number
  enrollment_date: string
  start_date: string
  end_date?: string
  status: EnrollmentStatus
  total_hours_required: number // 540 school year, 300 summer
  hours_attended: number
  hours_remaining: number
  provider_id?: string // ELC provider ID
  classroom_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface SchoolReadinessEnrollment {
  id: string
  organization_id: string
  child_id: string
  child_name?: string
  family_id: string
  case_number: string // SR case number
  eligibility_start: string
  eligibility_end: string
  status: EnrollmentStatus
  authorized_hours_weekly: number // Max weekly hours authorized
  rate_type: 'full_time' | 'part_time' | 'hourly'
  daily_rate?: number
  weekly_rate?: number
  hourly_rate?: number
  copay_amount?: number // Family copay per period
  copay_frequency?: 'weekly' | 'monthly'
  classroom_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ProgramAttendance {
  id: string
  program_type: ProgramType
  enrollment_id: string
  child_id: string
  attendance_date: string
  check_in_time?: string
  check_out_time?: string
  hours_attended: number
  is_billable: boolean
  notes?: string
  created_at: string
}

export interface VPKHoursSummary {
  enrollment_id: string
  child_id: string
  child_name: string
  schedule_type: VPKScheduleType
  total_required: number
  hours_attended: number
  hours_remaining: number
  percent_complete: number
  days_attended: number
  avg_hours_per_day: number
  projected_completion: string | null
  on_track: boolean
}

export interface SRBillingSummary {
  enrollment_id: string
  child_id: string
  child_name: string
  period_start: string
  period_end: string
  authorized_hours: number
  actual_hours: number
  billable_amount: number
  copay_amount: number
  net_reimbursement: number
  attendance_rate: number
}

// ============================================
// CONSTANTS
// ============================================

export const VPK_REQUIREMENTS = {
  school_year: {
    total_hours: 540,
    weeks: 36,
    hours_per_day: 3,
    days_per_week: 5,
  },
  summer: {
    total_hours: 300,
    weeks: 10,
    hours_per_day: 6,
    days_per_week: 5,
  },
} as const

export const SR_RATE_TYPES = [
  { value: 'full_time', label: 'Full Time (30+ hrs/week)' },
  { value: 'part_time', label: 'Part Time (15-29 hrs/week)' },
  { value: 'hourly', label: 'Hourly' },
] as const

// ELC regions in Florida (example - would be configured per organization)
export const ELC_REGIONS = [
  { code: 'ELC-OC', name: 'ELC of Orange County' },
  { code: 'ELC-OS', name: 'ELC of Osceola County' },
  { code: 'ELC-SEM', name: 'ELC of Seminole County' },
  { code: 'ELC-POLK', name: 'ELC of Polk County' },
  { code: 'ELC-LAKE', name: 'ELC of Lake County' },
] as const

// ============================================
// SERVICE FUNCTIONS
// ============================================

class ProgramsService {
  private supabase = createClient()

  // --- VPK Enrollments ---

  async getVPKEnrollments(organizationId?: string): Promise<VPKEnrollment[]> {
    let query = this.supabase
      .from('vpk_enrollments')
      .select(`
        *,
        children:child_id (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching VPK enrollments:', error)
      return []
    }

    return (data || []).map(e => ({
      ...e,
      child_name: e.children
        ? `${e.children.first_name} ${e.children.last_name}`
        : undefined,
    }))
  }

  async getVPKEnrollment(id: string): Promise<VPKEnrollment | null> {
    const { data, error } = await this.supabase
      .from('vpk_enrollments')
      .select(`
        *,
        children:child_id (
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching VPK enrollment:', error)
      return null
    }

    return {
      ...data,
      child_name: data.children
        ? `${data.children.first_name} ${data.children.last_name}`
        : undefined,
    }
  }

  async createVPKEnrollment(
    enrollment: Omit<VPKEnrollment, 'id' | 'created_at' | 'updated_at' | 'hours_attended' | 'hours_remaining'>
  ): Promise<VPKEnrollment | null> {
    const totalRequired = VPK_REQUIREMENTS[enrollment.schedule_type].total_hours

    const { data, error } = await this.supabase
      .from('vpk_enrollments')
      .insert({
        ...enrollment,
        total_hours_required: totalRequired,
        hours_attended: 0,
        hours_remaining: totalRequired,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating VPK enrollment:', error)
      return null
    }

    return data
  }

  async updateVPKEnrollment(
    id: string,
    updates: Partial<VPKEnrollment>
  ): Promise<VPKEnrollment | null> {
    const { data, error } = await this.supabase
      .from('vpk_enrollments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating VPK enrollment:', error)
      return null
    }

    return data
  }

  // --- School Readiness Enrollments ---

  async getSREnrollments(organizationId?: string): Promise<SchoolReadinessEnrollment[]> {
    let query = this.supabase
      .from('school_readiness_enrollments')
      .select(`
        *,
        children:child_id (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching SR enrollments:', error)
      return []
    }

    return (data || []).map(e => ({
      ...e,
      child_name: e.children
        ? `${e.children.first_name} ${e.children.last_name}`
        : undefined,
    }))
  }

  async getSREnrollment(id: string): Promise<SchoolReadinessEnrollment | null> {
    const { data, error } = await this.supabase
      .from('school_readiness_enrollments')
      .select(`
        *,
        children:child_id (
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching SR enrollment:', error)
      return null
    }

    return {
      ...data,
      child_name: data.children
        ? `${data.children.first_name} ${data.children.last_name}`
        : undefined,
    }
  }

  async createSREnrollment(
    enrollment: Omit<SchoolReadinessEnrollment, 'id' | 'created_at' | 'updated_at'>
  ): Promise<SchoolReadinessEnrollment | null> {
    const { data, error } = await this.supabase
      .from('school_readiness_enrollments')
      .insert(enrollment)
      .select()
      .single()

    if (error) {
      console.error('Error creating SR enrollment:', error)
      return null
    }

    return data
  }

  async updateSREnrollment(
    id: string,
    updates: Partial<SchoolReadinessEnrollment>
  ): Promise<SchoolReadinessEnrollment | null> {
    const { data, error } = await this.supabase
      .from('school_readiness_enrollments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating SR enrollment:', error)
      return null
    }

    return data
  }

  // --- Program Attendance ---

  async recordProgramAttendance(
    attendance: Omit<ProgramAttendance, 'id' | 'created_at'>
  ): Promise<ProgramAttendance | null> {
    const { data, error } = await this.supabase
      .from('program_attendance')
      .insert(attendance)
      .select()
      .single()

    if (error) {
      console.error('Error recording program attendance:', error)
      return null
    }

    // Update enrollment hours if VPK
    if (attendance.program_type === 'vpk' && attendance.is_billable) {
      await this.updateVPKHours(attendance.enrollment_id, attendance.hours_attended)
    }

    return data
  }

  async getProgramAttendance(
    programType: ProgramType,
    enrollmentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProgramAttendance[]> {
    let query = this.supabase
      .from('program_attendance')
      .select('*')
      .eq('program_type', programType)
      .eq('enrollment_id', enrollmentId)
      .order('attendance_date', { ascending: false })

    if (startDate) {
      query = query.gte('attendance_date', startDate)
    }
    if (endDate) {
      query = query.lte('attendance_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching program attendance:', error)
      return []
    }

    return data || []
  }

  private async updateVPKHours(enrollmentId: string, hoursToAdd: number): Promise<void> {
    const enrollment = await this.getVPKEnrollment(enrollmentId)
    if (!enrollment) return

    const newHoursAttended = enrollment.hours_attended + hoursToAdd
    const newHoursRemaining = Math.max(0, enrollment.total_hours_required - newHoursAttended)

    await this.updateVPKEnrollment(enrollmentId, {
      hours_attended: newHoursAttended,
      hours_remaining: newHoursRemaining,
      status: newHoursRemaining === 0 ? 'completed' : enrollment.status,
    })
  }

  // --- Reports and Summaries ---

  async getVPKHoursSummary(organizationId?: string): Promise<VPKHoursSummary[]> {
    const enrollments = await this.getVPKEnrollments(organizationId)

    return enrollments
      .filter(e => e.status === 'active')
      .map(enrollment => {
        const percentComplete = (enrollment.hours_attended / enrollment.total_hours_required) * 100
        const requirements = VPK_REQUIREMENTS[enrollment.schedule_type]
        const hoursPerWeek = requirements.hours_per_day * requirements.days_per_week
        const weeksRemaining = enrollment.hours_remaining / hoursPerWeek

        // Calculate days attended (estimated from hours / avg hours per day)
        const avgHoursPerDay = requirements.hours_per_day
        const daysAttended = Math.round(enrollment.hours_attended / avgHoursPerDay)

        // Project completion date
        const today = new Date()
        const projectedCompletion = new Date(today)
        projectedCompletion.setDate(projectedCompletion.getDate() + (weeksRemaining * 7))

        // Determine if on track
        const expectedProgress = this.calculateExpectedVPKProgress(
          enrollment.start_date,
          enrollment.schedule_type
        )
        const onTrack = percentComplete >= expectedProgress * 0.9 // Within 10% of expected

        return {
          enrollment_id: enrollment.id,
          child_id: enrollment.child_id,
          child_name: enrollment.child_name || 'Unknown',
          schedule_type: enrollment.schedule_type,
          total_required: enrollment.total_hours_required,
          hours_attended: enrollment.hours_attended,
          hours_remaining: enrollment.hours_remaining,
          percent_complete: Math.round(percentComplete * 10) / 10,
          days_attended: daysAttended,
          avg_hours_per_day: avgHoursPerDay,
          projected_completion: enrollment.hours_remaining > 0
            ? projectedCompletion.toISOString().split('T')[0]
            : null,
          on_track: onTrack,
        }
      })
  }

  private calculateExpectedVPKProgress(startDate: string, scheduleType: VPKScheduleType): number {
    const start = new Date(startDate)
    const today = new Date()
    const requirements = VPK_REQUIREMENTS[scheduleType]

    // Calculate weeks elapsed
    const msPerWeek = 7 * 24 * 60 * 60 * 1000
    const weeksElapsed = Math.floor((today.getTime() - start.getTime()) / msPerWeek)

    // Expected hours
    const expectedHours = Math.min(
      weeksElapsed * requirements.hours_per_day * requirements.days_per_week,
      requirements.total_hours
    )

    return (expectedHours / requirements.total_hours) * 100
  }

  async getSRBillingSummary(
    organizationId: string | undefined,
    periodStart: string,
    periodEnd: string
  ): Promise<SRBillingSummary[]> {
    const enrollments = await this.getSREnrollments(organizationId)

    const summaries: SRBillingSummary[] = []

    for (const enrollment of enrollments.filter(e => e.status === 'active')) {
      const attendance = await this.getProgramAttendance(
        'school_readiness',
        enrollment.id,
        periodStart,
        periodEnd
      )

      const actualHours = attendance.reduce((sum, a) => sum + a.hours_attended, 0)
      const weeksInPeriod = this.getWeeksInPeriod(periodStart, periodEnd)
      const authorizedHours = enrollment.authorized_hours_weekly * weeksInPeriod

      // Calculate billable amount based on rate type
      let billableAmount = 0
      if (enrollment.rate_type === 'weekly' && enrollment.weekly_rate) {
        billableAmount = enrollment.weekly_rate * weeksInPeriod
      } else if (enrollment.rate_type === 'hourly' && enrollment.hourly_rate) {
        billableAmount = Math.min(actualHours, authorizedHours) * enrollment.hourly_rate
      } else if (enrollment.daily_rate) {
        const daysAttended = attendance.length
        billableAmount = daysAttended * enrollment.daily_rate
      }

      const copayAmount = enrollment.copay_amount || 0
      const copayTotal = enrollment.copay_frequency === 'weekly'
        ? copayAmount * weeksInPeriod
        : copayAmount // Monthly

      summaries.push({
        enrollment_id: enrollment.id,
        child_id: enrollment.child_id,
        child_name: enrollment.child_name || 'Unknown',
        period_start: periodStart,
        period_end: periodEnd,
        authorized_hours: authorizedHours,
        actual_hours: actualHours,
        billable_amount: Math.round(billableAmount * 100) / 100,
        copay_amount: Math.round(copayTotal * 100) / 100,
        net_reimbursement: Math.round((billableAmount - copayTotal) * 100) / 100,
        attendance_rate: authorizedHours > 0
          ? Math.round((actualHours / authorizedHours) * 100)
          : 0,
      })
    }

    return summaries
  }

  private getWeeksInPeriod(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const msPerWeek = 7 * 24 * 60 * 60 * 1000
    return Math.ceil((end.getTime() - start.getTime()) / msPerWeek)
  }

  // --- Children Eligible for Programs ---

  async getChildrenEligibleForVPK(organizationId?: string): Promise<Array<{
    id: string
    first_name: string
    last_name: string
    date_of_birth: string
    age_years: number
    already_enrolled: boolean
  }>> {
    // Get children who are 4 years old
    const fourYearsAgo = new Date()
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 5)
    const fiveYearsAgo = new Date()
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 6)

    let query = this.supabase
      .from('children')
      .select('id, first_name, last_name, date_of_birth')
      .eq('status', 'enrolled')
      .gte('date_of_birth', fiveYearsAgo.toISOString().split('T')[0])
      .lte('date_of_birth', fourYearsAgo.toISOString().split('T')[0])

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: children, error } = await query

    if (error) {
      console.error('Error fetching eligible children:', error)
      return []
    }

    // Get existing VPK enrollments
    const enrollments = await this.getVPKEnrollments(organizationId)
    const enrolledChildIds = new Set(enrollments.map(e => e.child_id))

    return (children || []).map(child => {
      const birthDate = new Date(child.date_of_birth)
      const today = new Date()
      const ageYears = Math.floor(
        (today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      )

      return {
        ...child,
        age_years: ageYears,
        already_enrolled: enrolledChildIds.has(child.id),
      }
    })
  }
}

export const programsService = new ProgramsService()
export default programsService

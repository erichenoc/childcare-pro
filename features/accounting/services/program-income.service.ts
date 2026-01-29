// Program Income Service - ChildCare Pro
// Calculates income from all programs: Fixed Tuition, CACFP, School Readiness, VPK, Summer Camp
// Handles variable income based on attendance, holidays, and program rules

import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'

// ============================================
// TYPES
// ============================================

// Fixed Tuition Types
export interface TuitionRate {
  id: string
  organization_id: string
  name: string
  program_type: 'full_time' | 'part_time' | 'after_school' | 'drop_in' | 'summer_camp'
  age_group: 'infant' | 'toddler' | 'preschool' | 'school_age' | 'all'
  weekly_rate: number
  daily_rate: number | null
  monthly_rate: number | null  // Calculated as weekly * 4.33
  registration_fee: number
  is_active: boolean
  effective_date: string
  created_at: string
}

export interface ChildTuition {
  child_id: string
  child_name: string
  family_id: string
  family_name: string
  program_type: string
  tuition_rate_id: string | null
  weekly_rate: number
  monthly_rate: number
  has_discount: boolean
  discount_percent: number
  discount_reason: string | null
  net_monthly_rate: number
}

// CACFP Food Program Types
export interface CACFPDailyCount {
  date: string
  breakfast_count: number
  am_snack_count: number
  lunch_count: number
  pm_snack_count: number
  supper_count: number
  total_meals: number
}

export interface CACFPMonthlyReport {
  month: string // YYYY-MM
  year: number
  days_open: number
  total_breakfast: number
  total_am_snack: number
  total_lunch: number
  total_pm_snack: number
  total_supper: number
  reimbursement_breakfast: number
  reimbursement_am_snack: number
  reimbursement_lunch: number
  reimbursement_pm_snack: number
  reimbursement_supper: number
  total_reimbursement: number
  average_daily_attendance: number
}

// School Readiness Types
export interface SchoolCalendar {
  id: string
  organization_id: string
  school_year: string // e.g., "2025-2026"
  regular_start: string // First day of school year
  regular_end: string // Last day of school year
  summer_start: string
  summer_end: string
  christmas_break_start: string
  christmas_break_end: string
  spring_break_start: string
  spring_break_end: string
  is_active: boolean
}

export interface SRHolidayPeriod {
  id: string
  organization_id: string
  calendar_id: string
  name: string
  start_date: string
  end_date: string
  billing_type: 'full_time' | 'closed' | 'regular'
  notes: string | null
}

export interface SRChildBilling {
  child_id: string
  child_name: string
  enrollment_id: string
  case_number: string
  schedule_type: 'after_school' | 'full_time' | 'before_after'
  regular_rate_type: 'hourly' | 'daily' | 'weekly'
  regular_rate: number
  full_time_weekly_rate: number
  current_period_type: 'regular' | 'holiday' | 'summer'
  current_weekly_billing: number
  month_to_date_billing: number
  copay_amount: number
  net_reimbursement: number
}

// Summer Camp Types
export interface SummerCampWeek {
  id: string
  organization_id: string
  year: number
  week_number: number // 1-10 typically
  start_date: string
  end_date: string
  theme: string
  description: string | null
  weekly_rate: number
  daily_rate: number
  max_capacity: number
  current_enrollment: number
  is_active: boolean
}

export interface SummerCampActivity {
  id: string
  organization_id: string
  week_id: string
  name: string
  description: string | null
  activity_date: string
  start_time: string
  end_time: string
  activity_type: 'field_trip' | 'swimming' | 'arts_crafts' | 'sports' | 'educational' | 'special_event' | 'other'
  location: string | null
  additional_cost: number // Extra cost if applicable (field trips, etc.)
  requires_permission: boolean
  max_participants: number | null
  notes: string | null
}

export interface SummerCampEnrollment {
  id: string
  organization_id: string
  child_id: string
  child_name?: string
  year: number
  enrolled_weeks: string[] // Array of week IDs
  enrollment_date: string
  payment_status: 'pending' | 'partial' | 'paid'
  total_amount: number
  amount_paid: number
  balance_due: number
  special_needs_notes: string | null
  dietary_restrictions: string | null
  emergency_contact: string | null
  pickup_authorization: string[] | null
  created_at: string
}

export interface SummerCampAttendance {
  id: string
  enrollment_id: string
  child_id: string
  week_id: string
  attendance_date: string
  check_in_time: string | null
  check_out_time: string | null
  attended: boolean
  participated_activities: string[] // Activity IDs
  notes: string | null
}

// Income Summary Types
export interface MonthlyIncomeBreakdown {
  month: string
  fixed_tuition: {
    total: number
    children_count: number
    by_program: { program: string; amount: number; count: number }[]
  }
  cacfp: {
    total: number
    by_meal: { meal: string; count: number; amount: number }[]
  }
  school_readiness: {
    total: number
    children_count: number
    regular_billing: number
    holiday_billing: number
  }
  vpk: {
    total: number
    children_count: number
    hours_billed: number
  }
  summer_camp: {
    total: number
    children_count: number
    activities_extra: number
  }
  other_income: {
    registration_fees: number
    late_fees: number
    other: number
  }
  grand_total: number
}

// ============================================
// CONSTANTS
// ============================================

// USDA CACFP Reimbursement rates (2024-2025)
export const CACFP_REIMBURSEMENT_RATES = {
  // Tier I rates (lower income areas)
  tier1: {
    breakfast: 2.04,
    am_snack: 1.07,
    lunch: 4.32,
    pm_snack: 1.07,
    supper: 4.32,
  },
  // Tier II rates (higher income areas)
  tier2: {
    breakfast: 0.36,
    am_snack: 0.09,
    lunch: 0.37,
    pm_snack: 0.09,
    supper: 0.37,
  },
}

// School Readiness rate types (Florida 2024-2025 estimates)
export const SR_BILLING_RATES = {
  after_school: {
    hourly: 5.50,
    daily: 27.50,
    weekly: 137.50,
  },
  full_time: {
    hourly: 7.00,
    daily: 56.00,
    weekly: 280.00,
  },
  before_after: {
    hourly: 6.00,
    daily: 36.00,
    weekly: 180.00,
  },
}

// Summer camp default weekly themes
export const SUMMER_CAMP_THEMES = [
  { week: 1, theme: 'Ocean Adventures', description: 'Learn about marine life and ocean conservation' },
  { week: 2, theme: 'Space Explorers', description: 'Discover planets, stars, and the universe' },
  { week: 3, theme: 'Art & Creativity', description: 'Painting, drawing, and crafts galore' },
  { week: 4, theme: 'Sports Week', description: 'Soccer, basketball, and team games' },
  { week: 5, theme: 'Science Lab', description: 'Fun experiments and discoveries' },
  { week: 6, theme: 'Nature & Wildlife', description: 'Plants, animals, and outdoor exploration' },
  { week: 7, theme: 'Music & Dance', description: 'Rhythm, movement, and musical fun' },
  { week: 8, theme: 'Cooking & Nutrition', description: 'Healthy eating and simple recipes' },
  { week: 9, theme: 'World Cultures', description: 'Travel the world through food and traditions' },
  { week: 10, theme: 'End of Summer Celebration', description: 'Party, awards, and saying goodbye' },
]

// ============================================
// SERVICE CLASS
// ============================================

class ProgramIncomeService {
  // ==================== FIXED TUITION ====================

  /**
   * Get all tuition rates for the organization
   */
  async getTuitionRates(): Promise<TuitionRate[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('tuition_rates')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('program_type', { ascending: true })

    if (error) {
      // Table might not exist yet, return mock data
      if (error.code === '42P01') {
        return this.getMockTuitionRates()
      }
      throw error
    }
    return data || this.getMockTuitionRates()
  }

  /**
   * Calculate monthly fixed tuition income for all children
   */
  async calculateFixedTuitionIncome(month: string): Promise<{
    total: number
    children: ChildTuition[]
    by_program: { program: string; amount: number; count: number }[]
  }> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get all active children with their family and rates
    const { data: children, error } = await supabase
      .from('children')
      .select(`
        id,
        first_name,
        last_name,
        family_id,
        program_type,
        weekly_rate,
        family:families(primary_contact_name)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching children:', error)
      return { total: 0, children: [], by_program: [] }
    }

    const childTuitions: ChildTuition[] = (children || []).map((child) => {
      const weeklyRate = child.weekly_rate || 200 // Default rate
      const monthlyRate = weeklyRate * 4.33 // Average weeks per month

      return {
        child_id: child.id,
        child_name: `${child.first_name} ${child.last_name}`,
        family_id: child.family_id,
        family_name: (child.family as { primary_contact_name: string })?.primary_contact_name || 'N/A',
        program_type: child.program_type || 'private',
        tuition_rate_id: null,
        weekly_rate: weeklyRate,
        monthly_rate: monthlyRate,
        has_discount: false,
        discount_percent: 0,
        discount_reason: null,
        net_monthly_rate: monthlyRate,
      }
    })

    // Group by program type
    const byProgram = childTuitions.reduce((acc, child) => {
      const existing = acc.find(p => p.program === child.program_type)
      if (existing) {
        existing.amount += child.net_monthly_rate
        existing.count += 1
      } else {
        acc.push({ program: child.program_type, amount: child.net_monthly_rate, count: 1 })
      }
      return acc
    }, [] as { program: string; amount: number; count: number }[])

    const total = childTuitions.reduce((sum, c) => sum + c.net_monthly_rate, 0)

    return { total, children: childTuitions, by_program: byProgram }
  }

  // ==================== CACFP FOOD PROGRAM ====================

  /**
   * Get daily meal counts for a date range
   */
  async getCACFPDailyCounts(startDate: string, endDate: string): Promise<CACFPDailyCount[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('meal_attendance')
      .select('meal_date, meal_type, served')
      .eq('organization_id', orgId)
      .eq('served', true)
      .gte('meal_date', startDate)
      .lte('meal_date', endDate)

    if (error) {
      console.error('Error fetching meal attendance:', error)
      return this.getMockCACFPDailyCounts(startDate, endDate)
    }

    // Group by date
    const grouped = (data || []).reduce((acc, meal) => {
      if (!acc[meal.meal_date]) {
        acc[meal.meal_date] = {
          date: meal.meal_date,
          breakfast_count: 0,
          am_snack_count: 0,
          lunch_count: 0,
          pm_snack_count: 0,
          supper_count: 0,
          total_meals: 0,
        }
      }
      const key = `${meal.meal_type}_count` as keyof CACFPDailyCount
      if (typeof acc[meal.meal_date][key] === 'number') {
        (acc[meal.meal_date][key] as number)++
      }
      acc[meal.meal_date].total_meals++
      return acc
    }, {} as Record<string, CACFPDailyCount>)

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Calculate CACFP monthly reimbursement
   */
  async calculateCACFPMonthlyReimbursement(year: number, month: number, tier: 'tier1' | 'tier2' = 'tier1'): Promise<CACFPMonthlyReport> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const dailyCounts = await this.getCACFPDailyCounts(startDate, endDate)
    const rates = CACFP_REIMBURSEMENT_RATES[tier]

    let totalBreakfast = 0
    let totalAmSnack = 0
    let totalLunch = 0
    let totalPmSnack = 0
    let totalSupper = 0

    dailyCounts.forEach(day => {
      totalBreakfast += day.breakfast_count
      totalAmSnack += day.am_snack_count
      totalLunch += day.lunch_count
      totalPmSnack += day.pm_snack_count
      totalSupper += day.supper_count
    })

    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      year,
      days_open: dailyCounts.length,
      total_breakfast: totalBreakfast,
      total_am_snack: totalAmSnack,
      total_lunch: totalLunch,
      total_pm_snack: totalPmSnack,
      total_supper: totalSupper,
      reimbursement_breakfast: totalBreakfast * rates.breakfast,
      reimbursement_am_snack: totalAmSnack * rates.am_snack,
      reimbursement_lunch: totalLunch * rates.lunch,
      reimbursement_pm_snack: totalPmSnack * rates.pm_snack,
      reimbursement_supper: totalSupper * rates.supper,
      total_reimbursement:
        (totalBreakfast * rates.breakfast) +
        (totalAmSnack * rates.am_snack) +
        (totalLunch * rates.lunch) +
        (totalPmSnack * rates.pm_snack) +
        (totalSupper * rates.supper),
      average_daily_attendance: dailyCounts.length > 0
        ? Math.round(dailyCounts.reduce((sum, d) => sum + d.lunch_count, 0) / dailyCounts.length)
        : 0,
    }
  }

  // ==================== SCHOOL READINESS ====================

  /**
   * Get school calendar with holidays
   */
  async getSchoolCalendar(schoolYear?: string): Promise<SchoolCalendar | null> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    let query = supabase
      .from('school_calendars')
      .select('*')
      .eq('organization_id', orgId)

    if (schoolYear) {
      query = query.eq('school_year', schoolYear)
    } else {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.single()

    if (error) {
      // Return mock calendar if not found
      return this.getMockSchoolCalendar()
    }
    return data
  }

  /**
   * Check if a date is during a holiday period (for SR full-time billing)
   */
  async isHolidayPeriod(date: string): Promise<{ isHoliday: boolean; periodName: string | null }> {
    const calendar = await this.getSchoolCalendar()
    if (!calendar) return { isHoliday: false, periodName: null }

    const checkDate = new Date(date)

    // Check Christmas break
    if (checkDate >= new Date(calendar.christmas_break_start) && checkDate <= new Date(calendar.christmas_break_end)) {
      return { isHoliday: true, periodName: 'Christmas Break' }
    }

    // Check Spring break
    if (checkDate >= new Date(calendar.spring_break_start) && checkDate <= new Date(calendar.spring_break_end)) {
      return { isHoliday: true, periodName: 'Spring Break' }
    }

    // Check Summer
    if (checkDate >= new Date(calendar.summer_start) && checkDate <= new Date(calendar.summer_end)) {
      return { isHoliday: true, periodName: 'Summer' }
    }

    return { isHoliday: false, periodName: null }
  }

  /**
   * Calculate SR billing for a child based on schedule type and current period
   */
  async calculateSRChildBilling(childId: string, weekStart: string): Promise<SRChildBilling | null> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get SR enrollment
    const { data: enrollment } = await supabase
      .from('sr_enrollments')
      .select(`
        *,
        children:child_id(first_name, last_name)
      `)
      .eq('child_id', childId)
      .eq('status', 'active')
      .single()

    if (!enrollment) return null

    // Check if current period is holiday (full-time billing)
    const holidayCheck = await this.isHolidayPeriod(weekStart)
    const scheduleType = enrollment.rate_type || 'after_school'

    // Get appropriate rate
    const rates = SR_BILLING_RATES[scheduleType as keyof typeof SR_BILLING_RATES] || SR_BILLING_RATES.after_school
    const fullTimeRates = SR_BILLING_RATES.full_time

    // If holiday period and after_school child, bill at full_time rate
    const currentWeeklyBilling = holidayCheck.isHoliday && scheduleType === 'after_school'
      ? fullTimeRates.weekly
      : rates.weekly

    return {
      child_id: childId,
      child_name: enrollment.children ? `${enrollment.children.first_name} ${enrollment.children.last_name}` : 'Unknown',
      enrollment_id: enrollment.id,
      case_number: enrollment.case_number,
      schedule_type: scheduleType as 'after_school' | 'full_time' | 'before_after',
      regular_rate_type: 'weekly',
      regular_rate: rates.weekly,
      full_time_weekly_rate: fullTimeRates.weekly,
      current_period_type: holidayCheck.isHoliday ? 'holiday' : 'regular',
      current_weekly_billing: currentWeeklyBilling,
      month_to_date_billing: currentWeeklyBilling * 4, // Approximate
      copay_amount: enrollment.copay_amount || 0,
      net_reimbursement: currentWeeklyBilling - (enrollment.copay_amount || 0),
    }
  }

  /**
   * Calculate total SR income for a month
   */
  async calculateSRMonthlyIncome(year: number, month: number): Promise<{
    total: number
    children_count: number
    regular_billing: number
    holiday_billing: number
    details: SRChildBilling[]
  }> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get all active SR enrollments
    const { data: enrollments } = await supabase
      .from('sr_enrollments')
      .select(`
        *,
        children:child_id(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active')

    if (!enrollments || enrollments.length === 0) {
      return { total: 0, children_count: 0, regular_billing: 0, holiday_billing: 0, details: [] }
    }

    const details: SRChildBilling[] = []
    let regularBilling = 0
    let holidayBilling = 0

    // Calculate for each week of the month
    const weeksInMonth = 4
    for (const enrollment of enrollments) {
      if (!enrollment.children) continue

      const billing = await this.calculateSRChildBilling(
        enrollment.children.id,
        `${year}-${String(month).padStart(2, '0')}-01`
      )

      if (billing) {
        // Multiply by weeks in month for total
        const monthlyAmount = billing.current_weekly_billing * weeksInMonth
        if (billing.current_period_type === 'holiday') {
          holidayBilling += monthlyAmount
        } else {
          regularBilling += monthlyAmount
        }
        details.push(billing)
      }
    }

    return {
      total: regularBilling + holidayBilling,
      children_count: details.length,
      regular_billing: regularBilling,
      holiday_billing: holidayBilling,
      details,
    }
  }

  // ==================== SUMMER CAMP ====================

  /**
   * Get summer camp weeks for a year
   */
  async getSummerCampWeeks(year: number): Promise<SummerCampWeek[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('summer_camp_weeks')
      .select('*')
      .eq('organization_id', orgId)
      .eq('year', year)
      .order('week_number', { ascending: true })

    if (error) {
      // Return mock data
      return this.getMockSummerCampWeeks(year)
    }
    return data || this.getMockSummerCampWeeks(year)
  }

  /**
   * Get summer camp activities for a week
   */
  async getSummerCampActivities(weekId: string): Promise<SummerCampActivity[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('summer_camp_activities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('week_id', weekId)
      .order('activity_date', { ascending: true })

    if (error) {
      return []
    }
    return data || []
  }

  /**
   * Get summer camp enrollments
   */
  async getSummerCampEnrollments(year: number): Promise<SummerCampEnrollment[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('summer_camp_enrollments')
      .select(`
        *,
        children:child_id(first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .eq('year', year)

    if (error) {
      return []
    }

    return (data || []).map(e => ({
      ...e,
      child_name: e.children ? `${e.children.first_name} ${e.children.last_name}` : undefined,
    }))
  }

  /**
   * Create summer camp enrollment for a child
   */
  async createSummerCampEnrollment(
    childId: string,
    year: number,
    weekIds: string[],
    additionalInfo?: {
      special_needs_notes?: string
      dietary_restrictions?: string
      emergency_contact?: string
      pickup_authorization?: string[]
    }
  ): Promise<SummerCampEnrollment> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get week rates to calculate total
    const weeks = await this.getSummerCampWeeks(year)
    const selectedWeeks = weeks.filter(w => weekIds.includes(w.id))
    const totalAmount = selectedWeeks.reduce((sum, w) => sum + w.weekly_rate, 0)

    const { data, error } = await supabase
      .from('summer_camp_enrollments')
      .insert({
        organization_id: orgId,
        child_id: childId,
        year,
        enrolled_weeks: weekIds,
        enrollment_date: new Date().toISOString().split('T')[0],
        payment_status: 'pending',
        total_amount: totalAmount,
        amount_paid: 0,
        balance_due: totalAmount,
        ...additionalInfo,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Calculate summer camp income for a year
   */
  async calculateSummerCampIncome(year: number): Promise<{
    total: number
    children_count: number
    by_week: { week: number; theme: string; amount: number; enrollments: number }[]
    activities_extra: number
  }> {
    const enrollments = await this.getSummerCampEnrollments(year)
    const weeks = await this.getSummerCampWeeks(year)

    const byWeek = weeks.map(week => {
      const weekEnrollments = enrollments.filter(e => e.enrolled_weeks.includes(week.id))
      return {
        week: week.week_number,
        theme: week.theme,
        amount: weekEnrollments.length * week.weekly_rate,
        enrollments: weekEnrollments.length,
      }
    })

    const total = byWeek.reduce((sum, w) => sum + w.amount, 0)
    const uniqueChildren = new Set(enrollments.map(e => e.child_id)).size

    return {
      total,
      children_count: uniqueChildren,
      by_week: byWeek,
      activities_extra: 0, // TODO: Calculate extra activity costs
    }
  }

  // ==================== COMPREHENSIVE INCOME SUMMARY ====================

  /**
   * Get complete monthly income breakdown from all programs
   */
  async getMonthlyIncomeBreakdown(year: number, month: number): Promise<MonthlyIncomeBreakdown> {
    const [tuition, cacfp, sr, summerCamp] = await Promise.all([
      this.calculateFixedTuitionIncome(`${year}-${String(month).padStart(2, '0')}`),
      this.calculateCACFPMonthlyReimbursement(year, month),
      this.calculateSRMonthlyIncome(year, month),
      month >= 6 && month <= 8 ? this.calculateSummerCampIncome(year) : Promise.resolve({ total: 0, children_count: 0, by_week: [], activities_extra: 0 }),
    ])

    // VPK - would need separate calculation based on hours
    const vpkTotal = 0 // TODO: Implement VPK billing calculation

    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      fixed_tuition: {
        total: tuition.total,
        children_count: tuition.children.length,
        by_program: tuition.by_program,
      },
      cacfp: {
        total: cacfp.total_reimbursement,
        by_meal: [
          { meal: 'Breakfast', count: cacfp.total_breakfast, amount: cacfp.reimbursement_breakfast },
          { meal: 'AM Snack', count: cacfp.total_am_snack, amount: cacfp.reimbursement_am_snack },
          { meal: 'Lunch', count: cacfp.total_lunch, amount: cacfp.reimbursement_lunch },
          { meal: 'PM Snack', count: cacfp.total_pm_snack, amount: cacfp.reimbursement_pm_snack },
          { meal: 'Supper', count: cacfp.total_supper, amount: cacfp.reimbursement_supper },
        ],
      },
      school_readiness: {
        total: sr.total,
        children_count: sr.children_count,
        regular_billing: sr.regular_billing,
        holiday_billing: sr.holiday_billing,
      },
      vpk: {
        total: vpkTotal,
        children_count: 0,
        hours_billed: 0,
      },
      summer_camp: {
        total: summerCamp.total,
        children_count: summerCamp.children_count,
        activities_extra: summerCamp.activities_extra,
      },
      other_income: {
        registration_fees: 0,
        late_fees: 0,
        other: 0,
      },
      grand_total: tuition.total + cacfp.total_reimbursement + sr.total + vpkTotal + summerCamp.total,
    }
  }

  // ==================== MOCK DATA ====================

  private getMockTuitionRates(): TuitionRate[] {
    return [
      {
        id: 'rate-1',
        organization_id: 'org-1',
        name: 'Full Time - Infant',
        program_type: 'full_time',
        age_group: 'infant',
        weekly_rate: 350,
        daily_rate: 80,
        monthly_rate: 1515.50,
        registration_fee: 100,
        is_active: true,
        effective_date: '2025-01-01',
        created_at: new Date().toISOString(),
      },
      {
        id: 'rate-2',
        organization_id: 'org-1',
        name: 'Full Time - Toddler',
        program_type: 'full_time',
        age_group: 'toddler',
        weekly_rate: 300,
        daily_rate: 70,
        monthly_rate: 1299.00,
        registration_fee: 100,
        is_active: true,
        effective_date: '2025-01-01',
        created_at: new Date().toISOString(),
      },
      {
        id: 'rate-3',
        organization_id: 'org-1',
        name: 'Full Time - Preschool',
        program_type: 'full_time',
        age_group: 'preschool',
        weekly_rate: 250,
        daily_rate: 60,
        monthly_rate: 1082.50,
        registration_fee: 75,
        is_active: true,
        effective_date: '2025-01-01',
        created_at: new Date().toISOString(),
      },
      {
        id: 'rate-4',
        organization_id: 'org-1',
        name: 'After School',
        program_type: 'after_school',
        age_group: 'school_age',
        weekly_rate: 150,
        daily_rate: 35,
        monthly_rate: 649.50,
        registration_fee: 50,
        is_active: true,
        effective_date: '2025-01-01',
        created_at: new Date().toISOString(),
      },
      {
        id: 'rate-5',
        organization_id: 'org-1',
        name: 'Summer Camp',
        program_type: 'summer_camp',
        age_group: 'all',
        weekly_rate: 275,
        daily_rate: 65,
        monthly_rate: 1190.75,
        registration_fee: 50,
        is_active: true,
        effective_date: '2025-06-01',
        created_at: new Date().toISOString(),
      },
    ]
  }

  private getMockCACFPDailyCounts(startDate: string, endDate: string): CACFPDailyCount[] {
    const counts: CACFPDailyCount[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Skip weekends
      if (d.getDay() === 0 || d.getDay() === 6) continue

      // Random counts (simulating real attendance)
      const baseCount = Math.floor(Math.random() * 15) + 25 // 25-40 kids
      counts.push({
        date: d.toISOString().split('T')[0],
        breakfast_count: baseCount - Math.floor(Math.random() * 5),
        am_snack_count: baseCount,
        lunch_count: baseCount,
        pm_snack_count: baseCount - Math.floor(Math.random() * 3),
        supper_count: Math.floor(baseCount * 0.3), // Only some stay for supper
        total_meals: baseCount * 4,
      })
    }
    return counts
  }

  private getMockSchoolCalendar(): SchoolCalendar {
    const year = new Date().getFullYear()
    return {
      id: 'cal-1',
      organization_id: 'org-1',
      school_year: `${year}-${year + 1}`,
      regular_start: `${year}-08-15`,
      regular_end: `${year + 1}-05-31`,
      summer_start: `${year + 1}-06-01`,
      summer_end: `${year + 1}-08-10`,
      christmas_break_start: `${year}-12-20`,
      christmas_break_end: `${year + 1}-01-05`,
      spring_break_start: `${year + 1}-03-15`,
      spring_break_end: `${year + 1}-03-22`,
      is_active: true,
    }
  }

  private getMockSummerCampWeeks(year: number): SummerCampWeek[] {
    const startDate = new Date(year, 5, 3) // June 3rd (first Monday)
    return SUMMER_CAMP_THEMES.map((theme, index) => {
      const weekStart = new Date(startDate)
      weekStart.setDate(startDate.getDate() + (index * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 4) // Friday

      return {
        id: `week-${year}-${index + 1}`,
        organization_id: 'org-1',
        year,
        week_number: index + 1,
        start_date: weekStart.toISOString().split('T')[0],
        end_date: weekEnd.toISOString().split('T')[0],
        theme: theme.theme,
        description: theme.description,
        weekly_rate: 275,
        daily_rate: 65,
        max_capacity: 40,
        current_enrollment: Math.floor(Math.random() * 30) + 10,
        is_active: true,
      }
    })
  }
}

export const programIncomeService = new ProgramIncomeService()

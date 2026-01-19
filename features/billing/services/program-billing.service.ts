// =====================================================
// Program-Based Billing Service
// Handles VPK wrap-around and School Readiness billing
// =====================================================

import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { InvoiceLineItem } from './billing-enhanced.service'
import type { ChildProgramType } from '@/shared/types/children-extended'

// VPK program constants
const VPK_SCHOOL_YEAR_HOURS_PER_DAY = 3
const VPK_SUMMER_HOURS_PER_DAY = 6

// Helper to get current school year
function getCurrentSchoolYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  if (month >= 8) {
    return `${year}-${year + 1}`
  }
  return `${year - 1}-${year}`
}

// Helper to format date range
function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${startDate.toLocaleDateString('es-ES', options)} - ${endDate.toLocaleDateString('es-ES', options)}`
}

export interface ChildBillingData {
  child_id: string
  child_name: string
  program_type: ChildProgramType
  // VPK specific
  vpk_schedule_type?: 'school_year' | 'summer'
  vpk_hours_used?: number
  // SR specific
  sr_authorized_hours_weekly?: number
  sr_hours_used?: number
  sr_copay_amount?: number
  sr_copay_frequency?: 'weekly' | 'monthly'
  // General
  total_hours?: number
  weekly_rate?: number
  hourly_rate?: number
}

export interface ProgramBillingResult {
  line_items: InvoiceLineItem[]
  subtotal: number
  breakdown: {
    vpk_wraparound_total?: number
    sr_copay_total?: number
    sr_excess_hours_total?: number
    private_tuition_total?: number
  }
}

export const programBillingService = {
  /**
   * Get child's billing data for a period
   * Includes program type, attendance hours, and enrollment info
   */
  async getChildBillingData(
    childId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<ChildBillingData | null> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const schoolYear = getCurrentSchoolYear()

    // Get child info
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, first_name, last_name, program_type, weekly_rate, hourly_rate')
      .eq('id', childId)
      .single()

    if (childError || !child) return null

    const result: ChildBillingData = {
      child_id: child.id,
      child_name: `${child.first_name} ${child.last_name}`,
      program_type: child.program_type || 'private',
      weekly_rate: child.weekly_rate,
      hourly_rate: child.hourly_rate,
    }

    // Get total attendance hours for the period
    const { data: attendance } = await supabase
      .from('attendance')
      .select('check_in_time, check_out_time')
      .eq('child_id', childId)
      .gte('date', periodStart)
      .lte('date', periodEnd)
      .not('check_out_time', 'is', null)

    if (attendance) {
      result.total_hours = attendance.reduce((sum, a) => {
        if (a.check_in_time && a.check_out_time) {
          const hours = (new Date(a.check_out_time).getTime() - new Date(a.check_in_time).getTime()) / (1000 * 60 * 60)
          return sum + hours
        }
        return sum
      }, 0)
    }

    // Get VPK enrollment and attendance if VPK program
    if (child.program_type === 'vpk' || child.program_type === 'vpk_wraparound') {
      const { data: vpkEnrollment } = await supabase
        .from('vpk_enrollments')
        .select('id, program_type')
        .eq('organization_id', orgId)
        .eq('child_id', childId)
        .eq('school_year', schoolYear)
        .eq('status', 'active')
        .single()

      if (vpkEnrollment) {
        result.vpk_schedule_type = vpkEnrollment.program_type as 'school_year' | 'summer'

        // Get VPK hours used in the period
        const { data: vpkAttendance } = await supabase
          .from('vpk_attendance')
          .select('hours')
          .eq('vpk_enrollment_id', vpkEnrollment.id)
          .gte('date', periodStart)
          .lte('date', periodEnd)

        result.vpk_hours_used = vpkAttendance?.reduce((sum, a) => sum + (a.hours || 0), 0) || 0
      }
    }

    // Get SR enrollment if SR program
    if (child.program_type === 'school_readiness' || child.program_type === 'sr_copay') {
      const { data: srEnrollment } = await supabase
        .from('sr_enrollments')
        .select('id, authorized_hours_weekly, copay_amount, copay_frequency')
        .eq('organization_id', orgId)
        .eq('child_id', childId)
        .eq('school_year', schoolYear)
        .eq('status', 'active')
        .single()

      if (srEnrollment) {
        result.sr_authorized_hours_weekly = srEnrollment.authorized_hours_weekly
        result.sr_copay_amount = srEnrollment.copay_amount
        result.sr_copay_frequency = srEnrollment.copay_frequency

        // Get SR hours used in the period
        const { data: srAttendance } = await supabase
          .from('sr_attendance')
          .select('hours')
          .eq('sr_enrollment_id', srEnrollment.id)
          .gte('date', periodStart)
          .lte('date', periodEnd)

        result.sr_hours_used = srAttendance?.reduce((sum, a) => sum + (a.hours || 0), 0) || 0
      }
    }

    return result
  },

  /**
   * Calculate VPK wrap-around billing
   * VPK hours are state-funded, wrap-around hours are billed to family
   */
  calculateVPKWraparoundBilling(
    childData: ChildBillingData,
    periodStart: string,
    periodEnd: string,
    daysInPeriod: number
  ): InvoiceLineItem | null {
    if (childData.program_type !== 'vpk_wraparound') {
      return null
    }

    const vpkHoursPerDay = childData.vpk_schedule_type === 'summer'
      ? VPK_SUMMER_HOURS_PER_DAY
      : VPK_SCHOOL_YEAR_HOURS_PER_DAY

    // Calculate expected VPK hours for the period
    const expectedVPKHours = vpkHoursPerDay * daysInPeriod
    const totalHours = childData.total_hours || 0

    // Wrap-around hours = total hours attended - VPK hours
    const wraparoundHours = Math.max(0, totalHours - expectedVPKHours)

    if (wraparoundHours <= 0) {
      return null
    }

    const hourlyRate = childData.hourly_rate || 10 // Default $10/hr for wrap-around
    const total = Math.round(wraparoundHours * hourlyRate * 100) / 100

    return {
      item_type: 'vpk_wraparound',
      description: `VPK Wrap-Around - ${childData.child_name} (${formatDateRange(periodStart, periodEnd)})`,
      quantity: Math.round(wraparoundHours * 100) / 100,
      unit_price: hourlyRate,
      total,
      child_id: childData.child_id,
      child_name: childData.child_name,
      program_type: 'vpk_wraparound',
      period_start: periodStart,
      period_end: periodEnd,
    }
  },

  /**
   * Calculate School Readiness co-pay billing
   */
  calculateSRCopayBilling(
    childData: ChildBillingData,
    periodStart: string,
    periodEnd: string,
    weeksInPeriod: number
  ): InvoiceLineItem | null {
    if (childData.program_type !== 'sr_copay') {
      return null
    }

    const copayAmount = childData.sr_copay_amount || 0
    if (copayAmount <= 0) {
      return null
    }

    // Calculate co-pay based on frequency
    let quantity = 1
    let description = ''

    if (childData.sr_copay_frequency === 'weekly') {
      quantity = weeksInPeriod
      description = `Co-Pago SR - ${childData.child_name} (${weeksInPeriod} semana${weeksInPeriod > 1 ? 's' : ''})`
    } else {
      // Monthly
      quantity = 1
      description = `Co-Pago SR Mensual - ${childData.child_name}`
    }

    const total = Math.round(copayAmount * quantity * 100) / 100

    return {
      item_type: 'sr_copay',
      description,
      quantity,
      unit_price: copayAmount,
      total,
      child_id: childData.child_id,
      child_name: childData.child_name,
      program_type: 'sr_copay',
      period_start: periodStart,
      period_end: periodEnd,
    }
  },

  /**
   * Calculate SR excess hours (beyond authorized weekly hours)
   */
  calculateSRExcessHoursBilling(
    childData: ChildBillingData,
    periodStart: string,
    periodEnd: string,
    weeksInPeriod: number
  ): InvoiceLineItem | null {
    if (childData.program_type !== 'school_readiness' && childData.program_type !== 'sr_copay') {
      return null
    }

    const authorizedWeekly = childData.sr_authorized_hours_weekly || 0
    const authorizedTotal = authorizedWeekly * weeksInPeriod
    const hoursUsed = childData.sr_hours_used || 0

    // Calculate excess hours
    const excessHours = Math.max(0, hoursUsed - authorizedTotal)

    if (excessHours <= 0) {
      return null
    }

    const hourlyRate = childData.hourly_rate || 12 // Default $12/hr for excess hours
    const total = Math.round(excessHours * hourlyRate * 100) / 100

    return {
      item_type: 'sr_excess_hours',
      description: `Horas Adicionales SR - ${childData.child_name} (${Math.round(excessHours * 10) / 10} hrs)`,
      quantity: Math.round(excessHours * 100) / 100,
      unit_price: hourlyRate,
      total,
      child_id: childData.child_id,
      child_name: childData.child_name,
      program_type: childData.program_type,
      period_start: periodStart,
      period_end: periodEnd,
    }
  },

  /**
   * Calculate private tuition billing
   */
  calculatePrivateTuitionBilling(
    childData: ChildBillingData,
    periodStart: string,
    periodEnd: string,
    weeksInPeriod: number
  ): InvoiceLineItem | null {
    if (childData.program_type !== 'private') {
      return null
    }

    const weeklyRate = childData.weekly_rate || 250 // Default $250/week
    const total = Math.round(weeklyRate * weeksInPeriod * 100) / 100

    return {
      item_type: 'tuition',
      description: `Tuici\u00f3n - ${childData.child_name} (${weeksInPeriod} semana${weeksInPeriod > 1 ? 's' : ''})`,
      quantity: weeksInPeriod,
      unit_price: weeklyRate,
      total,
      child_id: childData.child_id,
      child_name: childData.child_name,
      program_type: 'private',
      period_start: periodStart,
      period_end: periodEnd,
    }
  },

  /**
   * Generate all billing line items for a child based on their program
   */
  async generateProgramBilling(
    childId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<ProgramBillingResult> {
    // Calculate period metrics
    const startDate = new Date(periodStart)
    const endDate = new Date(periodEnd)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const weeksInPeriod = Math.ceil(daysDiff / 7)
    const daysInPeriod = Math.ceil(daysDiff * 5 / 7) // Approximate weekdays

    // Get child billing data
    const childData = await this.getChildBillingData(childId, periodStart, periodEnd)

    if (!childData) {
      return {
        line_items: [],
        subtotal: 0,
        breakdown: {},
      }
    }

    const lineItems: InvoiceLineItem[] = []
    const breakdown: ProgramBillingResult['breakdown'] = {}
    let subtotal = 0

    // Generate appropriate billing based on program type
    switch (childData.program_type) {
      case 'private': {
        const item = this.calculatePrivateTuitionBilling(childData, periodStart, periodEnd, weeksInPeriod)
        if (item) {
          lineItems.push(item)
          subtotal += item.total
          breakdown.private_tuition_total = item.total
        }
        break
      }

      case 'vpk':
        // VPK only - no billing needed (state funded)
        break

      case 'vpk_wraparound': {
        const item = this.calculateVPKWraparoundBilling(childData, periodStart, periodEnd, daysInPeriod)
        if (item) {
          lineItems.push(item)
          subtotal += item.total
          breakdown.vpk_wraparound_total = item.total
        }
        break
      }

      case 'school_readiness':
        // SR only - check for excess hours
        {
          const excessItem = this.calculateSRExcessHoursBilling(childData, periodStart, periodEnd, weeksInPeriod)
          if (excessItem) {
            lineItems.push(excessItem)
            subtotal += excessItem.total
            breakdown.sr_excess_hours_total = excessItem.total
          }
        }
        break

      case 'sr_copay':
        // SR with co-pay
        {
          const copayItem = this.calculateSRCopayBilling(childData, periodStart, periodEnd, weeksInPeriod)
          if (copayItem) {
            lineItems.push(copayItem)
            subtotal += copayItem.total
            breakdown.sr_copay_total = copayItem.total
          }

          const excessItem = this.calculateSRExcessHoursBilling(childData, periodStart, periodEnd, weeksInPeriod)
          if (excessItem) {
            lineItems.push(excessItem)
            subtotal += excessItem.total
            breakdown.sr_excess_hours_total = excessItem.total
          }
        }
        break
    }

    return {
      line_items: lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      breakdown,
    }
  },

  /**
   * Generate billing for all children in a family
   */
  async generateFamilyProgramBilling(
    familyId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<ProgramBillingResult> {
    const supabase = createClient()

    // Get all active children in the family
    const { data: children } = await supabase
      .from('children')
      .select('id')
      .eq('family_id', familyId)
      .eq('status', 'active')

    if (!children || children.length === 0) {
      return {
        line_items: [],
        subtotal: 0,
        breakdown: {},
      }
    }

    const allLineItems: InvoiceLineItem[] = []
    let totalSubtotal = 0
    const combinedBreakdown: ProgramBillingResult['breakdown'] = {}

    // Generate billing for each child
    for (const child of children) {
      const result = await this.generateProgramBilling(child.id, periodStart, periodEnd)

      allLineItems.push(...result.line_items)
      totalSubtotal += result.subtotal

      // Combine breakdowns
      if (result.breakdown.vpk_wraparound_total) {
        combinedBreakdown.vpk_wraparound_total =
          (combinedBreakdown.vpk_wraparound_total || 0) + result.breakdown.vpk_wraparound_total
      }
      if (result.breakdown.sr_copay_total) {
        combinedBreakdown.sr_copay_total =
          (combinedBreakdown.sr_copay_total || 0) + result.breakdown.sr_copay_total
      }
      if (result.breakdown.sr_excess_hours_total) {
        combinedBreakdown.sr_excess_hours_total =
          (combinedBreakdown.sr_excess_hours_total || 0) + result.breakdown.sr_excess_hours_total
      }
      if (result.breakdown.private_tuition_total) {
        combinedBreakdown.private_tuition_total =
          (combinedBreakdown.private_tuition_total || 0) + result.breakdown.private_tuition_total
      }
    }

    return {
      line_items: allLineItems,
      subtotal: Math.round(totalSubtotal * 100) / 100,
      breakdown: combinedBreakdown,
    }
  },
}

export default programBillingService

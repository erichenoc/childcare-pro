// =====================================================
// Extended Children Types with Program Information
// =====================================================

import type { Child, Family, Classroom } from './database.types'

// Program types for children
export type ChildProgramType =
  | 'private'           // Full private pay
  | 'vpk'               // VPK only (3 hours/day state funded)
  | 'vpk_wraparound'    // VPK + additional private hours
  | 'school_readiness'  // School Readiness funded
  | 'sr_copay'          // School Readiness with family co-pay

export type ScheduleType = 'full_time' | 'part_time' | 'drop_in' | 'before_after'

export type VPKScheduleType = 'school_year' | 'summer'

// Extended Child type with program fields
export interface ChildWithProgram extends Child {
  // Program identification
  program_type: ChildProgramType

  // VPK specific
  vpk_certificate_number?: string | null
  vpk_schedule_type?: VPKScheduleType | null

  // School Readiness specific
  sr_case_number?: string | null
  sr_authorized_hours_weekly?: number | null
  sr_copay_amount?: number | null
  sr_copay_frequency?: 'weekly' | 'monthly' | null

  // Billing rates (for private pay)
  weekly_rate?: number | null
  hourly_rate?: number | null
  schedule_type?: ScheduleType | null

  // Relations
  family?: Family | null
  classroom?: Classroom | null
}

// Form data for creating/updating a child with program
export interface ChildFormData {
  // Basic info
  first_name: string
  last_name: string
  date_of_birth: string
  gender?: string
  family_id: string
  classroom_id?: string | null
  enrollment_date?: string

  // Medical info
  doctor_name?: string | null
  doctor_phone?: string | null
  allergies?: string[]
  medical_conditions?: string | null
  dietary_restrictions?: string[]
  medications?: string[]
  special_needs?: string | null
  notes?: string | null

  // Program selection
  program_type: ChildProgramType
  schedule_type?: ScheduleType

  // VPK fields (required if program_type is 'vpk' or 'vpk_wraparound')
  vpk_certificate_number?: string
  vpk_schedule_type?: VPKScheduleType
  vpk_start_date?: string

  // School Readiness fields (required if program_type is 'school_readiness' or 'sr_copay')
  sr_case_number?: string
  sr_authorized_hours_weekly?: number
  sr_copay_amount?: number
  sr_copay_frequency?: 'weekly' | 'monthly'
  sr_rate_type?: 'full_time' | 'part_time' | 'hourly'
  sr_eligibility_start?: string
  sr_eligibility_end?: string

  // Billing rates (for private or wraparound)
  weekly_rate?: number
  hourly_rate?: number
}

// VPK enrollment data needed when creating a child
export interface VPKEnrollmentData {
  child_id: string
  organization_id: string
  student_cert_number: string
  schedule_type: VPKScheduleType
  enrollment_date: string
  start_date: string
  status: 'active'
}

// School Readiness enrollment data
export interface SREnrollmentData {
  child_id: string
  family_id: string
  organization_id: string
  case_number: string
  eligibility_start: string
  eligibility_end: string
  authorized_hours_weekly: number
  rate_type: 'full_time' | 'part_time' | 'hourly'
  copay_amount?: number
  copay_frequency?: 'weekly' | 'monthly'
  status: 'active'
}

// Program type options for UI
export const PROGRAM_TYPE_OPTIONS = [
  {
    value: 'private' as ChildProgramType,
    label: 'Pago Privado',
    description: 'Tarifa completa pagada por la familia',
    icon: '💵',
    color: 'blue',
  },
  {
    value: 'vpk' as ChildProgramType,
    label: 'VPK',
    description: 'Voluntary Pre-K (3 horas/día financiado por el estado)',
    icon: '🎓',
    color: 'green',
    requiresCertificate: true,
  },
  {
    value: 'vpk_wraparound' as ChildProgramType,
    label: 'VPK + Wrap-Around',
    description: 'VPK + horas adicionales privadas (antes/después)',
    icon: '🎓💵',
    color: 'teal',
    requiresCertificate: true,
    requiresRate: true,
  },
  {
    value: 'school_readiness' as ChildProgramType,
    label: 'School Readiness',
    description: 'Programa SR financiado por ELC',
    icon: '📚',
    color: 'purple',
    requiresCaseNumber: true,
  },
  {
    value: 'sr_copay' as ChildProgramType,
    label: 'School Readiness + Co-Pay',
    description: 'SR con co-pago familiar',
    icon: '📚💵',
    color: 'violet',
    requiresCaseNumber: true,
    requiresCopay: true,
  },
] as const

// Schedule type options
export const SCHEDULE_TYPE_OPTIONS = [
  { value: 'full_time' as ScheduleType, label: 'Tiempo Completo', hours: '30+ hrs/semana' },
  { value: 'part_time' as ScheduleType, label: 'Medio Tiempo', hours: '15-29 hrs/semana' },
  { value: 'drop_in' as ScheduleType, label: 'Por Hora/Día', hours: 'Variable' },
  { value: 'before_after' as ScheduleType, label: 'Antes/Después Escuela', hours: 'Wrap-around' },
] as const

// VPK schedule options
export const VPK_SCHEDULE_OPTIONS = [
  {
    value: 'school_year' as VPKScheduleType,
    label: 'Año Escolar',
    hours: 540,
    weeks: 36,
    hoursPerDay: 3,
  },
  {
    value: 'summer' as VPKScheduleType,
    label: 'Verano',
    hours: 300,
    weeks: 10,
    hoursPerDay: 6,
  },
] as const

// Helper to get program display info
export function getProgramInfo(programType: ChildProgramType) {
  return PROGRAM_TYPE_OPTIONS.find(opt => opt.value === programType)
}

// Helper to calculate age group from date of birth
export function getAgeGroup(dateOfBirth: string): string {
  const birth = new Date(dateOfBirth)
  const today = new Date()
  const ageMonths =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth())

  if (ageMonths < 12) return 'infant'
  if (ageMonths < 24) return 'toddler'
  if (ageMonths < 36) return 'twos'
  if (ageMonths < 48) return 'threes'
  if (ageMonths < 72) return 'prek'
  return 'school_age'
}

// Helper to check if child is VPK eligible (4-5 years old)
export function isVPKEligible(dateOfBirth: string): boolean {
  const birth = new Date(dateOfBirth)
  const today = new Date()
  const ageYears =
    (today.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  return ageYears >= 4 && ageYears < 6
}

// Helper to check if program type is VPK-related
export function isVPKProgram(programType: ChildProgramType | undefined): boolean {
  return programType === 'vpk' || programType === 'vpk_wraparound'
}

// Helper to check if program type is School Readiness-related
export function isSRProgram(programType: ChildProgramType | undefined): boolean {
  return programType === 'school_readiness' || programType === 'sr_copay'
}

// Helper to check if program type requires payment (has private component)
export function hasPrivatePay(programType: ChildProgramType | undefined): boolean {
  return programType === 'private' || programType === 'vpk_wraparound' || programType === 'sr_copay'
}

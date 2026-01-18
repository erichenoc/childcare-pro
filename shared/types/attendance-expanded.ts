// =====================================================
// Expanded Attendance Types
// =====================================================

export type CheckInMethod = 'manual' | 'kiosk' | 'app'
export type VerificationMethod = 'id_verified' | 'photo_match' | 'known_person'
export type TemperatureUnit = 'F' | 'C'

export interface AttendanceExpanded {
  id: string
  organization_id: string
  child_id: string
  classroom_id: string
  date: string

  // Check-in details
  check_in_time: string | null
  checked_in_by: string | null
  check_in_guardian_id: string | null
  check_in_authorized_pickup_id: string | null
  check_in_person_name: string | null
  check_in_person_relationship: string | null
  check_in_method: CheckInMethod
  check_in_photo_url: string | null

  // Check-out details
  check_out_time: string | null
  checked_out_by: string | null
  check_out_guardian_id: string | null
  check_out_authorized_pickup_id: string | null
  check_out_person_name: string | null
  check_out_person_relationship: string | null
  check_out_verified: boolean
  check_out_verification_method: VerificationMethod | null
  check_out_method: CheckInMethod
  check_out_photo_url: string | null

  // Health screening
  check_in_temperature: number | null
  temperature_unit: TemperatureUnit
  health_screening_passed: boolean
  health_screening_notes: string | null

  // Notes
  parent_drop_off_notes: string | null
  parent_pickup_notes: string | null

  // Tracking
  total_hours: number | null
  status: 'present' | 'absent' | 'late' | 'early_departure'

  created_at: string
  updated_at: string
}

export interface CheckInFormData {
  child_id: string
  classroom_id: string
  brought_by_type: 'guardian' | 'authorized' | 'emergency_contact'
  brought_by_id: string
  temperature?: number
  notes?: string
  method?: CheckInMethod
}

export interface CheckOutFormData {
  child_id: string
  picked_up_by_type: 'guardian' | 'authorized' | 'emergency_contact'
  picked_up_by_id: string
  verified: boolean
  verification_method?: VerificationMethod
  notes?: string
  method?: CheckInMethod
}

export interface CheckInResult {
  success: boolean
  attendance_id: string | null
  message: string
}

export interface CheckOutResult {
  success: boolean
  attendance_id: string | null
  message: string
  blocked: boolean
}

export interface TodayAttendanceByClassroom {
  classroom_id: string
  classroom_name: string
  classroom_capacity: number
  children_present: number
  children_checked_out: number
  total_enrolled: number
  organization_id: string
}

export interface MonthlyAttendanceSummary {
  child_id: string
  first_name: string
  last_name: string
  classroom_id: string
  month: string
  days_present: number
  days_absent: number
  days_late: number
  total_hours: number
  avg_hours_per_day: number
  organization_id: string
}

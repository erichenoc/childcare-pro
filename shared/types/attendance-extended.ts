// =====================================================
// Extended Attendance Types with Pickup Information
// =====================================================

// Types for authorized pickup people
export type PickupPersonType = 'guardian' | 'authorized' | 'emergency_contact'

export interface AuthorizedPickupPerson {
  person_id: string
  person_type: PickupPersonType
  name: string
  relationship: string
  phone: string
  photo_url: string | null
  has_photo: boolean
  has_id: boolean
  restrictions: string | null
}

// Check-in data
export interface CheckInData {
  child_id: string
  classroom_id: string
  // Person who dropped off the child
  drop_off_person_id?: string
  drop_off_person_type?: PickupPersonType
  drop_off_person_name?: string
  drop_off_person_relationship?: string
  // Optional notes
  notes?: string
}

// Check-out data with verification
export interface CheckOutData {
  child_id: string
  // Person picking up the child
  pickup_person_id?: string
  pickup_person_type?: PickupPersonType
  pickup_person_name?: string
  pickup_person_relationship?: string
  // Verification
  verified: boolean
  verification_method?: 'id_check' | 'photo_match' | 'known_person' | 'staff_override'
  // Optional notes
  notes?: string
}

// Pickup validation result
export interface PickupValidationResult {
  is_valid: boolean
  person_name: string | null
  relationship: string | null
  photo_url: string | null
  restrictions: string | null
  message: string
}

// Attendance record with full pickup info
export interface AttendanceWithPickup {
  id: string
  organization_id: string
  child_id: string
  classroom_id: string | null
  date: string
  status: string
  check_in_time: string | null
  check_out_time: string | null
  // Drop-off info
  check_in_person_name: string | null
  check_in_person_relationship: string | null
  check_in_guardian_id: string | null
  // Pickup info
  check_out_person_name: string | null
  check_out_person_relationship: string | null
  check_out_guardian_id: string | null
  check_out_verified: boolean | null
  check_out_verification_method: string | null
  // Relations
  child?: {
    id: string
    first_name: string
    last_name: string
    photo_url?: string | null
    family_id: string
  }
  classroom?: {
    id: string
    name: string
  }
}

// Extended stats with pickup tracking
export interface AttendanceStatsWithPickup {
  total: number
  present: number
  absent: number
  late: number
  checked_out: number
  pending_checkout: number // Present but not yet picked up
  verified_pickups: number
  unverified_pickups: number
}

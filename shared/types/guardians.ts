// =====================================================
// Guardians, Emergency Contacts & Authorized Pickups Types
// =====================================================

export type GuardianRelationship =
  | 'mother'
  | 'father'
  | 'stepmother'
  | 'stepfather'
  | 'grandmother'
  | 'grandfather'
  | 'aunt'
  | 'uncle'
  | 'foster_parent'
  | 'legal_guardian'
  | 'other'

export interface Guardian {
  id: string
  organization_id: string
  family_id: string
  first_name: string
  last_name: string
  // Support both old field name (relationship) and new field name (relationship_type)
  relationship?: GuardianRelationship
  relationship_type?: string
  relationship_to_children?: string
  is_primary?: boolean
  is_primary_contact?: boolean
  email: string | null
  phone: string
  phone_secondary?: string | null
  secondary_phone?: string | null
  work_phone?: string | null
  preferred_contact_method?: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  employer?: string | null
  employer_name?: string | null
  employer_phone: string | null
  employer_address: string | null
  occupation?: string | null
  work_schedule?: string | null
  has_custody?: boolean
  custody_status?: string | null
  custody_notes: string | null
  custody_documents_url?: string | null
  can_pickup?: boolean
  is_authorized_pickup?: boolean
  can_make_decisions?: boolean
  receives_invoices?: boolean
  receives_notifications?: boolean
  receives_daily_reports?: boolean
  emergency_priority?: number
  photo_url: string | null
  id_document_type?: string | null
  id_document_number?: string | null
  id_document_url: string | null
  id_expiration_date?: string | null
  id_verified?: boolean
  id_verified_at: string | null
  id_verified_by: string | null
  notes: string | null
  status: 'active' | 'inactive' | 'blocked'
  created_at: string
  updated_at: string
}

export interface GuardianChild {
  id: string
  guardian_id: string
  child_id: string
  relationship: GuardianRelationship
  is_primary_for_child: boolean
  created_at: string
}

export interface EmergencyContact {
  id: string
  organization_id: string
  family_id: string
  child_id?: string
  // Support both name patterns
  first_name?: string
  last_name?: string
  name?: string
  relationship: string
  phone?: string
  phone_primary?: string
  email?: string | null
  phone_secondary?: string | null
  secondary_phone?: string | null
  priority_order: number
  can_pickup?: boolean
  is_authorized_pickup?: boolean
  has_valid_id?: boolean
  id_document_url: string | null
  address: string | null
  availability_notes?: string | null
  notes: string | null
  is_active?: boolean
  created_at: string
  updated_at: string
}

export type AuthorizationType =
  | 'permanent'
  | 'temporary'
  | 'one_time'
  | 'recurring'

export interface AuthorizedPickup {
  id: string
  organization_id: string
  family_id: string
  child_id?: string
  // Support both name patterns
  first_name?: string
  last_name?: string
  name?: string
  relationship: string
  phone: string
  email: string | null
  authorization_type?: AuthorizationType
  valid_from?: string | null
  valid_until: string | null
  specific_days?: string[] | null
  allowed_days?: string[] | null
  photo_url: string | null
  id_type?: string | null
  id_document_type?: string | null
  id_number?: string | null
  id_document_number?: string | null
  id_document_url: string | null
  id_verified?: boolean
  id_verified_at: string | null
  verified_at?: string | null
  id_verified_by: string | null
  secret_code?: string | null
  restrictions?: string | null
  notes: string | null
  added_by?: string | null
  is_active?: boolean
  times_used?: number
  last_pickup_at?: string | null
  created_at: string
  updated_at: string
}

export interface UnauthorizedPickupAttempt {
  id: string
  organization_id: string
  child_id: string
  attempted_by_name: string
  attempted_by_phone: string | null
  attempted_by_relationship: string | null
  staff_id: string | null
  blocked_by: string | null
  reason: string
  admin_notified: boolean
  admin_notified_at: string | null
  resolution: string | null
  resolution_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface PickupValidationResult {
  is_valid: boolean
  person_name: string | null
  relationship: string | null
  photo_url: string | null
  message: string
  requires_id_check: boolean
  restrictions?: string | null
}

export interface GuardianFormData {
  first_name: string
  last_name: string
  relationship: GuardianRelationship
  is_primary: boolean
  email?: string
  phone: string
  phone_secondary?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  employer?: string
  employer_phone?: string
  has_custody: boolean
  custody_notes?: string
  can_pickup: boolean
  notes?: string
}

export interface EmergencyContactFormData {
  first_name: string
  last_name: string
  relationship: string
  phone_primary: string
  phone_secondary?: string
  priority_order: number
  can_pickup: boolean
  address?: string
  notes?: string
}

export interface AuthorizedPickupFormData {
  first_name: string
  last_name: string
  relationship: string
  phone: string
  email?: string
  authorization_type: AuthorizationType
  valid_from?: string
  valid_until?: string
  specific_days?: string[]
  id_type?: string
  id_number?: string
  secret_code?: string
  notes?: string
}

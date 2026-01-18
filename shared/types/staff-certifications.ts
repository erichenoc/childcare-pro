// =====================================================
// Staff Certifications Types
// =====================================================

export type CertificationType =
  | '45_hour_dcf'
  | '40_hour_initial'
  | 'cda'
  | 'cpr_first_aid'
  | 'child_abuse_prevention'
  | 'annual_in_service'
  | 'background_screening'
  | 'health_physical'
  | 'other'

export interface StaffCertification {
  id: string
  organization_id: string
  profile_id: string
  certification_type: CertificationType
  certification_name: string
  issuing_authority: string | null
  certificate_number: string | null
  issue_date: string | null
  expiration_date: string | null
  hours_completed: number | null
  hours_required: number | null
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  document_url: string | null
  notes: string | null
  is_expired: boolean
  created_at: string
  updated_at: string
}

export interface StaffComplianceStatus {
  profile_id: string
  is_compliant: boolean
  has_45_hours: boolean
  has_40_hours: boolean
  has_cda: boolean
  has_valid_cpr: boolean
  has_child_abuse_training: boolean
  has_background_check: boolean
  in_service_hours_current_year: number
  in_service_hours_needed: number
  missing_requirements: string[]
  next_expiration: string | null
  next_expiration_type: string | null
}

export interface StaffProfile {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  email: string
  role: 'owner' | 'director' | 'teacher' | 'assistant' | 'aide'
  has_45_hours_training: boolean
  training_45_hours_date: string | null
  has_40_hours_initial: boolean
  training_40_hours_start_date: string | null
  training_40_hours_completion_date: string | null
  has_cda_credential: boolean
  cda_expiration_date: string | null
  hire_date: string | null
  is_lead_teacher: boolean
  can_be_alone_with_children: boolean
  status: 'active' | 'inactive' | 'terminated'
  created_at: string
}

export interface CertificationFormData {
  certification_type: CertificationType
  certification_name: string
  issuing_authority?: string
  certificate_number?: string
  issue_date?: string
  expiration_date?: string
  hours_completed?: number
  hours_required?: number
  document_url?: string
  notes?: string
}

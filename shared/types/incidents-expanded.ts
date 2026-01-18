// =====================================================
// Expanded Incidents Types
// =====================================================

export type IncidentType =
  | 'injury'
  | 'illness'
  | 'behavioral'
  | 'medication'
  | 'property_damage'
  | 'security'
  | 'other'

export type IncidentSeverity = 'minor' | 'moderate' | 'serious' | 'critical'

export type IncidentStatus = 'open' | 'pending_signature' | 'pending_closure' | 'closed'

export type NotificationMethod = 'phone' | 'in_person' | 'email' | 'text'

export type ParentCopySentMethod = 'email' | 'printed' | 'both'

export interface IncidentExpanded {
  id: string
  organization_id: string
  child_id: string
  classroom_id: string | null
  incident_number: string | null

  // Incident details
  incident_type: IncidentType
  severity: IncidentSeverity
  occurred_at: string
  location: string | null
  description: string
  action_taken: string | null

  // Reporting
  reporting_teacher_id: string | null
  witness_staff_ids: string[]
  witness_names: string[] | null

  // Parent notification
  parent_notified: boolean
  parent_notified_at: string | null
  parent_notified_method: NotificationMethod | null
  parent_notified_by: string | null
  parent_response: string | null

  // Parent signature (MANDATORY for closure)
  parent_signature_data: string | null
  parent_signature_url: string | null
  parent_signed_at: string | null
  parent_signed_by_name: string | null
  parent_signed_by_relationship: string | null
  signature_ip_address: string | null

  // Document copies
  pdf_url: string | null
  daycare_copy_url: string | null
  parent_copy_url: string | null
  parent_copy_sent: boolean
  parent_copy_sent_at: string | null
  parent_copy_sent_method: ParentCopySentMethod | null

  // Follow-up
  follow_up_required: boolean
  follow_up_date: string | null
  follow_up_completed: boolean
  follow_up_completed_at: string | null
  follow_up_completed_by: string | null

  // Closure
  status: IncidentStatus
  closed_at: string | null
  closed_by: string | null
  closure_notes: string | null

  // Attachments
  attachments: string[] | null

  created_at: string
  updated_at: string
}

export interface IncidentReportView {
  id: string
  incident_number: string | null
  organization_id: string
  child_id: string
  child_first_name: string
  child_last_name: string
  child_dob: string
  classroom_name: string | null
  incident_type: IncidentType
  severity: IncidentSeverity
  occurred_at: string
  location: string | null
  description: string
  action_taken: string | null
  reporting_teacher_id: string | null
  reported_by_name: string | null
  witness_staff_ids: string[]
  witness_names_staff: string[] | null
  witness_names: string[] | null
  parent_notified: boolean
  parent_notified_at: string | null
  parent_notified_method: NotificationMethod | null
  has_signature: boolean
  parent_signed_at: string | null
  parent_signed_by_name: string | null
  parent_signed_by_relationship: string | null
  status: IncidentStatus
  follow_up_required: boolean
  follow_up_date: string | null
  follow_up_completed: boolean
  attachments: string[] | null
  pdf_url: string | null
  created_at: string
  updated_at: string
  organization_name: string
  organization_address: string | null
  organization_city: string | null
  organization_state: string | null
  organization_phone: string | null
  organization_logo: string | null
}

export interface IncidentFormData {
  child_id: string
  classroom_id?: string
  incident_type: IncidentType
  severity: IncidentSeverity
  occurred_at: string
  location?: string
  description: string
  action_taken?: string
  reporting_teacher_id?: string
  witness_staff_ids?: string[]
  witness_names?: string[]
  parent_notified?: boolean
  parent_notified_method?: NotificationMethod
  follow_up_required?: boolean
  follow_up_date?: string
}

export interface SignatureFormData {
  signed_by_name: string
  signed_by_relationship: string
  signature_data: string // Base64 canvas data
}

export interface RecordSignatureResult {
  success: boolean
  message: string
  signed_at: string | null
}

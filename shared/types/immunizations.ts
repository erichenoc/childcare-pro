// =====================================================
// Immunization Tracking Types - DCF Florida Compliance
// =====================================================

// Status types
export type ImmunizationStatus = 'pending' | 'verified' | 'expired' | 'exempted'
export type ComplianceStatus = 'compliant' | 'incomplete' | 'overdue' | 'exempt'
export type ExemptionType = 'medical' | 'religious'
export type ExemptionStatus = 'active' | 'expired' | 'revoked'
export type ReminderStatus = 'pending' | 'sent' | 'completed' | 'dismissed'
export type DocumentType = 'certificate' | 'record' | 'exemption'

// ==================== DCF Vaccine Requirements ====================

export interface DcfVaccineRequirement {
  id: string
  vaccine_name: string
  vaccine_code: string
  min_age_months: number
  max_age_months: number | null
  required_doses: number
  dose_interval_days: number | null
  description: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ==================== Immunization Records ====================

export interface ImmunizationRecord {
  id: string
  organization_id: string
  child_id: string
  vaccine_name: string
  vaccine_code: string | null
  dose_number: number
  date_administered: string
  expiration_date: string | null
  provider_name: string | null
  provider_location: string | null
  lot_number: string | null
  document_url: string | null
  document_type: DocumentType | null
  verified_by: string | null
  verified_at: string | null
  verification_notes: string | null
  status: ImmunizationStatus
  notes: string | null
  recorded_by: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
    date_of_birth: string
    classroom_id: string | null
  }
  verifier?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface ImmunizationRecordFormData {
  child_id: string
  vaccine_name: string
  vaccine_code?: string
  dose_number: number
  date_administered: string
  expiration_date?: string
  provider_name?: string
  provider_location?: string
  lot_number?: string
  document_url?: string
  document_type?: DocumentType
  status?: ImmunizationStatus
  notes?: string
}

// ==================== Immunization Exemptions ====================

export interface ImmunizationExemption {
  id: string
  organization_id: string
  child_id: string
  exemption_type: ExemptionType
  vaccine_codes: string[] | null
  start_date: string
  end_date: string | null
  document_url: string | null
  physician_name: string | null
  physician_license: string | null
  status: ExemptionStatus
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
  approver?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface ImmunizationExemptionFormData {
  child_id: string
  exemption_type: ExemptionType
  vaccine_codes?: string[]
  start_date: string
  end_date?: string
  document_url?: string
  physician_name?: string
  physician_license?: string
  notes?: string
}

// ==================== Compliance Tracking ====================

export interface ImmunizationCompliance {
  id: string
  organization_id: string
  child_id: string
  compliance_status: ComplianceStatus
  last_checked_at: string
  vaccines_complete: number
  vaccines_required: number
  vaccines_overdue: number
  vaccines_exempt: number
  next_due_vaccine: string | null
  next_due_date: string | null
  provisional_enrollment: boolean
  provisional_end_date: string | null
  provisional_notes: string | null
  last_report_generated: string | null
  last_dcf_submission: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
    date_of_birth: string
    classroom_id: string | null
  }
}

// ==================== Reminders ====================

export interface ImmunizationReminder {
  id: string
  organization_id: string
  child_id: string
  vaccine_code: string
  vaccine_name: string
  due_date: string
  reminder_sent: boolean
  reminder_sent_at: string | null
  reminder_sent_to: string[] | null
  status: ReminderStatus
  follow_up_date: string | null
  follow_up_sent: boolean
  notes: string | null
  created_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface ImmunizationReminderFormData {
  child_id: string
  vaccine_code: string
  vaccine_name: string
  due_date: string
  follow_up_date?: string
  notes?: string
}

// ==================== Summary & Reports ====================

export interface OrganizationImmunizationSummary {
  total_children: number
  fully_compliant: number
  incomplete: number
  overdue: number
  exempt: number
  provisional: number
  compliance_rate: number
}

export interface ChildImmunizationStatus {
  child_id: string
  organization_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  age_months: number
  compliance_status: ComplianceStatus
  vaccines_complete: number
  vaccines_required: number
  vaccines_overdue: number
  next_due_vaccine: string | null
  next_due_date: string | null
  provisional_enrollment: boolean
  provisional_end_date: string | null
  last_checked_at: string | null
}

export interface OverdueImmunization {
  organization_id: string
  child_id: string
  child_name: string
  date_of_birth: string
  vaccine_name: string
  vaccine_code: string
  required_doses: number
  doses_given: number
  doses_needed: number
}

export interface VaccineStatusByChild {
  vaccine_code: string
  vaccine_name: string
  required_doses: number
  doses_received: number
  last_dose_date: string | null
  is_complete: boolean
  is_exempt: boolean
  next_dose_due: string | null
}

export interface ChildImmunizationReport {
  child: {
    id: string
    first_name: string
    last_name: string
    date_of_birth: string
    age_months: number
  }
  compliance: ImmunizationCompliance | null
  records: ImmunizationRecord[]
  exemptions: ImmunizationExemption[]
  vaccines_status: VaccineStatusByChild[]
  reminders: ImmunizationReminder[]
}

// ==================== DCF Report Types ====================

export interface DcfImmunizationReport {
  organization_id: string
  organization_name: string
  report_date: string
  report_period: {
    start_date: string
    end_date: string
  }
  summary: OrganizationImmunizationSummary
  children_by_status: {
    compliant: ChildImmunizationStatus[]
    incomplete: ChildImmunizationStatus[]
    overdue: ChildImmunizationStatus[]
    exempt: ChildImmunizationStatus[]
    provisional: ChildImmunizationStatus[]
  }
  overdue_details: OverdueImmunization[]
  generated_at: string
  generated_by: string | null
}

// ==================== UI Helpers ====================

export interface ImmunizationFilters {
  status?: ComplianceStatus
  classroom_id?: string
  search?: string
  show_provisional?: boolean
}

export interface ImmunizationStats {
  total: number
  compliant: number
  incomplete: number
  overdue: number
  exempt: number
  provisional: number
  compliance_percentage: number
}

// DCF Vaccine codes for Florida
export const DCF_VACCINE_CODES = {
  DTAP: 'DTaP (Diphtheria, Tetanus, Pertussis)',
  IPV: 'Polio (IPV)',
  MMR: 'MMR (Measles, Mumps, Rubella)',
  HEPB: 'Hepatitis B',
  VAR: 'Varicella (Chickenpox)',
  HIB: 'Hib (Haemophilus influenzae type b)',
  PCV13: 'PCV13 (Pneumococcal)',
} as const

export type DcfVaccineCode = keyof typeof DCF_VACCINE_CODES

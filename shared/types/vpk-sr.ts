// =====================================================
// VPK & School Readiness Types
// =====================================================

// VPK Types
export type VpkProgramType = 'school_year' | 'summer'
export type VpkStatus = 'active' | 'completed' | 'withdrawn' | 'transferred'
export type AssessmentPeriod = 'AP1' | 'AP2' | 'AP3'
export type ProgressStatus = 'beginning' | 'progressing' | 'advancing' | 'near_complete' | 'complete'

export interface VpkEnrollment {
  id: string
  organization_id: string
  child_id: string
  school_year: string
  certificate_number: string | null
  certificate_issue_date: string | null
  certificate_expiration_date: string | null
  program_type: VpkProgramType
  required_hours: number
  enrollment_date: string
  start_date: string
  end_date: string | null
  status: VpkStatus
  withdrawal_date: string | null
  withdrawal_reason: string | null
  transfer_to: string | null
  hours_completed: number
  hours_remaining: number
  is_hours_complete: boolean
  elc_region: string | null
  elc_case_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VpkAttendance {
  id: string
  organization_id: string
  vpk_enrollment_id: string
  child_id: string
  date: string
  hours: number
  attendance_id: string | null
  recorded_by: string | null
  created_at: string
}

export interface VpkAssessment {
  id: string
  organization_id: string
  vpk_enrollment_id: string
  child_id: string
  school_year: string
  assessment_period: AssessmentPeriod
  assessment_date: string
  administered_by: string | null

  // Scores
  print_knowledge_score: number | null
  print_knowledge_percentile: number | null
  phonological_awareness_score: number | null
  phonological_awareness_percentile: number | null
  mathematics_score: number | null
  mathematics_percentile: number | null
  oral_language_score: number | null
  oral_language_percentile: number | null
  total_score: number | null
  total_percentile: number | null
  kindergarten_ready: boolean | null

  // Notes
  observations: string | null
  recommendations: string | null
  parent_conference_date: string | null
  parent_conference_notes: string | null

  // Submission
  submitted_to_elc: boolean
  submitted_at: string | null
  elc_confirmation: string | null

  created_at: string
  updated_at: string
}

export interface VpkEnrollmentSummary {
  id: string
  organization_id: string
  child_id: string
  child_name: string
  school_year: string
  program_type: VpkProgramType
  required_hours: number
  hours_completed: number
  hours_remaining: number
  is_hours_complete: boolean
  status: VpkStatus
  certificate_number: string | null
  assessments_completed: number
  last_assessment: AssessmentPeriod | null
  progress_status: ProgressStatus
}

export interface VpkAssessmentStatus {
  requires_ap1: boolean
  ap1_completed: boolean
  requires_ap2: boolean
  ap2_completed: boolean
  requires_ap3: boolean
  ap3_completed: boolean
  all_required_complete: boolean
}

// School Readiness Types
export type SrEligibilityType = 'at_risk' | 'economic_self_sufficiency' | 'protective_services' | 'working_poor'
export type SrStatus = 'active' | 'pending' | 'suspended' | 'terminated'
export type ParentActivity = 'employed' | 'student' | 'job_training'
export type CopayFrequency = 'weekly' | 'biweekly' | 'monthly'
export type AbsenceReason = 'illness' | 'family_emergency' | 'vacation' | 'no_show'
export type EligibilityStatus = 'current' | 'due_soon' | 'overdue'

export interface SrEnrollment {
  id: string
  organization_id: string
  child_id: string
  family_id: string | null
  school_year: string
  enrollment_date: string
  start_date: string
  end_date: string | null

  // Eligibility
  eligibility_type: SrEligibilityType
  eligibility_start_date: string
  eligibility_end_date: string | null
  redetermination_date: string | null

  // ELC info
  elc_region: string | null
  elc_case_number: string | null
  elc_worker_name: string | null
  elc_worker_phone: string | null

  // Parent activity
  parent1_activity: ParentActivity | null
  parent1_employer: string | null
  parent1_work_hours: number | null
  parent2_activity: ParentActivity | null
  parent2_employer: string | null
  parent2_work_hours: number | null

  // Care schedule
  authorized_hours_weekly: number | null
  care_schedule: Record<string, { start: string; end: string }> | null

  // Co-pay
  copay_amount: number
  copay_frequency: CopayFrequency

  // Status
  status: SrStatus
  status_change_date: string | null
  status_change_reason: string | null

  // Absence tracking
  total_absences: number
  consecutive_absences: number
  absence_warning_sent: boolean
  absence_warning_date: string | null

  notes: string | null
  created_at: string
  updated_at: string
}

export interface SrAttendance {
  id: string
  organization_id: string
  sr_enrollment_id: string
  child_id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  hours: number | null
  is_absent: boolean
  absence_reason: AbsenceReason | null
  absence_documented: boolean
  attendance_id: string | null
  recorded_by: string | null
  created_at: string
}

export interface SrEnrollmentSummary {
  id: string
  organization_id: string
  child_id: string
  child_name: string
  school_year: string
  eligibility_type: SrEligibilityType
  eligibility_end_date: string | null
  redetermination_date: string | null
  authorized_hours_weekly: number | null
  copay_amount: number
  copay_frequency: CopayFrequency
  status: SrStatus
  total_absences: number
  consecutive_absences: number
  absence_warning_sent: boolean
  eligibility_status: EligibilityStatus
}

export interface SrUpcomingRedetermination {
  id: string
  organization_id: string
  child_id: string
  child_name: string
  parent_name: string | null
  parent_email: string | null
  parent_phone: string | null
  redetermination_date: string
  elc_case_number: string | null
  elc_worker_name: string | null
  days_until_due: number
}

export interface VpkEnrollmentFormData {
  child_id: string
  school_year: string
  program_type: VpkProgramType
  certificate_number?: string
  certificate_issue_date?: string
  enrollment_date: string
  start_date: string
  elc_region?: string
  elc_case_number?: string
  notes?: string
}

export interface VpkAssessmentFormData {
  vpk_enrollment_id: string
  assessment_period: AssessmentPeriod
  assessment_date: string
  administered_by?: string
  print_knowledge_score?: number
  print_knowledge_percentile?: number
  phonological_awareness_score?: number
  phonological_awareness_percentile?: number
  mathematics_score?: number
  mathematics_percentile?: number
  oral_language_score?: number
  oral_language_percentile?: number
  observations?: string
  recommendations?: string
  parent_conference_date?: string
  parent_conference_notes?: string
}

export interface SrEnrollmentFormData {
  child_id: string
  family_id?: string
  school_year: string
  enrollment_date: string
  start_date: string
  eligibility_type: SrEligibilityType
  eligibility_start_date: string
  eligibility_end_date?: string
  redetermination_date?: string
  elc_region?: string
  elc_case_number?: string
  elc_worker_name?: string
  elc_worker_phone?: string
  parent1_activity?: ParentActivity
  parent1_employer?: string
  parent1_work_hours?: number
  parent2_activity?: ParentActivity
  parent2_employer?: string
  parent2_work_hours?: number
  authorized_hours_weekly?: number
  copay_amount?: number
  copay_frequency?: CopayFrequency
  notes?: string
}

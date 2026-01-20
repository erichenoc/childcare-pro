// =====================================================
// Admissions & Waitlist Types
// =====================================================

// ==================== Enums ====================

export type InquiryStatus =
  | 'new'
  | 'contacted'
  | 'tour_scheduled'
  | 'tour_completed'
  | 'application_sent'
  | 'application_received'
  | 'waitlisted'
  | 'offered'
  | 'accepted'
  | 'enrolled'
  | 'declined'
  | 'withdrawn'

export type LeadSource =
  | 'website'
  | 'referral'
  | 'walk_in'
  | 'phone'
  | 'social_media'
  | 'google'
  | 'childcare_aware'
  | 'dcf_referral'
  | 'other'

export type TourStatus = 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled' | 'rescheduled'

export type WaitlistPriority = 'normal' | 'high' | 'vip' | 'sibling'

export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn'

export type CommunicationType = 'email' | 'phone' | 'sms' | 'in_person' | 'note'

// ==================== Admission Inquiries ====================

export interface AdmissionInquiry {
  id: string
  organization_id: string
  parent_first_name: string
  parent_last_name: string
  email: string
  phone: string | null
  preferred_contact_method: string
  child_first_name: string
  child_last_name: string | null
  child_date_of_birth: string
  child_gender: string | null
  desired_start_date: string | null
  schedule_type: string | null
  requested_classroom_id: string | null
  special_needs_notes: string | null
  lead_source: LeadSource
  referral_source: string | null
  marketing_campaign: string | null
  status: InquiryStatus
  assigned_to: string | null
  converted_to_family_id: string | null
  converted_to_child_id: string | null
  decline_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
  last_contacted_at: string | null
  // Joined relations
  assigned_staff?: {
    id: string
    first_name: string
    last_name: string
  }
  requested_classroom?: {
    id: string
    name: string
  }
  tours?: AdmissionTour[]
  waitlist_entry?: WaitlistEntry
}

export interface AdmissionInquiryFormData {
  parent_first_name: string
  parent_last_name: string
  email: string
  phone?: string
  preferred_contact_method?: string
  child_first_name: string
  child_last_name?: string
  child_date_of_birth: string
  child_gender?: string
  desired_start_date?: string
  schedule_type?: string
  requested_classroom_id?: string
  special_needs_notes?: string
  lead_source: LeadSource
  referral_source?: string
  notes?: string
}

// ==================== Tours ====================

export interface AdmissionTour {
  id: string
  organization_id: string
  inquiry_id: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  tour_guide_id: string | null
  status: TourStatus
  confirmed_at: string | null
  completed_at: string | null
  pre_tour_notes: string | null
  post_tour_notes: string | null
  parent_feedback: string | null
  follow_up_required: boolean
  follow_up_date: string | null
  follow_up_notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  inquiry?: AdmissionInquiry
  tour_guide?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface AdmissionTourFormData {
  inquiry_id: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes?: number
  tour_guide_id?: string
  pre_tour_notes?: string
}

// ==================== Waitlist ====================

export interface WaitlistEntry {
  id: string
  organization_id: string
  inquiry_id: string
  position: number | null
  priority: WaitlistPriority
  priority_reason: string | null
  requested_classroom_id: string | null
  requested_start_date: string | null
  flexible_start_date: boolean
  child_age_at_start_months: number | null
  age_group: string | null
  is_active: boolean
  offered_spot_at: string | null
  offer_expires_at: string | null
  offer_response: string | null
  deposit_required: number | null
  deposit_paid: boolean
  deposit_paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  inquiry?: AdmissionInquiry
  requested_classroom?: {
    id: string
    name: string
  }
}

export interface WaitlistEntryFormData {
  inquiry_id: string
  priority?: WaitlistPriority
  priority_reason?: string
  requested_classroom_id?: string
  requested_start_date?: string
  flexible_start_date?: boolean
  deposit_required?: number
  notes?: string
}

// ==================== Enrollment Applications ====================

export interface ParentInfo {
  name: string
  relationship: string
  ssn_last4?: string
  employer?: string
  work_phone?: string
  address?: string
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  authorized_pickup: boolean
}

export interface ChildInfo {
  allergies?: string[]
  medical_conditions?: string[]
  medications?: string[]
  doctor_name?: string
  doctor_phone?: string
  special_instructions?: string
}

export interface DocumentsChecklist {
  birth_certificate?: boolean
  immunization_records?: boolean
  physical_exam?: boolean
  custody_documents?: boolean
  insurance_card?: boolean
}

export interface Authorizations {
  photo_consent?: boolean
  video_consent?: boolean
  sunscreen_consent?: boolean
  bug_spray_consent?: boolean
  field_trip_consent?: boolean
  emergency_medical_consent?: boolean
  transportation_consent?: boolean
}

export interface EnrollmentApplication {
  id: string
  organization_id: string
  inquiry_id: string
  application_number: string | null
  submitted_at: string | null
  status: ApplicationStatus
  parent_info: ParentInfo
  emergency_contacts: EmergencyContact[]
  child_info: ChildInfo
  documents_checklist: DocumentsChecklist
  authorizations: Authorizations
  parent_signature: string | null
  parent_signature_date: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  approved_start_date: string | null
  created_at: string
  updated_at: string
  // Joined relations
  inquiry?: AdmissionInquiry
  reviewer?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface EnrollmentApplicationFormData {
  inquiry_id: string
  parent_info: ParentInfo
  emergency_contacts: EmergencyContact[]
  child_info: ChildInfo
  documents_checklist: DocumentsChecklist
  authorizations: Authorizations
  parent_signature?: string
  parent_signature_date?: string
}

// ==================== Communications ====================

export interface AdmissionCommunication {
  id: string
  organization_id: string
  inquiry_id: string
  communication_type: CommunicationType
  direction: 'inbound' | 'outbound'
  subject: string | null
  content: string | null
  staff_id: string | null
  requires_follow_up: boolean
  follow_up_date: string | null
  follow_up_completed: boolean
  created_at: string
  // Joined relations
  staff?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface AdmissionCommunicationFormData {
  inquiry_id: string
  communication_type: CommunicationType
  direction: 'inbound' | 'outbound'
  subject?: string
  content?: string
  requires_follow_up?: boolean
  follow_up_date?: string
}

// ==================== Pipeline Stats ====================

export interface PipelineStats {
  status: InquiryStatus
  count: number
}

export interface WaitlistAgeGroupStats {
  age_group: string
  count: number
  avg_wait_days: number
}

// ==================== UI Labels ====================

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  tour_scheduled: 'Tour Scheduled',
  tour_completed: 'Tour Completed',
  application_sent: 'Application Sent',
  application_received: 'Application Received',
  waitlisted: 'Waitlisted',
  offered: 'Offered Spot',
  accepted: 'Accepted',
  enrolled: 'Enrolled',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
}

export const INQUIRY_STATUS_COLORS: Record<InquiryStatus, string> = {
  new: 'blue',
  contacted: 'yellow',
  tour_scheduled: 'purple',
  tour_completed: 'indigo',
  application_sent: 'cyan',
  application_received: 'teal',
  waitlisted: 'orange',
  offered: 'lime',
  accepted: 'green',
  enrolled: 'emerald',
  declined: 'red',
  withdrawn: 'gray',
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: 'Website',
  referral: 'Referral',
  walk_in: 'Walk-In',
  phone: 'Phone Call',
  social_media: 'Social Media',
  google: 'Google Search',
  childcare_aware: 'Childcare Aware',
  dcf_referral: 'DCF Referral',
  other: 'Other',
}

export const TOUR_STATUS_LABELS: Record<TourStatus, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  completed: 'Completed',
  no_show: 'No Show',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
}

export const TOUR_STATUS_COLORS: Record<TourStatus, string> = {
  scheduled: 'blue',
  confirmed: 'green',
  completed: 'emerald',
  no_show: 'red',
  cancelled: 'gray',
  rescheduled: 'orange',
}

export const WAITLIST_PRIORITY_LABELS: Record<WaitlistPriority, string> = {
  normal: 'Normal',
  high: 'High',
  vip: 'VIP',
  sibling: 'Sibling',
}

export const WAITLIST_PRIORITY_COLORS: Record<WaitlistPriority, string> = {
  normal: 'gray',
  high: 'orange',
  vip: 'purple',
  sibling: 'blue',
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export const COMMUNICATION_TYPE_LABELS: Record<CommunicationType, string> = {
  email: 'Email',
  phone: 'Phone',
  sms: 'SMS',
  in_person: 'In Person',
  note: 'Note',
}

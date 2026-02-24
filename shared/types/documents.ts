// =====================================================
// Documents & Forms Types - DCF Compliance
// =====================================================

// Enums
export type DocumentCategory = 'enrollment' | 'medical' | 'dcf' | 'permission' | 'emergency' | 'financial' | 'other'
export type DocumentStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired'
export type DocumentComplianceStatus = 'compliant' | 'incomplete' | 'overdue' | 'pending_review'
export type EntityType = 'child' | 'family' | 'staff'
export type SignerType = 'parent' | 'guardian' | 'staff' | 'witness'
export type ContentType = 'html' | 'pdf' | 'external_url'
export type FileType = 'pdf' | 'image' | 'doc'
export type RequestStatus = 'pending' | 'sent' | 'viewed' | 'submitted' | 'approved' | 'overdue'

// ==================== Document Templates ====================

export interface DocumentTemplate {
  id: string
  organization_id: string | null
  name: string
  description: string | null
  category: DocumentCategory
  content_type: ContentType
  content: string | null
  template_url: string | null
  requires_signature: boolean
  requires_parent_signature: boolean
  requires_staff_signature: boolean
  requires_witness_signature: boolean
  has_expiration: boolean
  expiration_months: number | null
  is_dcf_required: boolean
  dcf_form_number: string | null
  applies_to: EntityType
  is_active: boolean
  is_system_template: boolean
  version: number
  previous_version_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DocumentTemplateFormData {
  name: string
  description?: string
  category: DocumentCategory
  content_type?: ContentType
  content?: string
  template_url?: string
  requires_signature?: boolean
  requires_parent_signature?: boolean
  requires_staff_signature?: boolean
  requires_witness_signature?: boolean
  has_expiration?: boolean
  expiration_months?: number
  is_dcf_required?: boolean
  dcf_form_number?: string
  applies_to: EntityType
}

// ==================== Documents ====================

export interface Document {
  id: string
  organization_id: string
  template_id: string | null
  name: string
  description: string | null
  category: DocumentCategory
  entity_type: EntityType
  entity_id: string
  file_url: string | null
  file_type: FileType | null
  file_size: number | null
  file_name: string | null
  status: DocumentStatus
  submitted_at: string | null
  effective_date: string | null
  expiration_date: string | null
  verified_by: string | null
  verified_at: string | null
  verification_notes: string | null
  rejection_reason: string | null
  notes: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
  // Joined relations
  template?: DocumentTemplate
  verifier?: {
    id: string
    first_name: string
    last_name: string
  }
  signatures?: DocumentSignature[]
}

export interface DocumentFormData {
  template_id?: string
  name: string
  description?: string
  category: DocumentCategory
  entity_type: EntityType
  entity_id: string
  file_url?: string
  file_type?: FileType
  file_size?: number
  file_name?: string
  effective_date?: string
  expiration_date?: string
  notes?: string
}

// ==================== Document Signatures ====================

export interface DocumentSignature {
  id: string
  organization_id: string
  document_id: string
  signer_type: SignerType
  signer_name: string
  signer_email: string | null
  signer_relationship: string | null
  signature_data: string | null
  signature_ip: string | null
  signed_at: string
  profile_id: string | null
  guardian_id: string | null
  created_at: string
}

export interface SignatureFormData {
  document_id: string
  signer_type: SignerType
  signer_name: string
  signer_email?: string
  signer_relationship?: string
  signature_data: string
}

// ==================== Document Requests ====================

export interface DocumentRequest {
  id: string
  organization_id: string
  template_id: string
  entity_type: EntityType
  entity_id: string
  status: RequestStatus
  requested_at: string
  requested_by: string | null
  reminder_sent_at: string | null
  reminder_count: number
  due_date: string | null
  document_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  template?: DocumentTemplate
  document?: Document
}

export interface DocumentRequestFormData {
  template_id: string
  entity_type: EntityType
  entity_id: string
  due_date?: string
  notes?: string
}

// ==================== Document Compliance ====================

export interface DocumentCompliance {
  id: string
  organization_id: string
  entity_type: EntityType
  entity_id: string
  compliance_status: DocumentComplianceStatus
  total_required: number
  total_submitted: number
  total_approved: number
  total_expiring_soon: number
  total_expired: number
  missing_documents: string[]
  expiring_documents: string[]
  last_checked_at: string
  created_at: string
  updated_at: string
}

// ==================== Summary & Reports ====================

export interface OrganizationDocumentSummary {
  total_entities: number
  fully_compliant: number
  pending_review: number
  incomplete: number
  overdue: number
  compliance_rate: number
}

export interface EntityDocumentStatus {
  entity_type: EntityType
  entity_id: string
  entity_name: string
  compliance_status: DocumentComplianceStatus
  total_required: number
  total_approved: number
  missing_documents: string[]
  expiring_documents: string[]
}

export interface ExpiringDocument {
  organization_id: string
  document_id: string
  document_name: string
  entity_type: EntityType
  entity_id: string
  expiration_date: string
  days_until_expiration: number
  entity_name: string
}

export interface MissingDocument {
  organization_id: string
  entity_type: EntityType
  entity_id: string
  missing_document_name: string
  compliance_status: DocumentComplianceStatus
  entity_name: string
}

// ==================== UI Helpers ====================

export interface DocumentFilters {
  category?: DocumentCategory
  status?: DocumentStatus
  entity_type?: EntityType
  search?: string
  expiring_soon?: boolean
}

export interface DocumentStats {
  total: number
  pending: number
  submitted: number
  approved: number
  rejected: number
  expired: number
  expiring_soon: number
}

// Category labels for UI
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  enrollment: 'Enrollment',
  medical: 'Medical',
  dcf: 'DCF Required',
  permission: 'Permission',
  emergency: 'Emergency',
  financial: 'Financial',
  other: 'Other',
}

// Status labels for UI
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
}

// Status colors for badges
export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

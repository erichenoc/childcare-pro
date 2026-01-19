// =====================================================
// Shared Types Index
// =====================================================

// Base models
export * from './models'

// Database types (Supabase generated)
export * from './database.types'

// Admin/Super Admin types
export * from './admin'

// Staff certifications (DCF compliance)
export * from './staff-certifications'

// Guardians, emergency contacts, authorized pickups
export * from './guardians'

// Expanded attendance
export * from './attendance-expanded'

// Expanded incidents (with signature) - exclude types already in database.types
export {
  // Exclude IncidentType and IncidentSeverity (already in database.types)
  type IncidentStatus,
  type NotificationMethod,
  type ParentCopySentMethod,
  type IncidentExpanded,
  type IncidentReportView,
  type IncidentFormData,
  type SignatureFormData,
  type RecordSignatureResult,
} from './incidents-expanded'

// Expanded invoices (multi-week) - exclude types already in database.types
export {
  type PaymentPeriodType,
  // Exclude InvoiceStatus (already in database.types)
  type InvoiceExpanded,
  type InvoiceWeek,
  type InvoiceDetailsView,
  type InvoiceWeekDetail,
  type OverdueInvoiceView,
  type CreateWeeklyInvoiceInput,
  type InvoiceWeekInput,
  type CreateInvoiceResult,
} from './invoices-expanded'

// Food program (CACFP)
export * from './food-program'

// VPK & School Readiness
export * from './vpk-sr'

// Accounting
export * from './accounting'

// Notifications
export * from './notifications'

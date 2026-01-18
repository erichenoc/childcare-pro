// =====================================================
// Expanded Invoices Types
// =====================================================

export type PaymentPeriodType = 'weekly' | 'biweekly' | 'monthly'
export type InvoiceStatus = 'draft' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'void'

export interface InvoiceExpanded {
  id: string
  organization_id: string
  family_id: string
  invoice_number: string

  // Period
  period_start: string
  period_end: string
  due_date: string

  // Multi-week support
  payment_period_type: PaymentPeriodType
  weeks_covered: number
  week_start_date: string | null
  week_end_date: string | null

  // Amounts
  subtotal: number
  discount: number
  advance_payment_discount_percent: number
  advance_payment_discount_amount: number
  other_discount_reason: string | null
  late_fee_amount: number
  late_fee_applied_at: string | null
  tax: number
  total: number
  balance: number

  // Status
  status: InvoiceStatus

  // PDF generation
  pdf_url: string | null
  pdf_generated_at: string | null

  // Email tracking
  sent_to_email: string | null
  sent_at: string | null
  email_opened: boolean
  email_opened_at: string | null

  // Reminders
  reminder_sent: boolean
  reminder_sent_at: string | null
  reminder_count: number

  // Children covered
  children_ids: string[]

  notes: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceWeek {
  id: string
  organization_id: string
  invoice_id: string
  week_number: number
  start_date: string
  end_date: string
  base_amount: number
  additional_charges: number
  additional_charges_description: string | null
  discount_amount: number
  discount_reason: string | null
  subtotal: number
  days_count: number
  days_included: string[] | null
  notes: string | null
  created_at: string
}

export interface InvoiceDetailsView {
  // Invoice fields
  id: string
  organization_id: string
  family_id: string
  invoice_number: string
  period_start: string
  period_end: string
  due_date: string
  payment_period_type: PaymentPeriodType
  weeks_covered: number
  subtotal: number
  discount: number
  advance_payment_discount_percent: number
  advance_payment_discount_amount: number
  late_fee_amount: number
  total: number
  balance: number
  status: InvoiceStatus
  pdf_url: string | null
  sent_at: string | null
  children_ids: string[]

  // Family info
  family_code: string
  family_contact_name: string
  family_email: string | null
  family_phone: string | null
  family_address: string | null
  family_city: string | null
  family_state: string | null
  family_zip: string | null

  // Children names
  children_names: string[]

  // Weeks detail
  weeks_detail: InvoiceWeekDetail[]

  // Organization info
  organization_name: string
  organization_address: string | null
  organization_city: string | null
  organization_state: string | null
  organization_phone: string | null
  organization_email: string | null
  organization_logo: string | null
}

export interface InvoiceWeekDetail {
  week_number: number
  start_date: string
  end_date: string
  base_amount: number
  additional_charges: number
  discount_amount: number
  subtotal: number
}

export interface OverdueInvoiceView {
  id: string
  invoice_number: string
  family_id: string
  primary_contact_name: string
  email: string | null
  phone: string | null
  total: number
  balance: number
  due_date: string
  days_overdue: number
  reminder_count: number
  late_fee_amount: number
  organization_id: string
}

export interface CreateWeeklyInvoiceInput {
  family_id: string
  children_ids: string[]
  weeks: InvoiceWeekInput[]
  due_date: string
  advance_discount_percent?: number
  notes?: string
}

export interface InvoiceWeekInput {
  start_date: string
  end_date: string
  base_amount: number
  additional_charges?: number
  additional_charges_description?: string
  discount?: number
  discount_reason?: string
}

export interface CreateInvoiceResult {
  success: boolean
  invoice_id: string | null
  invoice_number: string | null
  total_amount: number | null
  message: string
}

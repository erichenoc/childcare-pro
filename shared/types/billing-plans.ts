// =====================================================
// Billing Plans Types - Rate Templates & Enrollments
// =====================================================

// ==================== Enums ====================

export type ScheduleType = 'full_time' | 'part_time' | 'before_after' | 'drop_in' | 'summer_camp'
export type BillingFrequency = 'weekly' | 'biweekly' | 'monthly' | 'annually'
export type EnrollmentStatus = 'active' | 'pending' | 'suspended' | 'terminated'
export type DiscountType = 'percentage' | 'fixed_amount'
export type AdjustmentType = 'credit' | 'debit' | 'refund' | 'waiver'

// ==================== Billing Rate Templates ====================

export interface BillingRateTemplate {
  id: string
  organization_id: string
  name: string
  description: string | null
  age_range_start_months: number
  age_range_end_months: number
  schedule_type: ScheduleType
  billing_frequency: BillingFrequency
  base_rate: number
  registration_fee: number
  supply_fee_monthly: number
  late_pickup_fee_per_minute: number
  days_per_week: number
  hours_per_day: number
  effective_from: string
  effective_to: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BillingRateTemplateFormData {
  name: string
  description?: string
  age_range_start_months: number
  age_range_end_months: number
  schedule_type: ScheduleType
  billing_frequency: BillingFrequency
  base_rate: number
  registration_fee?: number
  supply_fee_monthly?: number
  late_pickup_fee_per_minute?: number
  days_per_week?: number
  hours_per_day?: number
  effective_from?: string
  effective_to?: string
  is_active?: boolean
}

// ==================== Billing Discounts ====================

export interface BillingDiscount {
  id: string
  organization_id: string
  name: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  applies_to_siblings: boolean
  sibling_order: number | null
  applies_to_staff: boolean
  applies_to_military: boolean
  applies_to_prepayment: boolean
  eligibility_code: string | null
  effective_from: string
  effective_to: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BillingDiscountFormData {
  name: string
  description?: string
  discount_type: DiscountType
  discount_value: number
  applies_to_siblings?: boolean
  sibling_order?: number
  applies_to_staff?: boolean
  applies_to_military?: boolean
  applies_to_prepayment?: boolean
  eligibility_code?: string
  effective_from?: string
  effective_to?: string
  is_active?: boolean
}

// ==================== Child Billing Enrollments ====================

export interface ChildBillingEnrollment {
  id: string
  organization_id: string
  child_id: string
  family_id: string
  rate_template_id: string
  custom_rate: number | null
  enrollment_status: EnrollmentStatus
  enrolled_date: string
  termination_date: string | null
  termination_reason: string | null
  scheduled_days: string[] | null
  start_time: string | null
  end_time: string | null
  auto_invoice: boolean
  billing_day_of_week: number
  billing_day_of_month: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
    date_of_birth: string
  }
  family?: {
    id: string
    name: string
    primary_contact_name: string | null
  }
  rate_template?: BillingRateTemplate
  applied_discounts?: AppliedDiscount[]
}

export interface ChildBillingEnrollmentFormData {
  child_id: string
  family_id: string
  rate_template_id: string
  custom_rate?: number
  enrollment_status?: EnrollmentStatus
  enrolled_date?: string
  scheduled_days?: string[]
  start_time?: string
  end_time?: string
  auto_invoice?: boolean
  billing_day_of_week?: number
  billing_day_of_month?: number
  notes?: string
}

// ==================== Applied Discounts ====================

export interface AppliedDiscount {
  id: string
  organization_id: string
  enrollment_id: string
  discount_id: string
  custom_discount_value: number | null
  applied_from: string
  applied_to: string | null
  notes: string | null
  created_at: string
  // Joined relations
  discount?: BillingDiscount
}

export interface AppliedDiscountFormData {
  enrollment_id: string
  discount_id: string
  custom_discount_value?: number
  applied_from?: string
  applied_to?: string
  notes?: string
}

// ==================== Recurring Invoice Templates ====================

export interface RecurringInvoiceLineItem {
  description: string
  amount: number
  child_id?: string
  enrollment_id?: string
}

export interface RecurringInvoiceTemplate {
  id: string
  organization_id: string
  family_id: string
  name: string
  description: string | null
  line_items: RecurringInvoiceLineItem[]
  frequency: BillingFrequency
  billing_day_of_week: number | null
  billing_day_of_month: number | null
  generate_days_before: number
  due_days_after_generation: number
  auto_send: boolean
  start_date: string
  end_date: string | null
  is_active: boolean
  last_generated_date: string | null
  next_generation_date: string | null
  created_at: string
  updated_at: string
  // Joined relations
  family?: {
    id: string
    name: string
    primary_contact_name: string | null
  }
}

export interface RecurringInvoiceTemplateFormData {
  family_id: string
  name: string
  description?: string
  line_items: RecurringInvoiceLineItem[]
  frequency: BillingFrequency
  billing_day_of_week?: number
  billing_day_of_month?: number
  generate_days_before?: number
  due_days_after_generation?: number
  auto_send?: boolean
  start_date?: string
  end_date?: string
  is_active?: boolean
}

// ==================== Billing Adjustments ====================

export interface BillingAdjustment {
  id: string
  organization_id: string
  enrollment_id: string | null
  family_id: string
  invoice_id: string | null
  adjustment_type: AdjustmentType
  amount: number
  reason: string
  applies_to_period_start: string | null
  applies_to_period_end: string | null
  is_applied: boolean
  applied_to_invoice_id: string | null
  applied_at: string | null
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
  // Joined relations
  family?: {
    id: string
    name: string
  }
  creator?: {
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

export interface BillingAdjustmentFormData {
  enrollment_id?: string
  family_id: string
  adjustment_type: AdjustmentType
  amount: number
  reason: string
  applies_to_period_start?: string
  applies_to_period_end?: string
  notes?: string
}

// ==================== Calculated Types ====================

export interface ChildBillingRate {
  enrollment_id: string
  rate_name: string
  base_rate: number
  custom_rate: number | null
  effective_rate: number
  total_discount: number
  final_rate: number
  billing_frequency: BillingFrequency
}

export interface FamilyBillingSummary {
  family_id: string
  family_name: string
  enrolled_children: number
  total_weekly_rate: number
  total_monthly_rate: number
  active_discounts: number
  pending_balance: number
}

// ==================== UI Labels ====================

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  before_after: 'Before/After School',
  drop_in: 'Drop-In',
  summer_camp: 'Summer Camp',
}

export const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
  annually: 'Annually',
}

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  suspended: 'Suspended',
  terminated: 'Terminated',
}

export const ENROLLMENT_STATUS_COLORS: Record<EnrollmentStatus, string> = {
  active: 'green',
  pending: 'yellow',
  suspended: 'orange',
  terminated: 'red',
}

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Percentage',
  fixed_amount: 'Fixed Amount',
}

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  credit: 'Credit',
  debit: 'Debit',
  refund: 'Refund',
  waiver: 'Waiver',
}

export const DAYS_OF_WEEK = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

export const DAY_LABELS: Record<string, string> = {
  sunday: 'Sun',
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
}

// Age group labels for rate templates
export const AGE_GROUP_PRESETS = [
  { name: 'Infants (0-12 months)', start: 0, end: 12 },
  { name: 'Toddlers 1 (12-24 months)', start: 12, end: 24 },
  { name: 'Toddlers 2 (24-36 months)', start: 24, end: 36 },
  { name: 'Preschool 3 (3-4 years)', start: 36, end: 48 },
  { name: 'Preschool 4/VPK (4-5 years)', start: 48, end: 60 },
  { name: 'School Age (5+ years)', start: 60, end: 144 },
] as const

import { createClient } from '@/shared/lib/supabase/client'
import type {
  BillingRateTemplate,
  BillingRateTemplateFormData,
  BillingDiscount,
  BillingDiscountFormData,
  ChildBillingEnrollment,
  ChildBillingEnrollmentFormData,
  AppliedDiscount,
  AppliedDiscountFormData,
  RecurringInvoiceTemplate,
  RecurringInvoiceTemplateFormData,
  BillingAdjustment,
  BillingAdjustmentFormData,
  ChildBillingRate,
} from '@/shared/types/billing-plans'

// ==================== Rate Templates ====================

export async function getRateTemplates(activeOnly = true): Promise<BillingRateTemplate[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  let query = supabase
    .from('billing_rate_templates')
    .select('*')
    .eq('organization_id', staff.organization_id)
    .order('age_range_start_months')
    .order('schedule_type')

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getRateTemplateById(id: string): Promise<BillingRateTemplate | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('billing_rate_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function getApplicableRates(childAgeMonths: number): Promise<BillingRateTemplate[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('billing_rate_templates')
    .select('*')
    .eq('organization_id', staff.organization_id)
    .eq('is_active', true)
    .lte('age_range_start_months', childAgeMonths)
    .gt('age_range_end_months', childAgeMonths)
    .order('schedule_type')

  if (error) throw error
  return data || []
}

export async function createRateTemplate(formData: BillingRateTemplateFormData): Promise<BillingRateTemplate> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('billing_rate_templates')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRateTemplate(id: string, formData: Partial<BillingRateTemplateFormData>): Promise<BillingRateTemplate> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('billing_rate_templates')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRateTemplate(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('billing_rate_templates')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== Discounts ====================

export async function getDiscounts(activeOnly = true): Promise<BillingDiscount[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  let query = supabase
    .from('billing_discounts')
    .select('*')
    .eq('organization_id', staff.organization_id)
    .order('name')

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createDiscount(formData: BillingDiscountFormData): Promise<BillingDiscount> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('billing_discounts')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDiscount(id: string, formData: Partial<BillingDiscountFormData>): Promise<BillingDiscount> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('billing_discounts')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDiscount(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('billing_discounts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== Child Billing Enrollments ====================

export async function getEnrollments(filters: { childId?: string; familyId?: string; status?: string } = {}): Promise<ChildBillingEnrollment[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  let query = supabase
    .from('child_billing_enrollments')
    .select(`
      *,
      child:children(id, first_name, last_name, date_of_birth),
      family:families(id, name, primary_contact_name),
      rate_template:billing_rate_templates(*),
      applied_discounts(
        *,
        discount:billing_discounts(*)
      )
    `)
    .eq('organization_id', staff.organization_id)
    .order('created_at', { ascending: false })

  if (filters.childId) {
    query = query.eq('child_id', filters.childId)
  }
  if (filters.familyId) {
    query = query.eq('family_id', filters.familyId)
  }
  if (filters.status) {
    query = query.eq('enrollment_status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getEnrollmentById(id: string): Promise<ChildBillingEnrollment | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('child_billing_enrollments')
    .select(`
      *,
      child:children(id, first_name, last_name, date_of_birth),
      family:families(id, name, primary_contact_name),
      rate_template:billing_rate_templates(*),
      applied_discounts(
        *,
        discount:billing_discounts(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createEnrollment(formData: ChildBillingEnrollmentFormData): Promise<ChildBillingEnrollment> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('child_billing_enrollments')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEnrollment(id: string, formData: Partial<ChildBillingEnrollmentFormData>): Promise<ChildBillingEnrollment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('child_billing_enrollments')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function terminateEnrollment(id: string, reason: string): Promise<ChildBillingEnrollment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('child_billing_enrollments')
    .update({
      enrollment_status: 'terminated',
      termination_date: new Date().toISOString().split('T')[0],
      termination_reason: reason,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ==================== Applied Discounts ====================

export async function applyDiscount(formData: AppliedDiscountFormData): Promise<AppliedDiscount> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('applied_discounts')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeAppliedDiscount(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('applied_discounts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== Recurring Invoice Templates ====================

export async function getRecurringTemplates(familyId?: string): Promise<RecurringInvoiceTemplate[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  let query = supabase
    .from('recurring_invoice_templates')
    .select(`
      *,
      family:families(id, name, primary_contact_name)
    `)
    .eq('organization_id', staff.organization_id)
    .order('created_at', { ascending: false })

  if (familyId) {
    query = query.eq('family_id', familyId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createRecurringTemplate(formData: RecurringInvoiceTemplateFormData): Promise<RecurringInvoiceTemplate> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  // Calculate next generation date
  const startDate = formData.start_date || new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('recurring_invoice_templates')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
      next_generation_date: startDate,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRecurringTemplate(id: string, formData: Partial<RecurringInvoiceTemplateFormData>): Promise<RecurringInvoiceTemplate> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recurring_invoice_templates')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRecurringTemplate(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('recurring_invoice_templates')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== Billing Adjustments ====================

export async function getAdjustments(familyId?: string): Promise<BillingAdjustment[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  let query = supabase
    .from('billing_adjustments')
    .select(`
      *,
      family:families(id, name),
      creator:staff!billing_adjustments_created_by_fkey(id, first_name, last_name),
      approver:staff!billing_adjustments_approved_by_fkey(id, first_name, last_name)
    `)
    .eq('organization_id', staff.organization_id)
    .order('created_at', { ascending: false })

  if (familyId) {
    query = query.eq('family_id', familyId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createAdjustment(formData: BillingAdjustmentFormData): Promise<BillingAdjustment> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('id, organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('billing_adjustments')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
      created_by: staff.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function approveAdjustment(id: string): Promise<BillingAdjustment> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('billing_adjustments')
    .update({
      approved_by: staff.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ==================== Calculated Rates ====================

export async function calculateChildRate(childId: string): Promise<ChildBillingRate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('calculate_child_billing_rate', { p_child_id: childId })

  if (error) throw error
  return data || []
}

// Export service object
export const billingPlansService = {
  // Rate Templates
  getRateTemplates,
  getRateTemplateById,
  getApplicableRates,
  createRateTemplate,
  updateRateTemplate,
  deleteRateTemplate,
  // Discounts
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  // Enrollments
  getEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  terminateEnrollment,
  // Applied Discounts
  applyDiscount,
  removeAppliedDiscount,
  // Recurring Templates
  getRecurringTemplates,
  createRecurringTemplate,
  updateRecurringTemplate,
  deleteRecurringTemplate,
  // Adjustments
  getAdjustments,
  createAdjustment,
  approveAdjustment,
  // Calculations
  calculateChildRate,
}

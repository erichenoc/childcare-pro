// =====================================================
// Accounting Types
// =====================================================

// Categories
export type AccountType = 'income' | 'expense' | 'asset' | 'liability'
export type IncomeSourceType = 'tuition' | 'registration' | 'late_fee' | 'vpk' | 'sr' | 'food_program' | 'other'
export type ExpenseType = 'payroll' | 'rent' | 'utilities' | 'supplies' | 'food' | 'insurance' | 'maintenance' | 'other'
export type TransactionStatus = 'pending' | 'approved' | 'completed' | 'void' | 'refunded'
export type TaxPeriodType = 'quarterly' | 'annual'
export type TaxStatus = 'draft' | 'calculated' | 'filed' | 'paid'
export type PayrollStatus = 'pending' | 'processed' | 'paid' | 'void'
export type PaymentMethodAccounting = 'cash' | 'check' | 'card' | 'transfer' | 'ach'
export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export interface AccountCategory {
  id: string
  organization_id: string
  name: string
  type: AccountType
  code: string | null
  parent_category_id: string | null
  description: string | null
  is_active: boolean
  display_order: number
  is_tax_deductible: boolean
  tax_category: string | null
  created_at: string
}

export interface IncomeTransaction {
  id: string
  organization_id: string
  date: string
  category_id: string | null
  category_name: string
  source_type: IncomeSourceType
  source_reference_id: string | null
  source_reference_type: string | null
  family_id: string | null
  payer_name: string | null
  amount: number
  tax_amount: number
  total_amount: number
  payment_method: PaymentMethodAccounting | null
  check_number: string | null
  transaction_reference: string | null
  status: TransactionStatus
  void_reason: string | null
  voided_at: string | null
  voided_by: string | null
  is_reconciled: boolean
  reconciled_at: string | null
  reconciled_by: string | null
  bank_statement_date: string | null
  description: string | null
  notes: string | null
  recorded_by: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseTransaction {
  id: string
  organization_id: string
  date: string
  category_id: string | null
  category_name: string
  expense_type: ExpenseType
  vendor_name: string
  vendor_id: string | null
  amount: number
  tax_amount: number
  total_amount: number
  payment_method: PaymentMethodAccounting | null
  check_number: string | null
  transaction_reference: string | null
  receipt_url: string | null
  receipt_number: string | null
  has_receipt: boolean
  is_tax_deductible: boolean
  tax_deduction_category: string | null
  status: TransactionStatus
  approved_by: string | null
  approved_at: string | null
  void_reason: string | null
  voided_at: string | null
  voided_by: string | null
  is_reconciled: boolean
  reconciled_at: string | null
  reconciled_by: string | null
  bank_statement_date: string | null
  is_recurring: boolean
  recurring_frequency: RecurringFrequency | null
  recurring_end_date: string | null
  description: string | null
  notes: string | null
  recorded_by: string | null
  created_at: string
  updated_at: string
}

export interface TaxRecord {
  id: string
  organization_id: string
  year: number
  quarter: number | null
  period_type: TaxPeriodType
  period_start: string
  period_end: string
  total_income: number
  taxable_income: number
  exempt_income: number
  total_expenses: number
  deductible_expenses: number
  net_income: number
  estimated_tax: number
  tax_paid: number
  tax_due: number
  status: TaxStatus
  filed_at: string | null
  paid_at: string | null
  preparer_name: string | null
  preparer_id: string | null
  filing_confirmation: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PayrollRecord {
  id: string
  organization_id: string
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  profile_id: string | null
  employee_name: string
  regular_hours: number
  overtime_hours: number
  total_hours: number
  hourly_rate: number | null
  regular_pay: number
  overtime_pay: number
  gross_pay: number
  federal_tax: number
  state_tax: number
  social_security: number
  medicare: number
  other_deductions: number
  total_deductions: number
  net_pay: number
  payment_method: 'check' | 'direct_deposit' | null
  check_number: string | null
  status: PayrollStatus
  processed_at: string | null
  paid_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface MonthlyPnL {
  total_income: number
  total_expenses: number
  net_profit: number
  profit_margin: number
  income_by_category: CategoryAmount[]
  expenses_by_category: CategoryAmount[]
}

export interface CategoryAmount {
  category: string
  amount: number
}

export interface TaxSummary {
  total_income: number
  taxable_income: number
  exempt_income: number
  total_expenses: number
  deductible_expenses: number
  net_taxable_income: number
  quarterly_summaries: QuarterlySummary[]
}

export interface QuarterlySummary {
  quarter: number
  income: number
  expenses: number
  net: number
}

export interface MonthlyIncomeSummary {
  organization_id: string
  year: number
  month: number
  source_type: IncomeSourceType
  transaction_count: number
  total_amount: number
  avg_transaction: number
}

export interface MonthlyExpenseSummary {
  organization_id: string
  year: number
  month: number
  expense_type: ExpenseType
  transaction_count: number
  total_amount: number
  avg_transaction: number
}

export interface DailyCashFlow {
  organization_id: string
  date: string
  income: number
  expenses: number
  net_flow: number
}

export interface IncomeFormData {
  date: string
  category_id?: string
  category_name: string
  source_type: IncomeSourceType
  family_id?: string
  payer_name?: string
  amount: number
  tax_amount?: number
  payment_method?: PaymentMethodAccounting
  check_number?: string
  transaction_reference?: string
  description?: string
  notes?: string
}

export interface ExpenseFormData {
  date: string
  category_id?: string
  category_name: string
  expense_type: ExpenseType
  vendor_name: string
  amount: number
  tax_amount?: number
  payment_method?: PaymentMethodAccounting
  check_number?: string
  transaction_reference?: string
  receipt_url?: string
  receipt_number?: string
  is_tax_deductible?: boolean
  tax_deduction_category?: string
  is_recurring?: boolean
  recurring_frequency?: RecurringFrequency
  recurring_end_date?: string
  description?: string
  notes?: string
}

export interface PayrollFormData {
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  profile_id?: string
  employee_name: string
  regular_hours: number
  overtime_hours?: number
  hourly_rate?: number
  regular_pay: number
  overtime_pay?: number
  federal_tax?: number
  state_tax?: number
  social_security?: number
  medicare?: number
  other_deductions?: number
  payment_method?: 'check' | 'direct_deposit'
  check_number?: string
  notes?: string
}

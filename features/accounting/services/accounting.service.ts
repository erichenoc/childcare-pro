// Accounting Service - ChildCare Pro
// Manages account categories, income/expense transactions, and financial reports
// Matches database schema from migration 011_accounting.sql

import { createClient } from '@/shared/lib/supabase/client'

// ============================================
// TYPES (matching migration schema)
// ============================================

export type AccountCategoryType = 'income' | 'expense' | 'asset' | 'liability'
export type TransactionStatus = 'pending' | 'completed' | 'void' | 'refunded' | 'approved'
export type IncomeSourceType = 'tuition' | 'registration' | 'late_fee' | 'vpk' | 'sr' | 'food_program' | 'other'
export type ExpenseType = 'payroll' | 'rent' | 'utilities' | 'supplies' | 'food' | 'insurance' | 'maintenance' | 'other'
export type PaymentMethod = 'cash' | 'check' | 'card' | 'transfer' | 'ach'
export type TaxPeriodType = 'quarterly' | 'annual'
export type PayrollStatus = 'pending' | 'processed' | 'paid' | 'void'

export interface AccountCategory {
  id: string
  organization_id: string
  name: string
  type: AccountCategoryType
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
  payment_method: PaymentMethod | null
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
  // Joined data
  family?: { name: string }
  category?: AccountCategory
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
  payment_method: PaymentMethod | null
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
  recurring_frequency: string | null
  recurring_end_date: string | null
  description: string | null
  notes: string | null
  recorded_by: string | null
  created_at: string
  updated_at: string
  // Joined data
  category?: AccountCategory
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
  status: 'draft' | 'calculated' | 'filed' | 'paid'
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
  income_by_category: { category: string; amount: number }[]
  expenses_by_category: { category: string; amount: number }[]
}

export interface TaxSummary {
  total_income: number
  taxable_income: number
  exempt_income: number
  total_expenses: number
  deductible_expenses: number
  net_taxable_income: number
  quarterly_summaries: { quarter: number; income: number; expenses: number; net: number }[]
}

// ============================================
// DEFAULT ACCOUNT CATEGORIES
// ============================================

export const DEFAULT_ACCOUNT_CATEGORIES: Omit<AccountCategory, 'id' | 'organization_id' | 'created_at'>[] = [
  // Income Categories
  { name: 'Tuition Revenue', type: 'income', code: '4000', parent_category_id: null, description: 'Weekly/monthly tuition fees', is_active: true, display_order: 1, is_tax_deductible: false, tax_category: 'income' },
  { name: 'Registration Fees', type: 'income', code: '4010', parent_category_id: null, description: 'One-time registration fees', is_active: true, display_order: 2, is_tax_deductible: false, tax_category: 'income' },
  { name: 'Late Pickup Fees', type: 'income', code: '4020', parent_category_id: null, description: 'Fees for late pickup', is_active: true, display_order: 3, is_tax_deductible: false, tax_category: 'income' },
  { name: 'Activity Fees', type: 'income', code: '4030', parent_category_id: null, description: 'Field trips, special activities', is_active: true, display_order: 4, is_tax_deductible: false, tax_category: 'income' },
  { name: 'VPK Reimbursement', type: 'income', code: '4100', parent_category_id: null, description: 'VPK reimbursement from state', is_active: true, display_order: 5, is_tax_deductible: false, tax_category: 'exempt' },
  { name: 'School Readiness', type: 'income', code: '4110', parent_category_id: null, description: 'School Readiness payments from ELC', is_active: true, display_order: 6, is_tax_deductible: false, tax_category: 'exempt' },
  { name: 'Food Program', type: 'income', code: '4200', parent_category_id: null, description: 'CACFP reimbursements', is_active: true, display_order: 7, is_tax_deductible: false, tax_category: 'exempt' },
  { name: 'Other Income', type: 'income', code: '4900', parent_category_id: null, description: 'Miscellaneous income', is_active: true, display_order: 8, is_tax_deductible: false, tax_category: 'income' },

  // Expense Categories
  { name: 'Salaries & Wages', type: 'expense', code: '5000', parent_category_id: null, description: 'Employee salaries and wages', is_active: true, display_order: 10, is_tax_deductible: true, tax_category: 'payroll' },
  { name: 'Payroll Taxes', type: 'expense', code: '5010', parent_category_id: null, description: 'Employer payroll taxes', is_active: true, display_order: 11, is_tax_deductible: true, tax_category: 'payroll' },
  { name: 'Employee Benefits', type: 'expense', code: '5020', parent_category_id: null, description: 'Health insurance, retirement', is_active: true, display_order: 12, is_tax_deductible: true, tax_category: 'benefits' },
  { name: 'Rent', type: 'expense', code: '5100', parent_category_id: null, description: 'Facility rent', is_active: true, display_order: 13, is_tax_deductible: true, tax_category: 'occupancy' },
  { name: 'Utilities', type: 'expense', code: '5110', parent_category_id: null, description: 'Electric, water, gas', is_active: true, display_order: 14, is_tax_deductible: true, tax_category: 'occupancy' },
  { name: 'Insurance', type: 'expense', code: '5120', parent_category_id: null, description: 'Liability, property insurance', is_active: true, display_order: 15, is_tax_deductible: true, tax_category: 'insurance' },
  { name: 'Classroom Supplies', type: 'expense', code: '5200', parent_category_id: null, description: 'Educational materials, toys', is_active: true, display_order: 16, is_tax_deductible: true, tax_category: 'supplies' },
  { name: 'Office Supplies', type: 'expense', code: '5210', parent_category_id: null, description: 'Paper, ink, office materials', is_active: true, display_order: 17, is_tax_deductible: true, tax_category: 'supplies' },
  { name: 'Cleaning Supplies', type: 'expense', code: '5220', parent_category_id: null, description: 'Sanitizers, cleaning materials', is_active: true, display_order: 18, is_tax_deductible: true, tax_category: 'supplies' },
  { name: 'Food & Snacks', type: 'expense', code: '5300', parent_category_id: null, description: 'Meals and snacks for children', is_active: true, display_order: 19, is_tax_deductible: true, tax_category: 'food' },
  { name: 'Training & Development', type: 'expense', code: '5400', parent_category_id: null, description: 'DCF training, conferences', is_active: true, display_order: 20, is_tax_deductible: true, tax_category: 'education' },
  { name: 'Marketing & Advertising', type: 'expense', code: '5500', parent_category_id: null, description: 'Ads, website, promotional', is_active: true, display_order: 21, is_tax_deductible: true, tax_category: 'marketing' },
  { name: 'Professional Services', type: 'expense', code: '5600', parent_category_id: null, description: 'Accounting, legal fees', is_active: true, display_order: 22, is_tax_deductible: true, tax_category: 'professional' },
  { name: 'Software & Subscriptions', type: 'expense', code: '5700', parent_category_id: null, description: 'ChildCare Pro, other software', is_active: true, display_order: 23, is_tax_deductible: true, tax_category: 'technology' },
  { name: 'Repairs & Maintenance', type: 'expense', code: '5800', parent_category_id: null, description: 'Building and equipment repairs', is_active: true, display_order: 24, is_tax_deductible: true, tax_category: 'maintenance' },
  { name: 'Miscellaneous Expense', type: 'expense', code: '5900', parent_category_id: null, description: 'Other expenses', is_active: true, display_order: 25, is_tax_deductible: true, tax_category: 'other' },

  // Asset Categories
  { name: 'Cash', type: 'asset', code: '1000', parent_category_id: null, description: 'Cash on hand', is_active: true, display_order: 30, is_tax_deductible: false, tax_category: null },
  { name: 'Checking Account', type: 'asset', code: '1010', parent_category_id: null, description: 'Main checking account', is_active: true, display_order: 31, is_tax_deductible: false, tax_category: null },
  { name: 'Savings Account', type: 'asset', code: '1020', parent_category_id: null, description: 'Savings account', is_active: true, display_order: 32, is_tax_deductible: false, tax_category: null },
  { name: 'Accounts Receivable', type: 'asset', code: '1100', parent_category_id: null, description: 'Money owed by families', is_active: true, display_order: 33, is_tax_deductible: false, tax_category: null },
  { name: 'Equipment', type: 'asset', code: '1500', parent_category_id: null, description: 'Office and classroom equipment', is_active: true, display_order: 34, is_tax_deductible: false, tax_category: null },

  // Liability Categories
  { name: 'Accounts Payable', type: 'liability', code: '2000', parent_category_id: null, description: 'Money owed to vendors', is_active: true, display_order: 40, is_tax_deductible: false, tax_category: null },
  { name: 'Deferred Revenue', type: 'liability', code: '2100', parent_category_id: null, description: 'Tuition paid in advance', is_active: true, display_order: 41, is_tax_deductible: false, tax_category: null },
  { name: 'Payroll Liabilities', type: 'liability', code: '2200', parent_category_id: null, description: 'Wages, taxes payable', is_active: true, display_order: 42, is_tax_deductible: false, tax_category: null },
]

// ============================================
// SERVICE CLASS
// ============================================

class AccountingService {
  // ============================================
  // ACCOUNT CATEGORIES
  // ============================================

  async getAccountCategories(organizationId: string): Promise<AccountCategory[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('account_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('display_order')

    if (error) throw error
    return data || []
  }

  async getAccountCategory(id: string): Promise<AccountCategory | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('account_categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createAccountCategory(category: Partial<AccountCategory>): Promise<AccountCategory> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('account_categories')
      .insert(category)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateAccountCategory(id: string, updates: Partial<AccountCategory>): Promise<AccountCategory> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('account_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async initializeDefaultCategories(organizationId: string): Promise<void> {
    const supabase = createClient()

    // Check if categories already exist
    const { data: existing } = await supabase
      .from('account_categories')
      .select('id')
      .eq('organization_id', organizationId)
      .limit(1)

    if (existing && existing.length > 0) {
      return // Already initialized
    }

    // Insert default categories
    const categoriesToInsert = DEFAULT_ACCOUNT_CATEGORIES.map(cat => ({
      ...cat,
      organization_id: organizationId,
    }))

    const { error } = await supabase
      .from('account_categories')
      .insert(categoriesToInsert)

    if (error) throw error
  }

  // ============================================
  // INCOME TRANSACTIONS
  // ============================================

  async getIncomeTransactions(
    organizationId: string,
    filters?: {
      startDate?: string
      endDate?: string
      sourceType?: IncomeSourceType
      status?: TransactionStatus
      familyId?: string
    }
  ): Promise<IncomeTransaction[]> {
    const supabase = createClient()
    let query = supabase
      .from('income_transactions')
      .select('*, family:families(name), category:account_categories(*)')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate)
    }
    if (filters?.sourceType) {
      query = query.eq('source_type', filters.sourceType)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.familyId) {
      query = query.eq('family_id', filters.familyId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async createIncomeTransaction(transaction: Partial<IncomeTransaction>): Promise<IncomeTransaction> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('income_transactions')
      .insert(transaction)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateIncomeTransaction(id: string, updates: Partial<IncomeTransaction>): Promise<IncomeTransaction> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('income_transactions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async voidIncomeTransaction(id: string, reason: string, voidedBy: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('income_transactions')
      .update({
        status: 'void',
        void_reason: reason,
        voided_at: new Date().toISOString(),
        voided_by: voidedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
  }

  // ============================================
  // EXPENSE TRANSACTIONS
  // ============================================

  async getExpenseTransactions(
    organizationId: string,
    filters?: {
      startDate?: string
      endDate?: string
      expenseType?: ExpenseType
      status?: TransactionStatus
      vendorName?: string
    }
  ): Promise<ExpenseTransaction[]> {
    const supabase = createClient()
    let query = supabase
      .from('expense_transactions')
      .select('*, category:account_categories(*)')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate)
    }
    if (filters?.expenseType) {
      query = query.eq('expense_type', filters.expenseType)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.vendorName) {
      query = query.ilike('vendor_name', `%${filters.vendorName}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async createExpenseTransaction(transaction: Partial<ExpenseTransaction>): Promise<ExpenseTransaction> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('expense_transactions')
      .insert(transaction)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateExpenseTransaction(id: string, updates: Partial<ExpenseTransaction>): Promise<ExpenseTransaction> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('expense_transactions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async voidExpenseTransaction(id: string, reason: string, voidedBy: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('expense_transactions')
      .update({
        status: 'void',
        void_reason: reason,
        voided_at: new Date().toISOString(),
        voided_by: voidedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
  }

  // ============================================
  // PAYROLL RECORDS
  // ============================================

  async getPayrollRecords(
    organizationId: string,
    filters?: {
      startDate?: string
      endDate?: string
      profileId?: string
      status?: PayrollStatus
    }
  ): Promise<PayrollRecord[]> {
    const supabase = createClient()
    let query = supabase
      .from('payroll_records')
      .select('*')
      .eq('organization_id', organizationId)
      .order('pay_date', { ascending: false })

    if (filters?.startDate) {
      query = query.gte('pay_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('pay_date', filters.endDate)
    }
    if (filters?.profileId) {
      query = query.eq('profile_id', filters.profileId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async createPayrollRecord(record: Partial<PayrollRecord>): Promise<PayrollRecord> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('payroll_records')
      .insert(record)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // ============================================
  // TAX RECORDS
  // ============================================

  async getTaxRecords(
    organizationId: string,
    year?: number
  ): Promise<TaxRecord[]> {
    const supabase = createClient()
    let query = supabase
      .from('tax_records')
      .select('*')
      .eq('organization_id', organizationId)
      .order('year', { ascending: false })
      .order('quarter', { ascending: true })

    if (year) {
      query = query.eq('year', year)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async createTaxRecord(record: Partial<TaxRecord>): Promise<TaxRecord> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tax_records')
      .insert(record)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // ============================================
  // FINANCIAL REPORTS (using DB functions)
  // ============================================

  async getMonthlyPnL(organizationId: string, year: number, month: number): Promise<MonthlyPnL> {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('calculate_monthly_pnl', {
      p_organization_id: organizationId,
      p_year: year,
      p_month: month,
    })

    if (error) throw error

    const result = data?.[0]
    return {
      total_income: result?.total_income || 0,
      total_expenses: result?.total_expenses || 0,
      net_profit: result?.net_profit || 0,
      profit_margin: result?.profit_margin || 0,
      income_by_category: result?.income_by_category || [],
      expenses_by_category: result?.expenses_by_category || [],
    }
  }

  async getTaxSummary(organizationId: string, year: number): Promise<TaxSummary> {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('generate_tax_summary', {
      p_organization_id: organizationId,
      p_year: year,
    })

    if (error) throw error

    const result = data?.[0]
    return {
      total_income: result?.total_income || 0,
      taxable_income: result?.taxable_income || 0,
      exempt_income: result?.exempt_income || 0,
      total_expenses: result?.total_expenses || 0,
      deductible_expenses: result?.deductible_expenses || 0,
      net_taxable_income: result?.net_taxable_income || 0,
      quarterly_summaries: result?.quarterly_summaries || [],
    }
  }

  // ============================================
  // DASHBOARD STATS
  // ============================================

  async getDashboardStats(organizationId: string): Promise<{
    monthlyIncome: number
    monthlyExpenses: number
    netProfit: number
    pendingReceivables: number
    recentTransactions: (IncomeTransaction | ExpenseTransaction)[]
  }> {
    const supabase = createClient()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Get monthly income
    const { data: incomeData } = await supabase
      .from('income_transactions')
      .select('total_amount')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    const monthlyIncome = incomeData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0

    // Get monthly expenses
    const { data: expenseData } = await supabase
      .from('expense_transactions')
      .select('total_amount')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    const monthlyExpenses = expenseData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0

    // Get pending receivables (pending income)
    const { data: pendingData } = await supabase
      .from('income_transactions')
      .select('total_amount')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')

    const pendingReceivables = pendingData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0

    // Get recent transactions (last 10)
    const { data: recentIncome } = await supabase
      .from('income_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })
      .limit(5)

    const { data: recentExpenses } = await supabase
      .from('expense_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })
      .limit(5)

    const recentTransactions = [...(recentIncome || []), ...(recentExpenses || [])]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    return {
      monthlyIncome,
      monthlyExpenses,
      netProfit: monthlyIncome - monthlyExpenses,
      pendingReceivables,
      recentTransactions,
    }
  }

  // ============================================
  // MOCK DATA FOR DEVELOPMENT
  // ============================================

  getMockAccountCategories(): AccountCategory[] {
    return DEFAULT_ACCOUNT_CATEGORIES.map((cat, index) => ({
      ...cat,
      id: `cat-${index + 1}`,
      organization_id: 'org-1',
      created_at: new Date().toISOString(),
    }))
  }

  getMockIncomeTransactions(): IncomeTransaction[] {
    const today = new Date()
    return [
      {
        id: 'inc-1',
        organization_id: 'org-1',
        date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0],
        category_id: 'cat-1',
        category_name: 'Tuition Revenue',
        source_type: 'tuition',
        source_reference_id: 'inv-001',
        source_reference_type: 'invoice',
        family_id: 'fam-1',
        payer_name: 'Smith Family',
        amount: 1200,
        tax_amount: 0,
        total_amount: 1200,
        payment_method: 'card',
        check_number: null,
        transaction_reference: 'ch_123456',
        status: 'completed',
        void_reason: null,
        voided_at: null,
        voided_by: null,
        is_reconciled: false,
        reconciled_at: null,
        reconciled_by: null,
        bank_statement_date: null,
        description: 'Weekly tuition payment',
        notes: null,
        recorded_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'inc-2',
        organization_id: 'org-1',
        date: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0],
        category_id: 'cat-5',
        category_name: 'VPK Reimbursement',
        source_type: 'vpk',
        source_reference_id: null,
        source_reference_type: null,
        family_id: null,
        payer_name: 'Florida ELC',
        amount: 2150,
        tax_amount: 0,
        total_amount: 2150,
        payment_method: 'ach',
        check_number: null,
        transaction_reference: 'VPK-2024-01',
        status: 'completed',
        void_reason: null,
        voided_at: null,
        voided_by: null,
        is_reconciled: true,
        reconciled_at: new Date().toISOString(),
        reconciled_by: 'user-1',
        bank_statement_date: new Date(today.getFullYear(), today.getMonth(), 12).toISOString().split('T')[0],
        description: 'VPK reimbursement for January',
        notes: null,
        recorded_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'inc-3',
        organization_id: 'org-1',
        date: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split('T')[0],
        category_id: 'cat-1',
        category_name: 'Tuition Revenue',
        source_type: 'tuition',
        source_reference_id: 'inv-002',
        source_reference_type: 'invoice',
        family_id: 'fam-2',
        payer_name: 'Johnson Family',
        amount: 950,
        tax_amount: 0,
        total_amount: 950,
        payment_method: 'check',
        check_number: '1234',
        transaction_reference: null,
        status: 'completed',
        void_reason: null,
        voided_at: null,
        voided_by: null,
        is_reconciled: false,
        reconciled_at: null,
        reconciled_by: null,
        bank_statement_date: null,
        description: 'Weekly tuition payment',
        notes: null,
        recorded_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  }

  getMockExpenseTransactions(): ExpenseTransaction[] {
    const today = new Date()
    return [
      {
        id: 'exp-1',
        organization_id: 'org-1',
        date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
        category_id: 'cat-13',
        category_name: 'Rent',
        expense_type: 'rent',
        vendor_name: 'ABC Property Management',
        vendor_id: 'vendor-1',
        amount: 3500,
        tax_amount: 0,
        total_amount: 3500,
        payment_method: 'check',
        check_number: '5001',
        transaction_reference: null,
        receipt_url: null,
        receipt_number: null,
        has_receipt: true,
        is_tax_deductible: true,
        tax_deduction_category: 'occupancy',
        status: 'completed',
        approved_by: 'user-1',
        approved_at: new Date().toISOString(),
        void_reason: null,
        voided_at: null,
        voided_by: null,
        is_reconciled: true,
        reconciled_at: new Date().toISOString(),
        reconciled_by: 'user-1',
        bank_statement_date: new Date(today.getFullYear(), today.getMonth(), 3).toISOString().split('T')[0],
        is_recurring: true,
        recurring_frequency: 'monthly',
        recurring_end_date: null,
        description: 'Monthly rent payment',
        notes: null,
        recorded_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'exp-2',
        organization_id: 'org-1',
        date: new Date(today.getFullYear(), today.getMonth(), 8).toISOString().split('T')[0],
        category_id: 'cat-16',
        category_name: 'Classroom Supplies',
        expense_type: 'supplies',
        vendor_name: 'Amazon',
        vendor_id: null,
        amount: 245.50,
        tax_amount: 17.18,
        total_amount: 262.68,
        payment_method: 'card',
        check_number: null,
        transaction_reference: 'amz-order-123',
        receipt_url: null,
        receipt_number: '111-1234567-1234567',
        has_receipt: true,
        is_tax_deductible: true,
        tax_deduction_category: 'supplies',
        status: 'completed',
        approved_by: 'user-1',
        approved_at: new Date().toISOString(),
        void_reason: null,
        voided_at: null,
        voided_by: null,
        is_reconciled: false,
        reconciled_at: null,
        reconciled_by: null,
        bank_statement_date: null,
        is_recurring: false,
        recurring_frequency: null,
        recurring_end_date: null,
        description: 'Art supplies and educational materials',
        notes: 'Crayons, paper, paint, books',
        recorded_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'exp-3',
        organization_id: 'org-1',
        date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0],
        category_id: 'cat-14',
        category_name: 'Utilities',
        expense_type: 'utilities',
        vendor_name: 'FPL',
        vendor_id: 'vendor-2',
        amount: 385.00,
        tax_amount: 0,
        total_amount: 385.00,
        payment_method: 'ach',
        check_number: null,
        transaction_reference: 'fpl-autopay-123',
        receipt_url: null,
        receipt_number: null,
        has_receipt: false,
        is_tax_deductible: true,
        tax_deduction_category: 'occupancy',
        status: 'completed',
        approved_by: null,
        approved_at: null,
        void_reason: null,
        voided_at: null,
        voided_by: null,
        is_reconciled: false,
        reconciled_at: null,
        reconciled_by: null,
        bank_statement_date: null,
        is_recurring: true,
        recurring_frequency: 'monthly',
        recurring_end_date: null,
        description: 'Electric bill',
        notes: null,
        recorded_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  }

  getMockDashboardStats(): {
    monthlyIncome: number
    monthlyExpenses: number
    netProfit: number
    pendingReceivables: number
  } {
    return {
      monthlyIncome: 35350,
      monthlyExpenses: 25880,
      netProfit: 9470,
      pendingReceivables: 2400,
    }
  }

  getMockMonthlyPnL(): MonthlyPnL {
    return {
      total_income: 35350,
      total_expenses: 25880,
      net_profit: 9470,
      profit_margin: 26.8,
      income_by_category: [
        { category: 'Tuition Revenue', amount: 28500 },
        { category: 'Registration Fees', amount: 450 },
        { category: 'VPK Reimbursement', amount: 4300 },
        { category: 'School Readiness', amount: 2100 },
      ],
      expenses_by_category: [
        { category: 'Salaries & Wages', amount: 18500 },
        { category: 'Payroll Taxes', amount: 1850 },
        { category: 'Rent', amount: 3500 },
        { category: 'Utilities', amount: 450 },
        { category: 'Classroom Supplies', amount: 380 },
        { category: 'Food & Snacks', amount: 1200 },
      ],
    }
  }
}

export const accountingService = new AccountingService()

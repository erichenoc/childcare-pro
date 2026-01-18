-- =====================================================
-- MIGRATION 011: Accounting Module
-- =====================================================
-- Independent accounting system with Excel/CSV export support

-- =====================================================
-- Chart of Accounts
-- =====================================================

-- Account categories
CREATE TABLE IF NOT EXISTS account_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'income', 'expense', 'asset', 'liability'
  code TEXT, -- Account code (1000, 2000, etc.)

  parent_category_id UUID REFERENCES account_categories(id),

  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Tax related
  is_tax_deductible BOOLEAN DEFAULT false,
  tax_category TEXT, -- For tax reporting

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_categories_org ON account_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_account_categories_type ON account_categories(type);

-- =====================================================
-- Income Transactions
-- =====================================================

-- Income records
CREATE TABLE IF NOT EXISTS income_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Category
  category_id UUID REFERENCES account_categories(id),
  category_name TEXT NOT NULL, -- Denormalized for reports

  -- Source
  source_type TEXT NOT NULL, -- 'tuition', 'registration', 'late_fee', 'vpk', 'sr', 'food_program', 'other'
  source_reference_id UUID, -- Link to invoice, enrollment, etc.
  source_reference_type TEXT, -- 'invoice', 'vpk_enrollment', 'sr_enrollment', etc.

  -- Family/Payer info
  family_id UUID REFERENCES families(id),
  payer_name TEXT,

  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,

  -- Payment details
  payment_method TEXT, -- 'cash', 'check', 'card', 'transfer', 'ach'
  check_number TEXT,
  transaction_reference TEXT,

  -- Status
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'void', 'refunded'
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES profiles(id),

  -- Reconciliation
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES profiles(id),
  bank_statement_date DATE,

  description TEXT,
  notes TEXT,

  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_transactions_org_date ON income_transactions(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_income_transactions_category ON income_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_income_transactions_family ON income_transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_income_transactions_source ON income_transactions(source_type);
CREATE INDEX IF NOT EXISTS idx_income_transactions_status ON income_transactions(status);

-- =====================================================
-- Expense Transactions
-- =====================================================

-- Expense records
CREATE TABLE IF NOT EXISTS expense_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Category
  category_id UUID REFERENCES account_categories(id),
  category_name TEXT NOT NULL, -- Denormalized for reports

  -- Expense type
  expense_type TEXT NOT NULL, -- 'payroll', 'rent', 'utilities', 'supplies', 'food', 'insurance', 'maintenance', 'other'

  -- Vendor info
  vendor_name TEXT NOT NULL,
  vendor_id TEXT, -- For recurring vendor tracking

  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,

  -- Payment details
  payment_method TEXT, -- 'cash', 'check', 'card', 'transfer', 'ach'
  check_number TEXT,
  transaction_reference TEXT,

  -- Receipt/Documentation
  receipt_url TEXT,
  receipt_number TEXT,
  has_receipt BOOLEAN DEFAULT false,

  -- Tax deductibility
  is_tax_deductible BOOLEAN DEFAULT false,
  tax_deduction_category TEXT,

  -- Status
  status TEXT DEFAULT 'completed', -- 'pending', 'approved', 'completed', 'void'
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES profiles(id),

  -- Reconciliation
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES profiles(id),
  bank_statement_date DATE,

  -- Recurring
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT, -- 'weekly', 'biweekly', 'monthly', 'yearly'
  recurring_end_date DATE,

  description TEXT,
  notes TEXT,

  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_transactions_org_date ON expense_transactions(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_category ON expense_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_type ON expense_transactions(expense_type);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_vendor ON expense_transactions(vendor_name);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_status ON expense_transactions(status);

-- =====================================================
-- Tax Records
-- =====================================================

-- Quarterly/Annual tax records
CREATE TABLE IF NOT EXISTS tax_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Period
  year INTEGER NOT NULL,
  quarter INTEGER, -- 1-4, NULL for annual
  period_type TEXT NOT NULL, -- 'quarterly', 'annual'

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Income summary
  total_income DECIMAL(12,2) DEFAULT 0,
  taxable_income DECIMAL(12,2) DEFAULT 0,
  exempt_income DECIMAL(12,2) DEFAULT 0, -- VPK, SR reimbursements

  -- Expense summary
  total_expenses DECIMAL(12,2) DEFAULT 0,
  deductible_expenses DECIMAL(12,2) DEFAULT 0,

  -- Tax calculations
  net_income DECIMAL(12,2) GENERATED ALWAYS AS (total_income - total_expenses) STORED,
  estimated_tax DECIMAL(12,2) DEFAULT 0,
  tax_paid DECIMAL(12,2) DEFAULT 0,
  tax_due DECIMAL(12,2) GENERATED ALWAYS AS (GREATEST(0, estimated_tax - tax_paid)) STORED,

  -- Filing status
  status TEXT DEFAULT 'draft', -- 'draft', 'calculated', 'filed', 'paid'
  filed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- References
  preparer_name TEXT,
  preparer_id TEXT,
  filing_confirmation TEXT,

  notes TEXT,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, year, quarter, period_type)
);

CREATE INDEX IF NOT EXISTS idx_tax_records_org_year ON tax_records(organization_id, year);

-- =====================================================
-- Payroll Records (Simplified)
-- =====================================================

-- Payroll records
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Period
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE NOT NULL,

  -- Employee
  profile_id UUID REFERENCES profiles(id),
  employee_name TEXT NOT NULL,

  -- Hours
  regular_hours DECIMAL(6,2) DEFAULT 0,
  overtime_hours DECIMAL(6,2) DEFAULT 0,
  total_hours DECIMAL(6,2) GENERATED ALWAYS AS (regular_hours + overtime_hours) STORED,

  -- Pay
  hourly_rate DECIMAL(8,2),
  regular_pay DECIMAL(10,2) DEFAULT 0,
  overtime_pay DECIMAL(10,2) DEFAULT 0,
  gross_pay DECIMAL(10,2) GENERATED ALWAYS AS (regular_pay + overtime_pay) STORED,

  -- Deductions
  federal_tax DECIMAL(10,2) DEFAULT 0,
  state_tax DECIMAL(10,2) DEFAULT 0,
  social_security DECIMAL(10,2) DEFAULT 0,
  medicare DECIMAL(10,2) DEFAULT 0,
  other_deductions DECIMAL(10,2) DEFAULT 0,
  total_deductions DECIMAL(10,2) GENERATED ALWAYS AS (
    federal_tax + state_tax + social_security + medicare + other_deductions
  ) STORED,

  -- Net pay
  net_pay DECIMAL(10,2) GENERATED ALWAYS AS (
    (regular_pay + overtime_pay) - (federal_tax + state_tax + social_security + medicare + other_deductions)
  ) STORED,

  -- Payment
  payment_method TEXT, -- 'check', 'direct_deposit'
  check_number TEXT,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'paid', 'void'
  processed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  notes TEXT,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_records_org_date ON payroll_records(organization_id, pay_date);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee ON payroll_records(profile_id);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE account_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- Account Categories policies
CREATE POLICY "Users can view account categories in their organization"
  ON account_categories FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Directors can manage account categories"
  ON account_categories FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Income Transactions policies
CREATE POLICY "Directors can view income transactions"
  ON income_transactions FOR SELECT
  USING (
    (organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director'))
    OR is_system_admin()
  );

CREATE POLICY "Directors can manage income transactions"
  ON income_transactions FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Expense Transactions policies
CREATE POLICY "Directors can view expense transactions"
  ON expense_transactions FOR SELECT
  USING (
    (organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director'))
    OR is_system_admin()
  );

CREATE POLICY "Directors can manage expense transactions"
  ON expense_transactions FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Tax Records policies
CREATE POLICY "Owners can view tax records"
  ON tax_records FOR SELECT
  USING (
    (organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'owner')
    OR is_system_admin()
  );

CREATE POLICY "Owners can manage tax records"
  ON tax_records FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'owner'
  );

-- Payroll Records policies
CREATE POLICY "Directors can view payroll records"
  ON payroll_records FOR SELECT
  USING (
    (organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director'))
    OR is_system_admin()
  );

CREATE POLICY "Owners can manage payroll records"
  ON payroll_records FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'owner'
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate monthly P&L
CREATE OR REPLACE FUNCTION calculate_monthly_pnl(
  p_organization_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  total_income DECIMAL,
  total_expenses DECIMAL,
  net_profit DECIMAL,
  profit_margin DECIMAL,
  income_by_category JSONB,
  expenses_by_category JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((
      SELECT SUM(it.total_amount)
      FROM income_transactions it
      WHERE it.organization_id = p_organization_id
        AND EXTRACT(YEAR FROM it.date) = p_year
        AND EXTRACT(MONTH FROM it.date) = p_month
        AND it.status = 'completed'
    ), 0) as total_income,
    COALESCE((
      SELECT SUM(et.total_amount)
      FROM expense_transactions et
      WHERE et.organization_id = p_organization_id
        AND EXTRACT(YEAR FROM et.date) = p_year
        AND EXTRACT(MONTH FROM et.date) = p_month
        AND et.status = 'completed'
    ), 0) as total_expenses,
    COALESCE((
      SELECT SUM(it.total_amount)
      FROM income_transactions it
      WHERE it.organization_id = p_organization_id
        AND EXTRACT(YEAR FROM it.date) = p_year
        AND EXTRACT(MONTH FROM it.date) = p_month
        AND it.status = 'completed'
    ), 0) -
    COALESCE((
      SELECT SUM(et.total_amount)
      FROM expense_transactions et
      WHERE et.organization_id = p_organization_id
        AND EXTRACT(YEAR FROM et.date) = p_year
        AND EXTRACT(MONTH FROM et.date) = p_month
        AND et.status = 'completed'
    ), 0) as net_profit,
    CASE
      WHEN COALESCE((
        SELECT SUM(it.total_amount)
        FROM income_transactions it
        WHERE it.organization_id = p_organization_id
          AND EXTRACT(YEAR FROM it.date) = p_year
          AND EXTRACT(MONTH FROM it.date) = p_month
          AND it.status = 'completed'
      ), 0) > 0 THEN
        ((COALESCE((
          SELECT SUM(it.total_amount)
          FROM income_transactions it
          WHERE it.organization_id = p_organization_id
            AND EXTRACT(YEAR FROM it.date) = p_year
            AND EXTRACT(MONTH FROM it.date) = p_month
            AND it.status = 'completed'
        ), 0) -
        COALESCE((
          SELECT SUM(et.total_amount)
          FROM expense_transactions et
          WHERE et.organization_id = p_organization_id
            AND EXTRACT(YEAR FROM et.date) = p_year
            AND EXTRACT(MONTH FROM et.date) = p_month
            AND et.status = 'completed'
        ), 0)) /
        COALESCE((
          SELECT SUM(it.total_amount)
          FROM income_transactions it
          WHERE it.organization_id = p_organization_id
            AND EXTRACT(YEAR FROM it.date) = p_year
            AND EXTRACT(MONTH FROM it.date) = p_month
            AND it.status = 'completed'
        ), 0)) * 100
      ELSE 0
    END as profit_margin,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'category', category_name,
        'amount', category_total
      ))
      FROM (
        SELECT category_name, SUM(total_amount) as category_total
        FROM income_transactions
        WHERE organization_id = p_organization_id
          AND EXTRACT(YEAR FROM date) = p_year
          AND EXTRACT(MONTH FROM date) = p_month
          AND status = 'completed'
        GROUP BY category_name
      ) income_cats
    ), '[]'::jsonb) as income_by_category,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'category', category_name,
        'amount', category_total
      ))
      FROM (
        SELECT category_name, SUM(total_amount) as category_total
        FROM expense_transactions
        WHERE organization_id = p_organization_id
          AND EXTRACT(YEAR FROM date) = p_year
          AND EXTRACT(MONTH FROM date) = p_month
          AND status = 'completed'
        GROUP BY category_name
      ) expense_cats
    ), '[]'::jsonb) as expenses_by_category;
END;
$$ LANGUAGE plpgsql;

-- Function to generate tax summary
CREATE OR REPLACE FUNCTION generate_tax_summary(
  p_organization_id UUID,
  p_year INTEGER
)
RETURNS TABLE (
  total_income DECIMAL,
  taxable_income DECIMAL,
  exempt_income DECIMAL,
  total_expenses DECIMAL,
  deductible_expenses DECIMAL,
  net_taxable_income DECIMAL,
  quarterly_summaries JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((
      SELECT SUM(total_amount)
      FROM income_transactions
      WHERE organization_id = p_organization_id
        AND EXTRACT(YEAR FROM date) = p_year
        AND status = 'completed'
    ), 0) as total_income,
    COALESCE((
      SELECT SUM(total_amount)
      FROM income_transactions
      WHERE organization_id = p_organization_id
        AND EXTRACT(YEAR FROM date) = p_year
        AND status = 'completed'
        AND source_type NOT IN ('vpk', 'sr', 'food_program')
    ), 0) as taxable_income,
    COALESCE((
      SELECT SUM(total_amount)
      FROM income_transactions
      WHERE organization_id = p_organization_id
        AND EXTRACT(YEAR FROM date) = p_year
        AND status = 'completed'
        AND source_type IN ('vpk', 'sr', 'food_program')
    ), 0) as exempt_income,
    COALESCE((
      SELECT SUM(total_amount)
      FROM expense_transactions
      WHERE organization_id = p_organization_id
        AND EXTRACT(YEAR FROM date) = p_year
        AND status = 'completed'
    ), 0) as total_expenses,
    COALESCE((
      SELECT SUM(total_amount)
      FROM expense_transactions
      WHERE organization_id = p_organization_id
        AND EXTRACT(YEAR FROM date) = p_year
        AND status = 'completed'
        AND is_tax_deductible = true
    ), 0) as deductible_expenses,
    COALESCE((
      SELECT SUM(total_amount)
      FROM income_transactions
      WHERE organization_id = p_organization_id
        AND EXTRACT(YEAR FROM date) = p_year
        AND status = 'completed'
        AND source_type NOT IN ('vpk', 'sr', 'food_program')
    ), 0) -
    COALESCE((
      SELECT SUM(total_amount)
      FROM expense_transactions
      WHERE organization_id = p_organization_id
        AND EXTRACT(YEAR FROM date) = p_year
        AND status = 'completed'
        AND is_tax_deductible = true
    ), 0) as net_taxable_income,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'quarter', q,
        'income', q_income,
        'expenses', q_expenses,
        'net', q_income - q_expenses
      ) ORDER BY q)
      FROM (
        SELECT
          q,
          COALESCE((
            SELECT SUM(total_amount)
            FROM income_transactions
            WHERE organization_id = p_organization_id
              AND EXTRACT(YEAR FROM date) = p_year
              AND EXTRACT(QUARTER FROM date) = q
              AND status = 'completed'
          ), 0) as q_income,
          COALESCE((
            SELECT SUM(total_amount)
            FROM expense_transactions
            WHERE organization_id = p_organization_id
              AND EXTRACT(YEAR FROM date) = p_year
              AND EXTRACT(QUARTER FROM date) = q
              AND status = 'completed'
          ), 0) as q_expenses
        FROM generate_series(1, 4) q
      ) quarters
    ) as quarterly_summaries;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Views
-- =====================================================

-- View: Monthly income summary
CREATE OR REPLACE VIEW monthly_income_summary AS
SELECT
  organization_id,
  EXTRACT(YEAR FROM date)::INTEGER as year,
  EXTRACT(MONTH FROM date)::INTEGER as month,
  source_type,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_amount,
  AVG(total_amount) as avg_transaction
FROM income_transactions
WHERE status = 'completed'
GROUP BY organization_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), source_type;

-- View: Monthly expense summary
CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT
  organization_id,
  EXTRACT(YEAR FROM date)::INTEGER as year,
  EXTRACT(MONTH FROM date)::INTEGER as month,
  expense_type,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_amount,
  AVG(total_amount) as avg_transaction
FROM expense_transactions
WHERE status = 'completed'
GROUP BY organization_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), expense_type;

-- View: Daily cash flow
CREATE OR REPLACE VIEW daily_cash_flow AS
SELECT
  d.organization_id,
  d.date,
  COALESCE(d.income, 0) as income,
  COALESCE(d.expenses, 0) as expenses,
  COALESCE(d.income, 0) - COALESCE(d.expenses, 0) as net_flow
FROM (
  SELECT
    COALESCE(i.organization_id, e.organization_id) as organization_id,
    COALESCE(i.date, e.date) as date,
    i.income,
    e.expenses
  FROM (
    SELECT organization_id, date, SUM(total_amount) as income
    FROM income_transactions
    WHERE status = 'completed'
    GROUP BY organization_id, date
  ) i
  FULL OUTER JOIN (
    SELECT organization_id, date, SUM(total_amount) as expenses
    FROM expense_transactions
    WHERE status = 'completed'
    GROUP BY organization_id, date
  ) e ON i.organization_id = e.organization_id AND i.date = e.date
) d;

COMMENT ON TABLE account_categories IS 'Chart of accounts for categorizing transactions';
COMMENT ON TABLE income_transactions IS 'All income records (tuition, fees, reimbursements)';
COMMENT ON TABLE expense_transactions IS 'All expense records (payroll, supplies, utilities)';
COMMENT ON TABLE tax_records IS 'Quarterly and annual tax records';
COMMENT ON TABLE payroll_records IS 'Employee payroll records';
COMMENT ON FUNCTION calculate_monthly_pnl IS 'Calculates Profit & Loss for a given month';
COMMENT ON FUNCTION generate_tax_summary IS 'Generates annual tax summary with quarterly breakdown';

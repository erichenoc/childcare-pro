-- =====================================================
-- MIGRATION 013: Default Account Categories
-- =====================================================
-- Creates default chart of accounts for new organizations
-- Uses a function that can be called during organization creation

-- =====================================================
-- Function to Initialize Default Account Categories
-- =====================================================

CREATE OR REPLACE FUNCTION initialize_default_account_categories(p_organization_id UUID)
RETURNS void AS $$
DECLARE
  v_income_id UUID;
  v_expense_id UUID;
  v_asset_id UUID;
  v_liability_id UUID;
BEGIN
  -- Check if organization already has categories
  IF EXISTS (SELECT 1 FROM account_categories WHERE organization_id = p_organization_id) THEN
    RETURN;
  END IF;

  -- =====================================================
  -- INCOME CATEGORIES (1xxx)
  -- =====================================================

  -- Tuition & Fees (1100)
  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Tuition Income', 'income', '1100', 'Regular tuition payments from families', true, 1, false);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Registration Fees', 'income', '1110', 'One-time registration and enrollment fees', true, 2, false);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Late Fees', 'income', '1120', 'Late payment and late pickup fees', true, 3, false);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Before/After Care', 'income', '1130', 'Extended care program fees', true, 4, false);

  -- Government Programs (1200)
  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible, tax_category)
  VALUES (p_organization_id, 'VPK Reimbursement', 'income', '1200', 'Florida VPK program reimbursements', true, 10, false, 'exempt');

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible, tax_category)
  VALUES (p_organization_id, 'School Readiness', 'income', '1210', 'School Readiness program reimbursements', true, 11, false, 'exempt');

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible, tax_category)
  VALUES (p_organization_id, 'CACFP Reimbursement', 'income', '1220', 'Child and Adult Care Food Program reimbursements', true, 12, false, 'exempt');

  -- Other Income (1300)
  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Field Trip Income', 'income', '1300', 'Field trip fees collected', true, 20, false);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Fundraising Income', 'income', '1310', 'Fundraising event income', true, 21, false);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Other Income', 'income', '1900', 'Miscellaneous income', true, 99, false);

  -- =====================================================
  -- EXPENSE CATEGORIES (2xxx)
  -- =====================================================

  -- Payroll (2100)
  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Salaries & Wages', 'expense', '2100', 'Employee salaries and hourly wages', true, 100, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Payroll Taxes', 'expense', '2110', 'Employer portion of payroll taxes', true, 101, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Employee Benefits', 'expense', '2120', 'Health insurance, retirement, etc.', true, 102, true);

  -- Facilities (2200)
  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Rent/Lease', 'expense', '2200', 'Facility rent or lease payments', true, 110, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Utilities', 'expense', '2210', 'Electric, water, gas, trash', true, 111, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Maintenance & Repairs', 'expense', '2220', 'Facility maintenance and repairs', true, 112, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Cleaning Supplies', 'expense', '2230', 'Cleaning and janitorial supplies', true, 113, true);

  -- Operations (2300)
  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Food & Snacks', 'expense', '2300', 'Food for children meals and snacks', true, 120, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Educational Supplies', 'expense', '2310', 'Art supplies, books, learning materials', true, 121, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Toys & Equipment', 'expense', '2320', 'Toys, playground equipment, furniture', true, 122, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Office Supplies', 'expense', '2330', 'General office and administrative supplies', true, 123, true);

  -- Insurance & Legal (2400)
  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Liability Insurance', 'expense', '2400', 'General liability insurance', true, 130, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Workers Comp Insurance', 'expense', '2410', 'Workers compensation insurance', true, 131, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Professional Services', 'expense', '2420', 'Legal, accounting, consulting fees', true, 132, true);

  -- Licensing & Training (2500)
  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'DCF Licensing Fees', 'expense', '2500', 'Annual DCF licensing and inspection fees', true, 140, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Staff Training', 'expense', '2510', 'Professional development and training', true, 141, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Background Checks', 'expense', '2520', 'Employee background screening', true, 142, true);

  -- Marketing & Technology (2600)
  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Marketing & Advertising', 'expense', '2600', 'Advertising and marketing expenses', true, 150, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Software Subscriptions', 'expense', '2610', 'Software and SaaS subscriptions', true, 151, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Internet & Phone', 'expense', '2620', 'Internet and phone services', true, 152, true);

  -- Other Expenses (2900)
  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Bank Fees', 'expense', '2900', 'Bank and payment processing fees', true, 190, true);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Miscellaneous Expenses', 'expense', '2990', 'Other miscellaneous expenses', true, 199, true);

  -- =====================================================
  -- ASSET CATEGORIES (3xxx)
  -- =====================================================

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Cash & Bank Accounts', 'asset', '3100', 'Operating bank accounts', true, 200, false);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Accounts Receivable', 'asset', '3200', 'Outstanding tuition and fees', true, 201, false);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Equipment & Furniture', 'asset', '3300', 'Playground equipment, furniture, etc.', true, 202, false);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Vehicles', 'asset', '3400', 'Transportation vehicles', true, 203, false);

  -- =====================================================
  -- LIABILITY CATEGORIES (4xxx)
  -- =====================================================

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Accounts Payable', 'liability', '4100', 'Outstanding bills and invoices', true, 300, false);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Payroll Liabilities', 'liability', '4200', 'Payroll taxes and withholdings due', true, 301, false);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Unearned Tuition', 'liability', '4300', 'Prepaid tuition received', true, 302, false);

  INSERT INTO account_categories (organization_id, name, type, code, description, is_active, display_order, is_tax_deductible)
  VALUES (p_organization_id, 'Loans & Notes Payable', 'liability', '4400', 'Business loans and notes', true, 303, false);

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION initialize_default_account_categories IS 'Creates standard chart of accounts for a new organization (Florida childcare center)';

-- =====================================================
-- Trigger to Auto-Initialize on New Organization
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_initialize_account_categories()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_default_account_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on organizations table
DROP TRIGGER IF EXISTS on_organization_created_init_accounts ON organizations;
CREATE TRIGGER on_organization_created_init_accounts
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_initialize_account_categories();

COMMENT ON TRIGGER on_organization_created_init_accounts ON organizations IS 'Auto-creates default chart of accounts when a new organization is created';

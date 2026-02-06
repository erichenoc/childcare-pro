-- =====================================================
-- MIGRATION 008: Invoices Expansion (Multi-Week Payments)
-- =====================================================
-- Enhanced billing with weekly selection and PDF generation

-- Expand invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  -- Period type
  payment_period_type TEXT DEFAULT 'weekly'; -- 'weekly', 'biweekly', 'monthly'
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  weeks_covered INTEGER DEFAULT 1;

-- Week date ranges
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  week_start_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  week_end_date DATE;

-- Discounts
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  advance_payment_discount_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  advance_payment_discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  other_discount_reason TEXT;

-- Late fees
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  late_fee_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  late_fee_applied_at TIMESTAMPTZ;

-- PDF generation
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  pdf_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  pdf_generated_at TIMESTAMPTZ;

-- Email tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  sent_to_email TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  email_opened BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  email_opened_at TIMESTAMPTZ;

-- Payment reminder tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  reminder_sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  reminder_count INTEGER DEFAULT 0;

-- Children covered by this invoice
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  children_ids UUID[] DEFAULT '{}';

-- Detailed line items table for invoice weeks
CREATE TABLE IF NOT EXISTS invoice_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  week_number INTEGER NOT NULL, -- 1, 2, 3, 4 within this invoice
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Charges
  base_amount DECIMAL(10,2) NOT NULL,
  additional_charges DECIMAL(10,2) DEFAULT 0,
  additional_charges_description TEXT,

  -- Discounts
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason TEXT,

  -- Calculated
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (base_amount + additional_charges - discount_amount) STORED,

  -- Days in this week (for partial weeks)
  days_count INTEGER DEFAULT 5,
  days_included TEXT[], -- ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_weeks_org ON invoice_weeks(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_weeks_invoice ON invoice_weeks(invoice_id);

-- RLS for invoice_weeks
ALTER TABLE invoice_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice weeks in their organization"
  ON invoice_weeks FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Directors can manage invoice weeks"
  ON invoice_weeks FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- =====================================================
-- Invoice Generation Functions
-- =====================================================

-- Function to create multi-week invoice
CREATE OR REPLACE FUNCTION create_weekly_invoice(
  p_organization_id UUID,
  p_family_id UUID,
  p_children_ids UUID[],
  p_weeks JSONB, -- [{start_date, end_date, base_amount, additional_charges, discount}]
  p_due_date DATE,
  p_advance_discount_percent DECIMAL DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  invoice_id UUID,
  invoice_number TEXT,
  total_amount DECIMAL,
  message TEXT
) AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_subtotal DECIMAL := 0;
  v_discount_amount DECIMAL := 0;
  v_total DECIMAL;
  v_week JSONB;
  v_week_num INTEGER := 0;
  v_year TEXT;
  v_count INTEGER;
BEGIN
  -- Generate invoice number
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM invoices
  WHERE organization_id = p_organization_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  v_invoice_number := 'INV-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');

  -- Calculate totals from weeks
  FOR v_week IN SELECT * FROM jsonb_array_elements(p_weeks) LOOP
    v_subtotal := v_subtotal +
      (v_week->>'base_amount')::DECIMAL +
      COALESCE((v_week->>'additional_charges')::DECIMAL, 0) -
      COALESCE((v_week->>'discount')::DECIMAL, 0);
  END LOOP;

  -- Calculate advance payment discount
  IF p_advance_discount_percent > 0 AND jsonb_array_length(p_weeks) > 1 THEN
    v_discount_amount := v_subtotal * (p_advance_discount_percent / 100);
  END IF;

  v_total := v_subtotal - v_discount_amount;

  -- Create invoice
  INSERT INTO invoices (
    organization_id, family_id, invoice_number,
    period_start, period_end, due_date,
    payment_period_type, weeks_covered,
    week_start_date, week_end_date,
    subtotal, discount, advance_payment_discount_percent, advance_payment_discount_amount,
    total, balance, status,
    children_ids, notes
  ) VALUES (
    p_organization_id, p_family_id, v_invoice_number,
    (p_weeks->0->>'start_date')::DATE,
    (p_weeks->(jsonb_array_length(p_weeks)-1)->>'end_date')::DATE,
    p_due_date,
    CASE
      WHEN jsonb_array_length(p_weeks) = 1 THEN 'weekly'
      WHEN jsonb_array_length(p_weeks) = 2 THEN 'biweekly'
      ELSE 'monthly'
    END,
    jsonb_array_length(p_weeks),
    (p_weeks->0->>'start_date')::DATE,
    (p_weeks->(jsonb_array_length(p_weeks)-1)->>'end_date')::DATE,
    v_subtotal, v_discount_amount, p_advance_discount_percent, v_discount_amount,
    v_total, v_total, 'pending',
    p_children_ids, p_notes
  )
  RETURNING id INTO v_invoice_id;

  -- Create invoice week records
  FOR v_week IN SELECT * FROM jsonb_array_elements(p_weeks) LOOP
    v_week_num := v_week_num + 1;
    INSERT INTO invoice_weeks (
      organization_id, invoice_id, week_number,
      start_date, end_date,
      base_amount, additional_charges, additional_charges_description,
      discount_amount, discount_reason
    ) VALUES (
      p_organization_id, v_invoice_id, v_week_num,
      (v_week->>'start_date')::DATE, (v_week->>'end_date')::DATE,
      (v_week->>'base_amount')::DECIMAL,
      COALESCE((v_week->>'additional_charges')::DECIMAL, 0),
      v_week->>'additional_charges_description',
      COALESCE((v_week->>'discount')::DECIMAL, 0),
      v_week->>'discount_reason'
    );
  END LOOP;

  success := true;
  invoice_id := v_invoice_id;
  invoice_number := v_invoice_number;
  total_amount := v_total;
  message := 'Invoice created successfully with ' || jsonb_array_length(p_weeks) || ' week(s)';
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply late fee
CREATE OR REPLACE FUNCTION apply_late_fee(
  p_invoice_id UUID,
  p_fee_amount DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE invoices SET
    late_fee_amount = p_fee_amount,
    late_fee_applied_at = NOW(),
    total = total + p_fee_amount,
    balance = balance + p_fee_amount,
    status = CASE WHEN status = 'pending' THEN 'overdue' ELSE status END
  WHERE id = p_invoice_id AND late_fee_amount = 0;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Invoice Views
-- =====================================================

-- View: Invoice with family and children details
CREATE OR REPLACE VIEW invoice_details_view AS
SELECT
  i.*,
  f.family_code,
  f.primary_contact_name as family_contact_name,
  f.primary_contact_email as family_email,
  f.primary_contact_phone as family_phone,
  f.address as family_address,
  f.city as family_city,
  f.state as family_state,
  f.zip_code as family_zip,
  (
    SELECT ARRAY_AGG(CONCAT(c.first_name, ' ', c.last_name))
    FROM children c
    WHERE c.id = ANY(i.children_ids)
  ) as children_names,
  (
    SELECT JSONB_AGG(jsonb_build_object(
      'week_number', iw.week_number,
      'start_date', iw.start_date,
      'end_date', iw.end_date,
      'base_amount', iw.base_amount,
      'additional_charges', iw.additional_charges,
      'discount_amount', iw.discount_amount,
      'subtotal', iw.subtotal
    ) ORDER BY iw.week_number)
    FROM invoice_weeks iw
    WHERE iw.invoice_id = i.id
  ) as weeks_detail,
  o.name as organization_name,
  o.address as organization_address,
  o.city as organization_city,
  o.state as organization_state,
  o.phone as organization_phone,
  o.email as organization_email,
  o.logo_url as organization_logo
FROM invoices i
JOIN families f ON i.family_id = f.id
JOIN organizations o ON i.organization_id = o.id;

-- View: Overdue invoices
CREATE OR REPLACE VIEW overdue_invoices_view AS
SELECT
  i.id,
  i.invoice_number,
  i.family_id,
  f.primary_contact_name,
  f.primary_contact_email as email,
  f.primary_contact_phone as phone,
  i.total,
  i.balance,
  i.due_date,
  CURRENT_DATE - i.due_date as days_overdue,
  i.reminder_count,
  i.late_fee_amount,
  i.organization_id
FROM invoices i
JOIN families f ON i.family_id = f.id
WHERE i.status IN ('pending', 'overdue')
  AND i.due_date < CURRENT_DATE
  AND i.balance > 0;

COMMENT ON TABLE invoice_weeks IS 'Detailed breakdown of weeks covered by each invoice';
COMMENT ON FUNCTION create_weekly_invoice IS 'Creates multi-week invoice with automatic totals calculation';

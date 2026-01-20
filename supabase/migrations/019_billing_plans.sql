-- =====================================================
-- Migration: Billing Plans & Rates
-- Description: Billing rates by age group, schedule, and enrollment management
-- =====================================================

-- ==================== Enums ====================

-- Schedule types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type') THEN
    CREATE TYPE schedule_type AS ENUM ('full_time', 'part_time', 'before_after', 'drop_in', 'summer_camp');
  END IF;
END$$;

-- Billing frequency
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_frequency') THEN
    CREATE TYPE billing_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'annually');
  END IF;
END$$;

-- Enrollment status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
    CREATE TYPE enrollment_status AS ENUM ('active', 'pending', 'suspended', 'terminated');
  END IF;
END$$;

-- Discount type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
    CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');
  END IF;
END$$;

-- ==================== Billing Rate Templates ====================

CREATE TABLE IF NOT EXISTS billing_rate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Rate identification
  name TEXT NOT NULL,
  description TEXT,

  -- Age range (in months)
  age_range_start_months INTEGER NOT NULL DEFAULT 0,
  age_range_end_months INTEGER NOT NULL DEFAULT 144,

  -- Schedule and pricing
  schedule_type schedule_type NOT NULL DEFAULT 'full_time',
  billing_frequency billing_frequency NOT NULL DEFAULT 'weekly',
  base_rate DECIMAL(10,2) NOT NULL,

  -- Additional options
  registration_fee DECIMAL(10,2) DEFAULT 0,
  supply_fee_monthly DECIMAL(10,2) DEFAULT 0,
  late_pickup_fee_per_minute DECIMAL(6,2) DEFAULT 1.00,

  -- Days included (for part-time/custom schedules)
  days_per_week INTEGER DEFAULT 5 CHECK (days_per_week BETWEEN 1 AND 7),
  hours_per_day DECIMAL(4,2) DEFAULT 10.0,

  -- Validity
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_age_range CHECK (age_range_end_months > age_range_start_months),
  CONSTRAINT valid_effective_dates CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- ==================== Discounts ====================

CREATE TABLE IF NOT EXISTS billing_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL, -- percentage (e.g., 10 for 10%) or fixed amount

  -- Applicability
  applies_to_siblings BOOLEAN DEFAULT false,
  sibling_order INTEGER, -- e.g., 2 = applies to 2nd child, 3 = 3rd child
  applies_to_staff BOOLEAN DEFAULT false,
  applies_to_military BOOLEAN DEFAULT false,
  applies_to_prepayment BOOLEAN DEFAULT false,

  -- Custom eligibility code
  eligibility_code TEXT, -- e.g., 'EMPLOYEE10', 'MILITARY15'

  -- Validity
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Child Billing Enrollments ====================

CREATE TABLE IF NOT EXISTS child_billing_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Child and family
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Rate assignment
  rate_template_id UUID NOT NULL REFERENCES billing_rate_templates(id),

  -- Custom rate override (if different from template)
  custom_rate DECIMAL(10,2), -- NULL means use template rate

  -- Enrollment details
  enrollment_status enrollment_status NOT NULL DEFAULT 'active',
  enrolled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  termination_date DATE,
  termination_reason TEXT,

  -- Schedule customization
  scheduled_days TEXT[], -- e.g., ['monday', 'tuesday', 'wednesday']
  start_time TIME,
  end_time TIME,

  -- Auto-billing
  auto_invoice BOOLEAN DEFAULT true,
  billing_day_of_week INTEGER DEFAULT 1 CHECK (billing_day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  billing_day_of_month INTEGER CHECK (billing_day_of_month BETWEEN 1 AND 28),

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One active enrollment per child
  CONSTRAINT unique_active_child_enrollment UNIQUE (child_id, enrollment_status)
    DEFERRABLE INITIALLY DEFERRED
);

-- ==================== Applied Discounts ====================

CREATE TABLE IF NOT EXISTS applied_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  enrollment_id UUID NOT NULL REFERENCES child_billing_enrollments(id) ON DELETE CASCADE,
  discount_id UUID NOT NULL REFERENCES billing_discounts(id) ON DELETE CASCADE,

  -- Override discount value if needed
  custom_discount_value DECIMAL(10,2),

  -- Validity for this specific application
  applied_from DATE NOT NULL DEFAULT CURRENT_DATE,
  applied_to DATE,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_enrollment_discount UNIQUE (enrollment_id, discount_id)
);

-- ==================== Recurring Invoice Templates ====================

CREATE TABLE IF NOT EXISTS recurring_invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Template details
  name TEXT NOT NULL,
  description TEXT,

  -- Line items (JSON array)
  line_items JSONB NOT NULL DEFAULT '[]',
  -- Format: [{"description": "Tuition", "amount": 250, "child_id": "uuid", "enrollment_id": "uuid"}, ...]

  -- Schedule
  frequency billing_frequency NOT NULL DEFAULT 'weekly',
  billing_day_of_week INTEGER CHECK (billing_day_of_week BETWEEN 0 AND 6),
  billing_day_of_month INTEGER CHECK (billing_day_of_month BETWEEN 1 AND 28),

  -- Generation settings
  generate_days_before INTEGER DEFAULT 7, -- Generate invoice X days before due
  due_days_after_generation INTEGER DEFAULT 7, -- Invoice due X days after generation

  -- Auto-send
  auto_send BOOLEAN DEFAULT false,

  -- Validity
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,

  -- Tracking
  last_generated_date DATE,
  next_generation_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Billing Adjustments ====================

CREATE TABLE IF NOT EXISTS billing_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  enrollment_id UUID REFERENCES child_billing_enrollments(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

  -- Adjustment details
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('credit', 'debit', 'refund', 'waiver')),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,

  -- Period it applies to
  applies_to_period_start DATE,
  applies_to_period_end DATE,

  -- Status
  is_applied BOOLEAN DEFAULT false,
  applied_to_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ,

  -- Approval
  created_by UUID REFERENCES staff(id),
  approved_by UUID REFERENCES staff(id),
  approved_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Indexes ====================

CREATE INDEX IF NOT EXISTS idx_billing_rate_templates_org ON billing_rate_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_rate_templates_active ON billing_rate_templates(organization_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_billing_rate_templates_age ON billing_rate_templates(age_range_start_months, age_range_end_months);

CREATE INDEX IF NOT EXISTS idx_billing_discounts_org ON billing_discounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_discounts_active ON billing_discounts(organization_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_child_billing_enrollments_org ON child_billing_enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_child_billing_enrollments_child ON child_billing_enrollments(child_id);
CREATE INDEX IF NOT EXISTS idx_child_billing_enrollments_family ON child_billing_enrollments(family_id);
CREATE INDEX IF NOT EXISTS idx_child_billing_enrollments_active ON child_billing_enrollments(organization_id, enrollment_status)
  WHERE enrollment_status = 'active';

CREATE INDEX IF NOT EXISTS idx_applied_discounts_enrollment ON applied_discounts(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_recurring_invoice_templates_org ON recurring_invoice_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_templates_family ON recurring_invoice_templates(family_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_templates_next_gen ON recurring_invoice_templates(next_generation_date)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_billing_adjustments_family ON billing_adjustments(family_id);
CREATE INDEX IF NOT EXISTS idx_billing_adjustments_enrollment ON billing_adjustments(enrollment_id);

-- ==================== RLS Policies ====================

ALTER TABLE billing_rate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_billing_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_adjustments ENABLE ROW LEVEL SECURITY;

-- Policies for billing_rate_templates
CREATE POLICY "billing_rate_templates_org_access" ON billing_rate_templates
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM staff WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policies for billing_discounts
CREATE POLICY "billing_discounts_org_access" ON billing_discounts
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM staff WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policies for child_billing_enrollments
CREATE POLICY "child_billing_enrollments_org_access" ON child_billing_enrollments
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM staff WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policies for applied_discounts
CREATE POLICY "applied_discounts_org_access" ON applied_discounts
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM staff WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policies for recurring_invoice_templates
CREATE POLICY "recurring_invoice_templates_org_access" ON recurring_invoice_templates
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM staff WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policies for billing_adjustments
CREATE POLICY "billing_adjustments_org_access" ON billing_adjustments
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM staff WHERE email = auth.jwt() ->> 'email'
    )
  );

-- ==================== Triggers ====================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER billing_rate_templates_updated_at
  BEFORE UPDATE ON billing_rate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

CREATE TRIGGER billing_discounts_updated_at
  BEFORE UPDATE ON billing_discounts
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

CREATE TRIGGER child_billing_enrollments_updated_at
  BEFORE UPDATE ON child_billing_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

CREATE TRIGGER recurring_invoice_templates_updated_at
  BEFORE UPDATE ON recurring_invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- ==================== Helper Functions ====================

-- Calculate effective rate for a child
CREATE OR REPLACE FUNCTION calculate_child_billing_rate(
  p_child_id UUID
) RETURNS TABLE (
  enrollment_id UUID,
  rate_name TEXT,
  base_rate DECIMAL(10,2),
  custom_rate DECIMAL(10,2),
  effective_rate DECIMAL(10,2),
  total_discount DECIMAL(10,2),
  final_rate DECIMAL(10,2),
  billing_frequency billing_frequency
) AS $$
BEGIN
  RETURN QUERY
  WITH enrollment_data AS (
    SELECT
      e.id,
      r.name AS rate_name,
      r.base_rate,
      e.custom_rate,
      COALESCE(e.custom_rate, r.base_rate) AS effective_rate,
      r.billing_frequency
    FROM child_billing_enrollments e
    JOIN billing_rate_templates r ON e.rate_template_id = r.id
    WHERE e.child_id = p_child_id
      AND e.enrollment_status = 'active'
  ),
  discount_data AS (
    SELECT
      ad.enrollment_id,
      SUM(
        CASE
          WHEN d.discount_type = 'percentage' THEN
            (COALESCE(ad.custom_discount_value, d.discount_value) / 100.0) * ed.effective_rate
          ELSE
            COALESCE(ad.custom_discount_value, d.discount_value)
        END
      ) AS total_discount
    FROM applied_discounts ad
    JOIN billing_discounts d ON ad.discount_id = d.id
    JOIN enrollment_data ed ON ad.enrollment_id = ed.id
    WHERE d.is_active = true
      AND (ad.applied_to IS NULL OR ad.applied_to >= CURRENT_DATE)
    GROUP BY ad.enrollment_id
  )
  SELECT
    ed.id,
    ed.rate_name,
    ed.base_rate,
    ed.custom_rate,
    ed.effective_rate,
    COALESCE(dd.total_discount, 0) AS total_discount,
    ed.effective_rate - COALESCE(dd.total_discount, 0) AS final_rate,
    ed.billing_frequency
  FROM enrollment_data ed
  LEFT JOIN discount_data dd ON ed.id = dd.enrollment_id;
END;
$$ LANGUAGE plpgsql;

-- Get applicable rate templates for a child's age
CREATE OR REPLACE FUNCTION get_applicable_rates(
  p_organization_id UUID,
  p_child_age_months INTEGER
) RETURNS SETOF billing_rate_templates AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM billing_rate_templates
  WHERE organization_id = p_organization_id
    AND is_active = true
    AND age_range_start_months <= p_child_age_months
    AND age_range_end_months > p_child_age_months
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  ORDER BY schedule_type, base_rate;
END;
$$ LANGUAGE plpgsql;

-- ==================== Default Data ====================

-- Note: Default rate templates should be created per organization via the UI
-- This is just a helper to show the structure

COMMENT ON TABLE billing_rate_templates IS 'Billing rate configurations by age group and schedule type';
COMMENT ON TABLE billing_discounts IS 'Available discounts (sibling, military, employee, etc.)';
COMMENT ON TABLE child_billing_enrollments IS 'Individual child enrollment in a billing plan';
COMMENT ON TABLE applied_discounts IS 'Discounts applied to specific enrollments';
COMMENT ON TABLE recurring_invoice_templates IS 'Templates for auto-generated recurring invoices';
COMMENT ON TABLE billing_adjustments IS 'Credits, debits, refunds, and waivers';

COMMENT ON COLUMN billing_rate_templates.days_per_week IS 'Number of days included in the rate (for part-time schedules)';
COMMENT ON COLUMN child_billing_enrollments.scheduled_days IS 'Array of day names: monday, tuesday, etc.';
COMMENT ON COLUMN recurring_invoice_templates.line_items IS 'JSON array of line items with description, amount, child_id';

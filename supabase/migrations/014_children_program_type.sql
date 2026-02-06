-- =====================================================
-- MIGRATION 014: Children Program Type
-- =====================================================
-- Add program_type to children table for quick identification
-- of payment/funding source

-- Create enum for program types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'program_type_enum') THEN
        CREATE TYPE program_type_enum AS ENUM (
            'private',           -- Full private pay
            'vpk',               -- VPK only (3 hours/day state funded)
            'vpk_wraparound',    -- VPK + additional private hours (wrap-around care)
            'school_readiness',  -- School Readiness (SR) funded
            'sr_copay'           -- School Readiness with family co-pay
        );
    END IF;
END$$;

-- Add program_type column to children
ALTER TABLE children ADD COLUMN IF NOT EXISTS
    program_type TEXT DEFAULT 'private';

-- Add VPK specific fields
ALTER TABLE children ADD COLUMN IF NOT EXISTS
    vpk_certificate_number TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS
    vpk_schedule_type TEXT; -- 'school_year' or 'summer'

-- Add School Readiness specific fields
ALTER TABLE children ADD COLUMN IF NOT EXISTS
    sr_case_number TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS
    sr_authorized_hours_weekly INTEGER;
ALTER TABLE children ADD COLUMN IF NOT EXISTS
    sr_copay_amount DECIMAL(10,2);
ALTER TABLE children ADD COLUMN IF NOT EXISTS
    sr_copay_frequency TEXT; -- 'weekly' or 'monthly'

-- Add billing rate fields (for private pay)
ALTER TABLE children ADD COLUMN IF NOT EXISTS
    weekly_rate DECIMAL(10,2);
ALTER TABLE children ADD COLUMN IF NOT EXISTS
    hourly_rate DECIMAL(10,2);
ALTER TABLE children ADD COLUMN IF NOT EXISTS
    schedule_type TEXT DEFAULT 'full_time'; -- 'full_time', 'part_time', 'drop_in'

-- Add index for program type queries
CREATE INDEX IF NOT EXISTS idx_children_program_type ON children(program_type);
CREATE INDEX IF NOT EXISTS idx_children_vpk_cert ON children(vpk_certificate_number) WHERE vpk_certificate_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_children_sr_case ON children(sr_case_number) WHERE sr_case_number IS NOT NULL;

-- =====================================================
-- Add billing period preferences
-- =====================================================

-- Add billing preferences to families
ALTER TABLE families ADD COLUMN IF NOT EXISTS
    preferred_billing_period TEXT DEFAULT 'weekly'; -- 'weekly', 'biweekly', 'monthly'
ALTER TABLE families ADD COLUMN IF NOT EXISTS
    billing_day_of_week INTEGER DEFAULT 1; -- 1=Monday, 5=Friday
ALTER TABLE families ADD COLUMN IF NOT EXISTS
    auto_generate_invoices BOOLEAN DEFAULT true;
ALTER TABLE families ADD COLUMN IF NOT EXISTS
    sibling_discount_percent DECIMAL(5,2) DEFAULT 0;

-- =====================================================
-- Rate table by age group and program
-- =====================================================

CREATE TABLE IF NOT EXISTS rate_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    name TEXT NOT NULL, -- e.g., "Infant Full Time", "Toddler Part Time"
    age_group TEXT NOT NULL, -- 'infant', 'toddler', 'twos', 'threes', 'prek', 'school_age'
    schedule_type TEXT NOT NULL, -- 'full_time', 'part_time', 'drop_in', 'before_after'
    program_type TEXT DEFAULT 'private', -- 'private', 'vpk_wraparound', 'sr_copay'

    weekly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),

    registration_fee DECIMAL(10,2) DEFAULT 0,
    supply_fee_monthly DECIMAL(10,2) DEFAULT 0,

    effective_from DATE NOT NULL,
    effective_until DATE,

    is_active BOOLEAN DEFAULT true,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_schedules_org ON rate_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_rate_schedules_age_group ON rate_schedules(age_group);
CREATE INDEX IF NOT EXISTS idx_rate_schedules_active ON rate_schedules(is_active) WHERE is_active = true;

-- RLS for rate_schedules
ALTER TABLE rate_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org rate schedules"
    ON rate_schedules FOR SELECT
    USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Directors can manage rate schedules"
    ON rate_schedules FOR ALL
    USING (
        organization_id = get_user_organization_id() AND
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
    );

-- =====================================================
-- Function to get applicable rate for a child
-- =====================================================

CREATE OR REPLACE FUNCTION get_child_rate(p_child_id UUID)
RETURNS TABLE (
    rate_name TEXT,
    weekly_rate DECIMAL,
    daily_rate DECIMAL,
    hourly_rate DECIMAL,
    program_type TEXT
) AS $$
DECLARE
    v_child RECORD;
    v_age_months INTEGER;
    v_age_group TEXT;
BEGIN
    -- Get child info
    SELECT * INTO v_child FROM children WHERE id = p_child_id;

    -- Calculate age in months
    v_age_months := EXTRACT(YEAR FROM age(CURRENT_DATE, v_child.date_of_birth)) * 12 +
                    EXTRACT(MONTH FROM age(CURRENT_DATE, v_child.date_of_birth));

    -- Determine age group
    IF v_age_months < 12 THEN
        v_age_group := 'infant';
    ELSIF v_age_months < 24 THEN
        v_age_group := 'toddler';
    ELSIF v_age_months < 36 THEN
        v_age_group := 'twos';
    ELSIF v_age_months < 48 THEN
        v_age_group := 'threes';
    ELSIF v_age_months < 72 THEN
        v_age_group := 'prek';
    ELSE
        v_age_group := 'school_age';
    END IF;

    -- If child has specific rate, use that
    IF v_child.weekly_rate IS NOT NULL THEN
        rate_name := 'Custom Rate';
        weekly_rate := v_child.weekly_rate;
        daily_rate := v_child.weekly_rate / 5;
        hourly_rate := v_child.hourly_rate;
        program_type := v_child.program_type;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Otherwise, get from rate schedule
    RETURN QUERY
    SELECT
        rs.name,
        rs.weekly_rate,
        rs.daily_rate,
        rs.hourly_rate,
        rs.program_type
    FROM rate_schedules rs
    WHERE rs.organization_id = v_child.organization_id
        AND rs.age_group = v_age_group
        AND rs.schedule_type = COALESCE(v_child.schedule_type, 'full_time')
        AND rs.is_active = true
        AND rs.effective_from <= CURRENT_DATE
        AND (rs.effective_until IS NULL OR rs.effective_until >= CURRENT_DATE)
    ORDER BY rs.effective_from DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON COLUMN children.program_type IS 'Primary funding source: private, vpk, vpk_wraparound, school_readiness, sr_copay';
COMMENT ON COLUMN children.vpk_certificate_number IS 'VPK certificate number from Florida ELC';
COMMENT ON COLUMN children.sr_case_number IS 'School Readiness case number from ELC';
COMMENT ON TABLE rate_schedules IS 'Organization rate schedules by age group and program type';

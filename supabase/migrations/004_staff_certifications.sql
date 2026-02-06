-- =====================================================
-- MIGRATION 004: Staff Certifications (Florida DCF Compliance)
-- =====================================================
-- Tracks 45-hour training, CDA credentials, and annual in-service

-- Expand profiles table with certification fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  -- 45-Hour Training (Required for Directors/Owners)
  has_45_hours_training BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  training_45_hours_completion_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  training_45_hours_certificate_url TEXT;

-- 40-Hour Initial Training (Required for all new staff)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  has_40_hours_initial BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  initial_training_start_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  initial_training_due_date DATE; -- Must complete within 1 year
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  initial_training_completion_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  initial_training_certificate_url TEXT;

-- CDA Credential
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  has_cda_credential BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  cda_credential_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  cda_expiration_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  cda_certificate_url TEXT;

-- Annual In-Service Training
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  annual_training_hours_completed DECIMAL(4,1) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  annual_training_fiscal_year TEXT; -- e.g., '2025-2026' (Jul 1 - Jun 30)

-- Position/Role details
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  position_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  is_director BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  background_check_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  background_check_clear BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  fingerprint_date DATE;

-- Detailed certifications tracking table
CREATE TABLE IF NOT EXISTS staff_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  certification_type TEXT NOT NULL,
  -- Types: '45_hours', '40_hours_initial', 'cda', 'first_aid', 'cpr',
  --        'early_literacy', 'safe_sleep', 'shaken_baby', 'fire_extinguisher',
  --        'medication_administration', 'special_needs', 'annual_inservice', 'other'

  certification_name TEXT NOT NULL,
  issuing_organization TEXT,
  credential_number TEXT,

  hours_completed DECIMAL(5,1), -- For trainings measured in hours

  completion_date DATE,
  expiration_date DATE,

  certificate_url TEXT,

  -- Verification
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,

  status TEXT DEFAULT 'active', -- 'active', 'expired', 'pending_verification', 'revoked'

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_staff_certifications_profile ON staff_certifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_org ON staff_certifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_type ON staff_certifications(certification_type);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_expiration ON staff_certifications(expiration_date);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_status ON staff_certifications(status);

-- RLS Policies
ALTER TABLE staff_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view certifications in their organization"
  ON staff_certifications FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Directors can manage certifications"
  ON staff_certifications FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

CREATE POLICY "Directors can update certifications"
  ON staff_certifications FOR UPDATE
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

CREATE POLICY "Directors can delete certifications"
  ON staff_certifications FOR DELETE
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Trigger for updated_at
CREATE TRIGGER update_staff_certifications_updated_at
  BEFORE UPDATE ON staff_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Compliance Validation Functions
-- =====================================================

-- Function to check if staff member is compliant for classroom assignment
CREATE OR REPLACE FUNCTION check_staff_compliance(p_profile_id UUID)
RETURNS TABLE (
  is_compliant BOOLEAN,
  missing_requirements TEXT[],
  expiring_soon TEXT[],
  compliance_score INTEGER
) AS $$
DECLARE
  v_profile RECORD;
  v_missing TEXT[] := ARRAY[]::TEXT[];
  v_expiring TEXT[] := ARRAY[]::TEXT[];
  v_score INTEGER := 100;
  v_is_director BOOLEAN;
  v_hire_date DATE;
  v_current_fiscal_year TEXT;
BEGIN
  -- Get profile info
  SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
  v_is_director := v_profile.is_director OR v_profile.role IN ('owner', 'director');
  v_hire_date := v_profile.hire_date;

  -- Calculate current Florida fiscal year (Jul 1 - Jun 30)
  IF EXTRACT(MONTH FROM CURRENT_DATE) >= 7 THEN
    v_current_fiscal_year := EXTRACT(YEAR FROM CURRENT_DATE) || '-' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1);
  ELSE
    v_current_fiscal_year := (EXTRACT(YEAR FROM CURRENT_DATE) - 1) || '-' || EXTRACT(YEAR FROM CURRENT_DATE);
  END IF;

  -- Check 45-hour training (required for directors)
  IF v_is_director AND NOT COALESCE(v_profile.has_45_hours_training, false) THEN
    v_missing := array_append(v_missing, '45-Hour DCF Training (Required for Directors)');
    v_score := v_score - 30;
  END IF;

  -- Check 40-hour initial training (required for all staff within 1 year of hire)
  IF NOT COALESCE(v_profile.has_40_hours_initial, false) THEN
    IF v_hire_date IS NOT NULL AND (CURRENT_DATE - v_hire_date) > 365 THEN
      v_missing := array_append(v_missing, '40-Hour Initial Training (OVERDUE)');
      v_score := v_score - 25;
    ELSIF v_hire_date IS NOT NULL AND (CURRENT_DATE - v_hire_date) > 270 THEN
      v_expiring := array_append(v_expiring, '40-Hour Initial Training (Due within 90 days)');
      v_score := v_score - 10;
    END IF;
  END IF;

  -- Check annual in-service (10 hours required Jul 1 - Jun 30)
  IF v_profile.annual_training_fiscal_year != v_current_fiscal_year OR
     COALESCE(v_profile.annual_training_hours_completed, 0) < 10 THEN
    IF EXTRACT(MONTH FROM CURRENT_DATE) >= 4 AND EXTRACT(MONTH FROM CURRENT_DATE) <= 6 THEN
      -- April-June: getting close to deadline
      v_expiring := array_append(v_expiring,
        'Annual In-Service (' || COALESCE(v_profile.annual_training_hours_completed, 0) || '/10 hours)');
      v_score := v_score - 5;
    END IF;
  END IF;

  -- Check CDA expiration
  IF v_profile.has_cda_credential AND v_profile.cda_expiration_date IS NOT NULL THEN
    IF v_profile.cda_expiration_date < CURRENT_DATE THEN
      v_missing := array_append(v_missing, 'CDA Credential (EXPIRED)');
      v_score := v_score - 15;
    ELSIF v_profile.cda_expiration_date < (CURRENT_DATE + INTERVAL '30 days') THEN
      v_expiring := array_append(v_expiring, 'CDA Credential (Expires within 30 days)');
      v_score := v_score - 5;
    END IF;
  END IF;

  -- Check background check
  IF NOT COALESCE(v_profile.background_check_clear, false) THEN
    v_missing := array_append(v_missing, 'Background Check');
    v_score := v_score - 20;
  END IF;

  -- Return results
  is_compliant := array_length(v_missing, 1) IS NULL OR array_length(v_missing, 1) = 0;
  missing_requirements := v_missing;
  expiring_soon := v_expiring;
  compliance_score := GREATEST(v_score, 0);

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to prevent classroom assignment without compliance
CREATE OR REPLACE FUNCTION validate_staff_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_compliance RECORD;
BEGIN
  -- Check staff compliance
  SELECT * INTO v_compliance FROM check_staff_compliance(NEW.profile_id);

  -- Block assignment if critical requirements missing
  IF NOT v_compliance.is_compliant AND
     (v_compliance.missing_requirements && ARRAY['45-Hour DCF Training (Required for Directors)',
                                                  '40-Hour Initial Training (OVERDUE)',
                                                  'Background Check']) THEN
    RAISE EXCEPTION 'Cannot assign staff to classroom: Missing critical requirements: %',
      array_to_string(v_compliance.missing_requirements, ', ');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for staff assignments validation
DROP TRIGGER IF EXISTS validate_staff_assignment_trigger ON staff_assignments;
CREATE TRIGGER validate_staff_assignment_trigger
  BEFORE INSERT OR UPDATE ON staff_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_staff_assignment();

-- View for compliance dashboard
CREATE OR REPLACE VIEW staff_compliance_view AS
SELECT
  p.id as profile_id,
  p.organization_id,
  p.first_name,
  p.last_name,
  p.role,
  p.is_director,
  p.hire_date,
  p.has_45_hours_training,
  p.has_40_hours_initial,
  p.has_cda_credential,
  p.cda_expiration_date,
  p.annual_training_hours_completed,
  p.annual_training_fiscal_year,
  p.background_check_clear,
  (SELECT compliance.is_compliant FROM check_staff_compliance(p.id) compliance) as is_compliant,
  (SELECT compliance.compliance_score FROM check_staff_compliance(p.id) compliance) as compliance_score,
  (SELECT compliance.missing_requirements FROM check_staff_compliance(p.id) compliance) as missing_requirements,
  (SELECT compliance.expiring_soon FROM check_staff_compliance(p.id) compliance) as expiring_soon
FROM profiles p
WHERE p.role != 'parent' AND p.status = 'active';

COMMENT ON TABLE staff_certifications IS 'Detailed tracking of staff certifications and training for DCF compliance';
COMMENT ON FUNCTION check_staff_compliance(UUID) IS 'Validates staff compliance with Florida DCF requirements';

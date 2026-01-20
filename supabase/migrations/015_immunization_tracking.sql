-- =====================================================
-- MIGRATION 015: Immunization Tracking Module
-- =====================================================
-- Complete immunization tracking with DCF Florida compliance
-- Tracks vaccines, dates, exemptions, and generates reports

-- =====================================================
-- DCF Vaccine Requirements Reference Table
-- =====================================================

-- Florida DCF required vaccines by age
CREATE TABLE IF NOT EXISTS dcf_vaccine_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  vaccine_name TEXT NOT NULL, -- 'DTaP', 'Polio', 'MMR', 'Hepatitis B', etc.
  vaccine_code TEXT NOT NULL, -- Standard vaccine code

  -- Age requirements
  min_age_months INTEGER NOT NULL DEFAULT 0,
  max_age_months INTEGER, -- NULL means no max

  -- Dose requirements
  required_doses INTEGER NOT NULL DEFAULT 1,
  dose_interval_days INTEGER, -- Minimum days between doses

  -- Details
  description TEXT,
  notes TEXT,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert DCF Florida vaccine requirements
INSERT INTO dcf_vaccine_requirements (vaccine_name, vaccine_code, min_age_months, max_age_months, required_doses, dose_interval_days, description) VALUES
  ('DTaP (Diphtheria, Tetanus, Pertussis)', 'DTAP', 2, NULL, 5, 28, 'Required: 5 doses by age 4-6'),
  ('Polio (IPV)', 'IPV', 2, NULL, 4, 28, 'Required: 4 doses by age 4-6'),
  ('MMR (Measles, Mumps, Rubella)', 'MMR', 12, NULL, 2, 28, 'Required: 2 doses, first at 12 months'),
  ('Hepatitis B', 'HEPB', 0, NULL, 3, 28, 'Required: 3 doses starting at birth'),
  ('Varicella (Chickenpox)', 'VAR', 12, NULL, 2, 84, 'Required: 2 doses, first at 12 months'),
  ('Hib (Haemophilus influenzae type b)', 'HIB', 2, 59, 4, 28, 'Required: Up to 4 doses through age 4'),
  ('PCV13 (Pneumococcal)', 'PCV13', 2, 59, 4, 28, 'Required: Up to 4 doses through age 4')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_dcf_vaccines_code ON dcf_vaccine_requirements(vaccine_code);
CREATE INDEX IF NOT EXISTS idx_dcf_vaccines_age ON dcf_vaccine_requirements(min_age_months, max_age_months);

-- =====================================================
-- Child Immunization Records
-- =====================================================

-- Main immunization records table
CREATE TABLE IF NOT EXISTS immunization_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  -- Vaccine info
  vaccine_name TEXT NOT NULL,
  vaccine_code TEXT, -- Matches dcf_vaccine_requirements.vaccine_code
  dose_number INTEGER NOT NULL DEFAULT 1, -- 1st dose, 2nd dose, etc.

  -- Dates
  date_administered DATE NOT NULL,
  expiration_date DATE, -- When next dose is due or record expires

  -- Provider info
  provider_name TEXT,
  provider_location TEXT,
  lot_number TEXT,

  -- Documentation
  document_url TEXT, -- URL to uploaded immunization record
  document_type TEXT, -- 'certificate', 'record', 'exemption'

  -- Verification
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'expired', 'exempted'

  -- Metadata
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_immunization_child ON immunization_records(child_id);
CREATE INDEX IF NOT EXISTS idx_immunization_org ON immunization_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_immunization_vaccine ON immunization_records(vaccine_code);
CREATE INDEX IF NOT EXISTS idx_immunization_status ON immunization_records(status);
CREATE INDEX IF NOT EXISTS idx_immunization_date ON immunization_records(date_administered);

-- =====================================================
-- Immunization Exemptions
-- =====================================================

-- Track medical and religious exemptions
CREATE TABLE IF NOT EXISTS immunization_exemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  -- Exemption details
  exemption_type TEXT NOT NULL, -- 'medical', 'religious'
  vaccine_codes TEXT[], -- Array of exempt vaccine codes, NULL = all vaccines

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = permanent

  -- Documentation
  document_url TEXT, -- Required exemption form
  physician_name TEXT, -- For medical exemptions
  physician_license TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'revoked'

  -- Approval
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exemption_child ON immunization_exemptions(child_id);
CREATE INDEX IF NOT EXISTS idx_exemption_org ON immunization_exemptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_exemption_status ON immunization_exemptions(status);

-- =====================================================
-- Compliance Tracking
-- =====================================================

-- Track overall compliance status per child
CREATE TABLE IF NOT EXISTS immunization_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  -- Status
  compliance_status TEXT NOT NULL DEFAULT 'incomplete', -- 'compliant', 'incomplete', 'overdue', 'exempt'
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),

  -- Summary
  vaccines_complete INTEGER DEFAULT 0,
  vaccines_required INTEGER DEFAULT 0,
  vaccines_overdue INTEGER DEFAULT 0,
  vaccines_exempt INTEGER DEFAULT 0,

  -- Next action
  next_due_vaccine TEXT,
  next_due_date DATE,

  -- Grace period tracking (DCF allows provisional enrollment)
  provisional_enrollment BOOLEAN DEFAULT false,
  provisional_end_date DATE,
  provisional_notes TEXT,

  -- Report dates
  last_report_generated TIMESTAMPTZ,
  last_dcf_submission TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_compliance_child ON immunization_compliance(child_id);
CREATE INDEX IF NOT EXISTS idx_compliance_org ON immunization_compliance(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON immunization_compliance(compliance_status);
CREATE INDEX IF NOT EXISTS idx_compliance_provisional ON immunization_compliance(provisional_enrollment) WHERE provisional_enrollment = true;

-- =====================================================
-- Reminders and Notifications
-- =====================================================

-- Track scheduled reminders for upcoming vaccines
CREATE TABLE IF NOT EXISTS immunization_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  -- Reminder details
  vaccine_code TEXT NOT NULL,
  vaccine_name TEXT NOT NULL,
  due_date DATE NOT NULL,

  -- Notification tracking
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  reminder_sent_to TEXT[], -- Array of email addresses

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'completed', 'dismissed'

  -- Follow-up
  follow_up_date DATE,
  follow_up_sent BOOLEAN DEFAULT false,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminder_child ON immunization_reminders(child_id);
CREATE INDEX IF NOT EXISTS idx_reminder_due ON immunization_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminder_status ON immunization_reminders(status);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE dcf_vaccine_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE immunization_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE immunization_exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE immunization_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE immunization_reminders ENABLE ROW LEVEL SECURITY;

-- Policies for dcf_vaccine_requirements (public read)
CREATE POLICY "Anyone can view DCF vaccine requirements"
  ON dcf_vaccine_requirements FOR SELECT
  USING (true);

CREATE POLICY "Only system admins can manage DCF requirements"
  ON dcf_vaccine_requirements FOR ALL
  USING (is_system_admin());

-- Policies for immunization_records
CREATE POLICY "Users can view immunization records in their organization"
  ON immunization_records FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can create immunization records"
  ON immunization_records FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Staff can update immunization records"
  ON immunization_records FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Directors can delete immunization records"
  ON immunization_records FOR DELETE
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Policies for immunization_exemptions
CREATE POLICY "Users can view exemptions in their organization"
  ON immunization_exemptions FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Directors can manage exemptions"
  ON immunization_exemptions FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Policies for immunization_compliance
CREATE POLICY "Users can view compliance in their organization"
  ON immunization_compliance FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "System can update compliance"
  ON immunization_compliance FOR ALL
  USING (organization_id = get_user_organization_id());

-- Policies for immunization_reminders
CREATE POLICY "Users can view reminders in their organization"
  ON immunization_reminders FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage reminders"
  ON immunization_reminders FOR ALL
  USING (organization_id = get_user_organization_id());

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate compliance status for a child
CREATE OR REPLACE FUNCTION calculate_immunization_compliance(p_child_id UUID)
RETURNS TABLE (
  is_compliant BOOLEAN,
  vaccines_complete INTEGER,
  vaccines_required INTEGER,
  vaccines_overdue INTEGER,
  next_due_vaccine TEXT,
  next_due_date DATE
) AS $$
DECLARE
  v_child_age_months INTEGER;
  v_org_id UUID;
BEGIN
  -- Get child's age in months and organization
  SELECT
    EXTRACT(YEAR FROM age(NOW(), c.date_of_birth)) * 12 +
    EXTRACT(MONTH FROM age(NOW(), c.date_of_birth)),
    c.organization_id
  INTO v_child_age_months, v_org_id
  FROM children c WHERE c.id = p_child_id;

  -- Calculate compliance
  RETURN QUERY
  WITH required_vaccines AS (
    SELECT
      dvr.vaccine_code,
      dvr.vaccine_name,
      dvr.required_doses,
      dvr.dose_interval_days
    FROM dcf_vaccine_requirements dvr
    WHERE dvr.is_active = true
      AND v_child_age_months >= dvr.min_age_months
      AND (dvr.max_age_months IS NULL OR v_child_age_months <= dvr.max_age_months)
  ),
  completed_vaccines AS (
    SELECT
      ir.vaccine_code,
      COUNT(*) as doses_received,
      MAX(ir.date_administered) as last_dose_date
    FROM immunization_records ir
    WHERE ir.child_id = p_child_id
      AND ir.status IN ('verified', 'pending')
    GROUP BY ir.vaccine_code
  ),
  exempt_vaccines AS (
    SELECT UNNEST(ie.vaccine_codes) as vaccine_code
    FROM immunization_exemptions ie
    WHERE ie.child_id = p_child_id
      AND ie.status = 'active'
      AND (ie.end_date IS NULL OR ie.end_date > CURRENT_DATE)
  )
  SELECT
    (COUNT(*) FILTER (WHERE cv.doses_received >= rv.required_doses OR ev.vaccine_code IS NOT NULL) = COUNT(*))::BOOLEAN as is_compliant,
    COUNT(*) FILTER (WHERE cv.doses_received >= rv.required_doses)::INTEGER as vaccines_complete,
    COUNT(*)::INTEGER as vaccines_required,
    COUNT(*) FILTER (WHERE cv.doses_received < rv.required_doses AND ev.vaccine_code IS NULL)::INTEGER as vaccines_overdue,
    (
      SELECT rv2.vaccine_name
      FROM required_vaccines rv2
      LEFT JOIN completed_vaccines cv2 ON rv2.vaccine_code = cv2.vaccine_code
      LEFT JOIN exempt_vaccines ev2 ON rv2.vaccine_code = ev2.vaccine_code
      WHERE (cv2.doses_received IS NULL OR cv2.doses_received < rv2.required_doses)
        AND ev2.vaccine_code IS NULL
      LIMIT 1
    ) as next_due_vaccine,
    CURRENT_DATE + INTERVAL '30 days' as next_due_date
  FROM required_vaccines rv
  LEFT JOIN completed_vaccines cv ON rv.vaccine_code = cv.vaccine_code
  LEFT JOIN exempt_vaccines ev ON rv.vaccine_code = ev.vaccine_code;
END;
$$ LANGUAGE plpgsql;

-- Function to update compliance after immunization record changes
CREATE OR REPLACE FUNCTION update_immunization_compliance()
RETURNS TRIGGER AS $$
DECLARE
  v_compliance RECORD;
  v_org_id UUID;
BEGIN
  -- Get organization_id
  v_org_id := COALESCE(NEW.organization_id, OLD.organization_id);

  -- Calculate new compliance
  SELECT * INTO v_compliance
  FROM calculate_immunization_compliance(COALESCE(NEW.child_id, OLD.child_id));

  -- Upsert compliance record
  INSERT INTO immunization_compliance (
    organization_id,
    child_id,
    compliance_status,
    vaccines_complete,
    vaccines_required,
    vaccines_overdue,
    next_due_vaccine,
    next_due_date,
    last_checked_at,
    updated_at
  )
  VALUES (
    v_org_id,
    COALESCE(NEW.child_id, OLD.child_id),
    CASE
      WHEN v_compliance.is_compliant THEN 'compliant'
      WHEN v_compliance.vaccines_overdue > 0 THEN 'overdue'
      ELSE 'incomplete'
    END,
    v_compliance.vaccines_complete,
    v_compliance.vaccines_required,
    v_compliance.vaccines_overdue,
    v_compliance.next_due_vaccine,
    v_compliance.next_due_date,
    NOW(),
    NOW()
  )
  ON CONFLICT (organization_id, child_id)
  DO UPDATE SET
    compliance_status = CASE
      WHEN v_compliance.is_compliant THEN 'compliant'
      WHEN v_compliance.vaccines_overdue > 0 THEN 'overdue'
      ELSE 'incomplete'
    END,
    vaccines_complete = v_compliance.vaccines_complete,
    vaccines_required = v_compliance.vaccines_required,
    vaccines_overdue = v_compliance.vaccines_overdue,
    next_due_vaccine = v_compliance.next_due_vaccine,
    next_due_date = v_compliance.next_due_date,
    last_checked_at = NOW(),
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for compliance update
DROP TRIGGER IF EXISTS update_compliance_trigger ON immunization_records;
CREATE TRIGGER update_compliance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON immunization_records
  FOR EACH ROW
  EXECUTE FUNCTION update_immunization_compliance();

-- Function to get organization immunization summary
CREATE OR REPLACE FUNCTION get_organization_immunization_summary(p_organization_id UUID)
RETURNS TABLE (
  total_children INTEGER,
  fully_compliant INTEGER,
  incomplete INTEGER,
  overdue INTEGER,
  exempt INTEGER,
  provisional INTEGER,
  compliance_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT c.id)::INTEGER as total_children,
    COUNT(DISTINCT c.id) FILTER (WHERE ic.compliance_status = 'compliant')::INTEGER as fully_compliant,
    COUNT(DISTINCT c.id) FILTER (WHERE ic.compliance_status = 'incomplete')::INTEGER as incomplete,
    COUNT(DISTINCT c.id) FILTER (WHERE ic.compliance_status = 'overdue')::INTEGER as overdue,
    COUNT(DISTINCT c.id) FILTER (WHERE ic.compliance_status = 'exempt')::INTEGER as exempt,
    COUNT(DISTINCT c.id) FILTER (WHERE ic.provisional_enrollment = true)::INTEGER as provisional,
    CASE
      WHEN COUNT(DISTINCT c.id) > 0 THEN
        ROUND(
          COUNT(DISTINCT c.id) FILTER (WHERE ic.compliance_status IN ('compliant', 'exempt'))::DECIMAL /
          COUNT(DISTINCT c.id)::DECIMAL * 100,
          1
        )
      ELSE 0
    END as compliance_rate
  FROM children c
  LEFT JOIN immunization_compliance ic ON c.id = ic.child_id
  WHERE c.organization_id = p_organization_id
    AND c.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Views
-- =====================================================

-- View: Children needing immunizations
CREATE OR REPLACE VIEW children_immunization_status AS
SELECT
  c.id as child_id,
  c.organization_id,
  c.first_name,
  c.last_name,
  c.date_of_birth,
  EXTRACT(YEAR FROM age(NOW(), c.date_of_birth)) * 12 +
    EXTRACT(MONTH FROM age(NOW(), c.date_of_birth)) as age_months,
  ic.compliance_status,
  ic.vaccines_complete,
  ic.vaccines_required,
  ic.vaccines_overdue,
  ic.next_due_vaccine,
  ic.next_due_date,
  ic.provisional_enrollment,
  ic.provisional_end_date,
  ic.last_checked_at
FROM children c
LEFT JOIN immunization_compliance ic ON c.id = ic.child_id
WHERE c.status = 'active';

-- View: Overdue immunizations report
CREATE OR REPLACE VIEW overdue_immunizations AS
SELECT
  ir.organization_id,
  c.id as child_id,
  c.first_name || ' ' || c.last_name as child_name,
  c.date_of_birth,
  dvr.vaccine_name,
  dvr.vaccine_code,
  dvr.required_doses,
  COALESCE(doses.doses_given, 0) as doses_given,
  dvr.required_doses - COALESCE(doses.doses_given, 0) as doses_needed
FROM children c
JOIN dcf_vaccine_requirements dvr ON dvr.is_active = true
LEFT JOIN (
  SELECT
    child_id,
    vaccine_code,
    COUNT(*) as doses_given
  FROM immunization_records
  WHERE status IN ('verified', 'pending')
  GROUP BY child_id, vaccine_code
) doses ON c.id = doses.child_id AND dvr.vaccine_code = doses.vaccine_code
LEFT JOIN (
  SELECT child_id, UNNEST(vaccine_codes) as vaccine_code
  FROM immunization_exemptions
  WHERE status = 'active'
) exemptions ON c.id = exemptions.child_id AND dvr.vaccine_code = exemptions.vaccine_code
CROSS JOIN LATERAL (
  SELECT c.organization_id as ir_org_id
) ir
WHERE c.status = 'active'
  AND exemptions.vaccine_code IS NULL
  AND COALESCE(doses.doses_given, 0) < dvr.required_doses
  AND (
    EXTRACT(YEAR FROM age(NOW(), c.date_of_birth)) * 12 +
    EXTRACT(MONTH FROM age(NOW(), c.date_of_birth))
  ) >= dvr.min_age_months
  AND (
    dvr.max_age_months IS NULL OR
    (EXTRACT(YEAR FROM age(NOW(), c.date_of_birth)) * 12 +
    EXTRACT(MONTH FROM age(NOW(), c.date_of_birth))) <= dvr.max_age_months
  );

-- =====================================================
-- Triggers for updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_immunization_records_updated_at ON immunization_records;
CREATE TRIGGER update_immunization_records_updated_at
  BEFORE UPDATE ON immunization_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_immunization_exemptions_updated_at ON immunization_exemptions;
CREATE TRIGGER update_immunization_exemptions_updated_at
  BEFORE UPDATE ON immunization_exemptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_immunization_compliance_updated_at ON immunization_compliance;
CREATE TRIGGER update_immunization_compliance_updated_at
  BEFORE UPDATE ON immunization_compliance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dcf_vaccine_requirements_updated_at ON dcf_vaccine_requirements;
CREATE TRIGGER update_dcf_vaccine_requirements_updated_at
  BEFORE UPDATE ON dcf_vaccine_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE dcf_vaccine_requirements IS 'Florida DCF required vaccines by age group';
COMMENT ON TABLE immunization_records IS 'Individual vaccine administration records per child';
COMMENT ON TABLE immunization_exemptions IS 'Medical and religious vaccine exemptions';
COMMENT ON TABLE immunization_compliance IS 'Overall immunization compliance status per child';
COMMENT ON TABLE immunization_reminders IS 'Scheduled reminders for upcoming vaccines';

-- =====================================================
-- MIGRATION 010: VPK & School Readiness Programs
-- =====================================================
-- Florida VPK and School Readiness (SR) program management

-- =====================================================
-- VPK Program
-- =====================================================

-- VPK enrollment records
CREATE TABLE IF NOT EXISTS vpk_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  -- School year
  school_year TEXT NOT NULL, -- '2025-2026'

  -- VPK certificate info
  certificate_number TEXT,
  certificate_issue_date DATE,
  certificate_expiration_date DATE,

  -- Program type
  program_type TEXT NOT NULL DEFAULT 'school_year', -- 'school_year' (540 hrs) or 'summer' (300 hrs)
  required_hours INTEGER GENERATED ALWAYS AS (
    CASE program_type
      WHEN 'school_year' THEN 540
      WHEN 'summer' THEN 300
      ELSE 540
    END
  ) STORED,

  -- Enrollment dates
  enrollment_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'withdrawn', 'transferred'
  withdrawal_date DATE,
  withdrawal_reason TEXT,
  transfer_to TEXT, -- Provider name if transferred

  -- Hours tracking
  hours_completed DECIMAL(10,2) DEFAULT 0,
  hours_remaining DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE program_type
      WHEN 'school_year' THEN GREATEST(0, 540 - hours_completed)
      WHEN 'summer' THEN GREATEST(0, 300 - hours_completed)
      ELSE GREATEST(0, 540 - hours_completed)
    END
  ) STORED,
  is_hours_complete BOOLEAN GENERATED ALWAYS AS (
    hours_completed >= CASE program_type
      WHEN 'school_year' THEN 540
      WHEN 'summer' THEN 300
      ELSE 540
    END
  ) STORED,

  -- ELC (Early Learning Coalition) info
  elc_region TEXT,
  elc_case_number TEXT,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, child_id, school_year)
);

CREATE INDEX IF NOT EXISTS idx_vpk_enrollments_org ON vpk_enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_vpk_enrollments_child ON vpk_enrollments(child_id);
CREATE INDEX IF NOT EXISTS idx_vpk_enrollments_year ON vpk_enrollments(school_year);
CREATE INDEX IF NOT EXISTS idx_vpk_enrollments_status ON vpk_enrollments(status);

-- VPK attendance/hours tracking
CREATE TABLE IF NOT EXISTS vpk_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vpk_enrollment_id UUID NOT NULL REFERENCES vpk_enrollments(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Hours (VPK is typically 3 hours/day for school year, 6 hours/day for summer)
  hours DECIMAL(4,2) NOT NULL,

  -- Linked to general attendance
  attendance_id UUID REFERENCES attendance(id),

  recorded_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vpk_enrollment_id, date)
);

CREATE INDEX IF NOT EXISTS idx_vpk_attendance_enrollment ON vpk_attendance(vpk_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_vpk_attendance_date ON vpk_attendance(date);

-- =====================================================
-- VPK Assessments (AP1, AP2, AP3)
-- =====================================================

-- VPK assessment periods
CREATE TABLE IF NOT EXISTS vpk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vpk_enrollment_id UUID NOT NULL REFERENCES vpk_enrollments(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  school_year TEXT NOT NULL,

  -- Assessment period: AP1 (Fall), AP2 (Winter - only for probation), AP3 (Spring)
  assessment_period TEXT NOT NULL, -- 'AP1', 'AP2', 'AP3'

  -- Assessment dates
  assessment_date DATE NOT NULL,
  administered_by UUID REFERENCES profiles(id),

  -- Florida VPK Assessment domains
  -- Print Knowledge
  print_knowledge_score INTEGER, -- Raw score
  print_knowledge_percentile INTEGER,

  -- Phonological Awareness
  phonological_awareness_score INTEGER,
  phonological_awareness_percentile INTEGER,

  -- Mathematics
  mathematics_score INTEGER,
  mathematics_percentile INTEGER,

  -- Oral Language/Vocabulary
  oral_language_score INTEGER,
  oral_language_percentile INTEGER,

  -- Composite/Total score
  total_score INTEGER,
  total_percentile INTEGER,

  -- Kindergarten readiness indicator
  kindergarten_ready BOOLEAN,

  -- Notes
  observations TEXT,
  recommendations TEXT,
  parent_conference_date DATE,
  parent_conference_notes TEXT,

  -- Submission status
  submitted_to_elc BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  elc_confirmation TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vpk_enrollment_id, assessment_period)
);

CREATE INDEX IF NOT EXISTS idx_vpk_assessments_enrollment ON vpk_assessments(vpk_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_vpk_assessments_period ON vpk_assessments(assessment_period);

-- =====================================================
-- School Readiness Program (SR)
-- =====================================================

-- School Readiness enrollment
CREATE TABLE IF NOT EXISTS sr_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id),

  -- Program dates
  school_year TEXT NOT NULL, -- '2025-2026'
  enrollment_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,

  -- Eligibility
  eligibility_type TEXT NOT NULL, -- 'at_risk', 'economic_self_sufficiency', 'protective_services', 'working_poor'
  eligibility_start_date DATE NOT NULL,
  eligibility_end_date DATE,
  redetermination_date DATE,

  -- ELC info
  elc_region TEXT,
  elc_case_number TEXT,
  elc_worker_name TEXT,
  elc_worker_phone TEXT,

  -- Parent work/school info (required for eligibility)
  parent1_activity TEXT, -- 'employed', 'student', 'job_training'
  parent1_employer TEXT,
  parent1_work_hours INTEGER,
  parent2_activity TEXT,
  parent2_employer TEXT,
  parent2_work_hours INTEGER,

  -- Care schedule
  authorized_hours_weekly DECIMAL(4,1),
  care_schedule JSONB, -- {monday: {start: '7:00', end: '17:00'}, ...}

  -- Co-pay
  copay_amount DECIMAL(10,2) DEFAULT 0,
  copay_frequency TEXT DEFAULT 'weekly', -- 'weekly', 'biweekly', 'monthly'

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'pending', 'suspended', 'terminated'
  status_change_date DATE,
  status_change_reason TEXT,

  -- Attendance tracking
  total_absences INTEGER DEFAULT 0,
  consecutive_absences INTEGER DEFAULT 0,
  absence_warning_sent BOOLEAN DEFAULT false,
  absence_warning_date DATE,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, child_id, school_year)
);

CREATE INDEX IF NOT EXISTS idx_sr_enrollments_org ON sr_enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_sr_enrollments_child ON sr_enrollments(child_id);
CREATE INDEX IF NOT EXISTS idx_sr_enrollments_status ON sr_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_sr_enrollments_redetermination ON sr_enrollments(redetermination_date);

-- School Readiness attendance tracking
CREATE TABLE IF NOT EXISTS sr_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sr_enrollment_id UUID NOT NULL REFERENCES sr_enrollments(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Attendance
  check_in_time TIME,
  check_out_time TIME,
  hours DECIMAL(4,2),

  -- Absence handling
  is_absent BOOLEAN DEFAULT false,
  absence_reason TEXT, -- 'illness', 'family_emergency', 'vacation', 'no_show'
  absence_documented BOOLEAN DEFAULT false,

  -- Linked to general attendance
  attendance_id UUID REFERENCES attendance(id),

  recorded_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sr_enrollment_id, date)
);

CREATE INDEX IF NOT EXISTS idx_sr_attendance_enrollment ON sr_attendance(sr_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sr_attendance_date ON sr_attendance(date);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE vpk_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpk_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sr_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sr_attendance ENABLE ROW LEVEL SECURITY;

-- VPK Enrollments policies
CREATE POLICY "Users can view VPK enrollments in their organization"
  ON vpk_enrollments FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Directors can manage VPK enrollments"
  ON vpk_enrollments FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- VPK Attendance policies
CREATE POLICY "Users can view VPK attendance in their organization"
  ON vpk_attendance FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage VPK attendance"
  ON vpk_attendance FOR ALL
  USING (organization_id = get_user_organization_id());

-- VPK Assessments policies
CREATE POLICY "Users can view VPK assessments in their organization"
  ON vpk_assessments FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Directors can manage VPK assessments"
  ON vpk_assessments FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- SR Enrollments policies
CREATE POLICY "Users can view SR enrollments in their organization"
  ON sr_enrollments FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Directors can manage SR enrollments"
  ON sr_enrollments FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- SR Attendance policies
CREATE POLICY "Users can view SR attendance in their organization"
  ON sr_attendance FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage SR attendance"
  ON sr_attendance FOR ALL
  USING (organization_id = get_user_organization_id());

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to update VPK hours completed
CREATE OR REPLACE FUNCTION update_vpk_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE vpk_enrollments SET
      hours_completed = COALESCE((
        SELECT SUM(hours) FROM vpk_attendance
        WHERE vpk_enrollment_id = OLD.vpk_enrollment_id
      ), 0),
      updated_at = NOW()
    WHERE id = OLD.vpk_enrollment_id;
    RETURN OLD;
  ELSE
    UPDATE vpk_enrollments SET
      hours_completed = COALESCE((
        SELECT SUM(hours) FROM vpk_attendance
        WHERE vpk_enrollment_id = NEW.vpk_enrollment_id
      ), 0),
      updated_at = NOW()
    WHERE id = NEW.vpk_enrollment_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vpk_hours_trigger ON vpk_attendance;
CREATE TRIGGER update_vpk_hours_trigger
  AFTER INSERT OR UPDATE OR DELETE ON vpk_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_vpk_hours();

-- Function to track SR absences
CREATE OR REPLACE FUNCTION track_sr_absences()
RETURNS TRIGGER AS $$
DECLARE
  v_consecutive INTEGER;
  v_total INTEGER;
BEGIN
  IF NEW.is_absent THEN
    -- Count total absences this month
    SELECT COUNT(*) INTO v_total
    FROM sr_attendance
    WHERE sr_enrollment_id = NEW.sr_enrollment_id
      AND is_absent = true
      AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NEW.date)
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM NEW.date);

    -- Count consecutive absences
    SELECT COUNT(*) INTO v_consecutive
    FROM sr_attendance
    WHERE sr_enrollment_id = NEW.sr_enrollment_id
      AND is_absent = true
      AND date <= NEW.date
      AND date > (
        SELECT COALESCE(MAX(date), '1900-01-01')
        FROM sr_attendance
        WHERE sr_enrollment_id = NEW.sr_enrollment_id
          AND is_absent = false
          AND date < NEW.date
      );

    UPDATE sr_enrollments SET
      total_absences = v_total,
      consecutive_absences = v_consecutive,
      -- Send warning if 3+ consecutive absences
      absence_warning_sent = CASE WHEN v_consecutive >= 3 AND NOT absence_warning_sent THEN true ELSE absence_warning_sent END,
      absence_warning_date = CASE WHEN v_consecutive >= 3 AND NOT absence_warning_sent THEN CURRENT_DATE ELSE absence_warning_date END,
      updated_at = NOW()
    WHERE id = NEW.sr_enrollment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_sr_absences_trigger ON sr_attendance;
CREATE TRIGGER track_sr_absences_trigger
  AFTER INSERT OR UPDATE ON sr_attendance
  FOR EACH ROW
  EXECUTE FUNCTION track_sr_absences();

-- Function to check VPK assessment requirements
CREATE OR REPLACE FUNCTION check_vpk_assessment_status(p_vpk_enrollment_id UUID)
RETURNS TABLE (
  requires_ap1 BOOLEAN,
  ap1_completed BOOLEAN,
  requires_ap2 BOOLEAN,
  ap2_completed BOOLEAN,
  requires_ap3 BOOLEAN,
  ap3_completed BOOLEAN,
  all_required_complete BOOLEAN
) AS $$
DECLARE
  v_provider_on_probation BOOLEAN := false; -- TODO: Add probation tracking to org
BEGIN
  RETURN QUERY
  SELECT
    true as requires_ap1,
    EXISTS(SELECT 1 FROM vpk_assessments WHERE vpk_enrollment_id = p_vpk_enrollment_id AND assessment_period = 'AP1') as ap1_completed,
    v_provider_on_probation as requires_ap2, -- Only required if on probation
    EXISTS(SELECT 1 FROM vpk_assessments WHERE vpk_enrollment_id = p_vpk_enrollment_id AND assessment_period = 'AP2') as ap2_completed,
    true as requires_ap3,
    EXISTS(SELECT 1 FROM vpk_assessments WHERE vpk_enrollment_id = p_vpk_enrollment_id AND assessment_period = 'AP3') as ap3_completed,
    (
      EXISTS(SELECT 1 FROM vpk_assessments WHERE vpk_enrollment_id = p_vpk_enrollment_id AND assessment_period = 'AP1') AND
      EXISTS(SELECT 1 FROM vpk_assessments WHERE vpk_enrollment_id = p_vpk_enrollment_id AND assessment_period = 'AP3') AND
      (NOT v_provider_on_probation OR EXISTS(SELECT 1 FROM vpk_assessments WHERE vpk_enrollment_id = p_vpk_enrollment_id AND assessment_period = 'AP2'))
    ) as all_required_complete;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Views
-- =====================================================

-- View: VPK enrollment summary
CREATE OR REPLACE VIEW vpk_enrollment_summary AS
SELECT
  ve.id,
  ve.organization_id,
  ve.child_id,
  c.first_name || ' ' || c.last_name as child_name,
  ve.school_year,
  ve.program_type,
  ve.required_hours,
  ve.hours_completed,
  ve.hours_remaining,
  ve.is_hours_complete,
  ve.status,
  ve.certificate_number,
  (SELECT COUNT(*) FROM vpk_assessments va WHERE va.vpk_enrollment_id = ve.id) as assessments_completed,
  (SELECT assessment_period FROM vpk_assessments va WHERE va.vpk_enrollment_id = ve.id ORDER BY assessment_date DESC LIMIT 1) as last_assessment,
  CASE
    WHEN ve.hours_completed < ve.required_hours * 0.25 THEN 'beginning'
    WHEN ve.hours_completed < ve.required_hours * 0.50 THEN 'progressing'
    WHEN ve.hours_completed < ve.required_hours * 0.75 THEN 'advancing'
    WHEN ve.hours_completed < ve.required_hours THEN 'near_complete'
    ELSE 'complete'
  END as progress_status
FROM vpk_enrollments ve
JOIN children c ON ve.child_id = c.id;

-- View: SR enrollment summary with eligibility status
CREATE OR REPLACE VIEW sr_enrollment_summary AS
SELECT
  se.id,
  se.organization_id,
  se.child_id,
  c.first_name || ' ' || c.last_name as child_name,
  se.school_year,
  se.eligibility_type,
  se.eligibility_end_date,
  se.redetermination_date,
  se.authorized_hours_weekly,
  se.copay_amount,
  se.copay_frequency,
  se.status,
  se.total_absences,
  se.consecutive_absences,
  se.absence_warning_sent,
  CASE
    WHEN se.redetermination_date < CURRENT_DATE THEN 'overdue'
    WHEN se.redetermination_date < CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
    ELSE 'current'
  END as eligibility_status
FROM sr_enrollments se
JOIN children c ON se.child_id = c.id;

-- View: Upcoming redeterminations
CREATE OR REPLACE VIEW sr_upcoming_redeterminations AS
SELECT
  se.id,
  se.organization_id,
  se.child_id,
  c.first_name || ' ' || c.last_name as child_name,
  f.primary_contact_name as parent_name,
  f.email as parent_email,
  f.phone as parent_phone,
  se.redetermination_date,
  se.elc_case_number,
  se.elc_worker_name,
  se.redetermination_date - CURRENT_DATE as days_until_due
FROM sr_enrollments se
JOIN children c ON se.child_id = c.id
LEFT JOIN families f ON se.family_id = f.id
WHERE se.status = 'active'
  AND se.redetermination_date IS NOT NULL
  AND se.redetermination_date <= CURRENT_DATE + INTERVAL '60 days'
ORDER BY se.redetermination_date;

COMMENT ON TABLE vpk_enrollments IS 'Florida VPK program enrollments (540 hrs school year, 300 hrs summer)';
COMMENT ON TABLE vpk_assessments IS 'VPK assessments (AP1-Fall, AP2-Winter probation only, AP3-Spring)';
COMMENT ON TABLE sr_enrollments IS 'School Readiness program enrollments with eligibility tracking';
COMMENT ON TABLE sr_attendance IS 'School Readiness daily attendance and absence tracking';

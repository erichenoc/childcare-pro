-- =====================================================
-- MIGRATION 006: Attendance System Expansion
-- =====================================================
-- Enhanced check-in/check-out with pickup validation

-- Expand attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  -- Check-in details
  check_in_guardian_id UUID REFERENCES guardians(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_in_authorized_pickup_id UUID REFERENCES authorized_pickups(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_in_person_name TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_in_person_relationship TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_in_method TEXT DEFAULT 'manual'; -- 'manual', 'kiosk', 'app'
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_in_photo_url TEXT; -- Optional photo at check-in

-- Check-out details
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_out_guardian_id UUID REFERENCES guardians(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_out_authorized_pickup_id UUID REFERENCES authorized_pickups(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_out_person_name TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_out_person_relationship TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_out_verified BOOLEAN DEFAULT false;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_out_verification_method TEXT; -- 'id_verified', 'photo_match', 'known_person'
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_out_method TEXT DEFAULT 'manual';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_out_photo_url TEXT;

-- Health screening at check-in
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  check_in_temperature DECIMAL(4,1);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  temperature_unit TEXT DEFAULT 'F';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  health_screening_passed BOOLEAN DEFAULT true;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  health_screening_notes TEXT;

-- Notes from parent
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  parent_drop_off_notes TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  parent_pickup_notes TEXT;

-- Tracking
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS
  total_hours DECIMAL(5,2); -- Calculated after check-out

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_guardian ON attendance(check_in_guardian_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_out_guardian ON attendance(check_out_guardian_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_method ON attendance(check_in_method);

-- =====================================================
-- Pickup Verification & Blocking
-- =====================================================

-- Table to log unauthorized pickup attempts
CREATE TABLE IF NOT EXISTS unauthorized_pickup_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  attempted_by_name TEXT NOT NULL,
  attempted_by_phone TEXT,
  attempted_by_relationship TEXT,

  staff_id UUID REFERENCES profiles(id), -- Staff who was on duty
  blocked_by UUID REFERENCES profiles(id), -- Staff who blocked the attempt

  reason TEXT NOT NULL, -- 'not_in_authorized_list', 'expired_authorization', 'custody_restriction'

  admin_notified BOOLEAN DEFAULT false,
  admin_notified_at TIMESTAMPTZ,

  resolution TEXT, -- 'parent_contacted', 'police_called', 'resolved_ok'
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unauthorized_attempts_org ON unauthorized_pickup_attempts(organization_id);
CREATE INDEX IF NOT EXISTS idx_unauthorized_attempts_child ON unauthorized_pickup_attempts(child_id);
CREATE INDEX IF NOT EXISTS idx_unauthorized_attempts_date ON unauthorized_pickup_attempts(created_at);

-- RLS for unauthorized_pickup_attempts
ALTER TABLE unauthorized_pickup_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view unauthorized attempts"
  ON unauthorized_pickup_attempts FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can create unauthorized attempts"
  ON unauthorized_pickup_attempts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Directors can update unauthorized attempts"
  ON unauthorized_pickup_attempts FOR UPDATE
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- =====================================================
-- Attendance Validation Functions
-- =====================================================

-- Function to validate and record check-in
CREATE OR REPLACE FUNCTION record_check_in(
  p_child_id UUID,
  p_classroom_id UUID,
  p_brought_by_type TEXT, -- 'guardian', 'authorized', 'emergency_contact'
  p_brought_by_id UUID,
  p_staff_id UUID,
  p_temperature DECIMAL DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_method TEXT DEFAULT 'manual'
)
RETURNS TABLE (
  success BOOLEAN,
  attendance_id UUID,
  message TEXT
) AS $$
DECLARE
  v_org_id UUID;
  v_person RECORD;
  v_attendance_id UUID;
  v_existing_attendance UUID;
BEGIN
  -- Get organization ID
  SELECT organization_id INTO v_org_id FROM children WHERE id = p_child_id;

  -- Check if already checked in today
  SELECT id INTO v_existing_attendance
  FROM attendance
  WHERE child_id = p_child_id
    AND date = CURRENT_DATE
    AND check_out_time IS NULL;

  IF v_existing_attendance IS NOT NULL THEN
    success := false;
    attendance_id := v_existing_attendance;
    message := 'Child is already checked in today';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Validate the person bringing the child
  SELECT * INTO v_person
  FROM validate_pickup_person(p_child_id, p_brought_by_type, p_brought_by_id);

  -- Insert attendance record
  INSERT INTO attendance (
    organization_id, child_id, classroom_id, date,
    check_in_time, checked_in_by,
    check_in_guardian_id, check_in_authorized_pickup_id,
    check_in_person_name, check_in_person_relationship,
    check_in_method, check_in_temperature, temperature_unit,
    parent_drop_off_notes, status
  ) VALUES (
    v_org_id, p_child_id, p_classroom_id, CURRENT_DATE,
    NOW(), p_staff_id,
    CASE WHEN p_brought_by_type = 'guardian' THEN p_brought_by_id ELSE NULL END,
    CASE WHEN p_brought_by_type = 'authorized' THEN p_brought_by_id ELSE NULL END,
    v_person.person_name, v_person.relationship,
    p_method, p_temperature, 'F',
    p_notes, 'present'
  )
  RETURNING id INTO v_attendance_id;

  success := true;
  attendance_id := v_attendance_id;
  message := 'Check-in recorded successfully';
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and record check-out
CREATE OR REPLACE FUNCTION record_check_out(
  p_child_id UUID,
  p_picked_up_by_type TEXT, -- 'guardian', 'authorized', 'emergency_contact'
  p_picked_up_by_id UUID,
  p_staff_id UUID,
  p_verified BOOLEAN DEFAULT false,
  p_verification_method TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_method TEXT DEFAULT 'manual'
)
RETURNS TABLE (
  success BOOLEAN,
  attendance_id UUID,
  message TEXT,
  blocked BOOLEAN
) AS $$
DECLARE
  v_org_id UUID;
  v_person RECORD;
  v_attendance_id UUID;
  v_check_in_time TIMESTAMPTZ;
  v_total_hours DECIMAL;
BEGIN
  -- Get organization ID
  SELECT organization_id INTO v_org_id FROM children WHERE id = p_child_id;

  -- Find today's attendance record
  SELECT id, check_in_time INTO v_attendance_id, v_check_in_time
  FROM attendance
  WHERE child_id = p_child_id
    AND date = CURRENT_DATE
    AND check_out_time IS NULL;

  IF v_attendance_id IS NULL THEN
    success := false;
    message := 'Child is not checked in today';
    blocked := false;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Validate the person picking up
  SELECT * INTO v_person
  FROM validate_pickup_person(p_child_id, p_picked_up_by_type, p_picked_up_by_id);

  -- CRITICAL: Block if not authorized
  IF NOT v_person.is_valid THEN
    -- Log the unauthorized attempt
    INSERT INTO unauthorized_pickup_attempts (
      organization_id, child_id,
      attempted_by_name, attempted_by_relationship,
      staff_id, reason
    ) VALUES (
      v_org_id, p_child_id,
      COALESCE(v_person.person_name, 'Unknown'),
      COALESCE(v_person.relationship, 'Unknown'),
      p_staff_id,
      v_person.message
    );

    success := false;
    attendance_id := v_attendance_id;
    message := 'UNAUTHORIZED PICKUP BLOCKED: ' || v_person.message;
    blocked := true;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Calculate total hours
  v_total_hours := EXTRACT(EPOCH FROM (NOW() - v_check_in_time)) / 3600;

  -- Update attendance record
  UPDATE attendance SET
    check_out_time = NOW(),
    checked_out_by = p_staff_id,
    check_out_guardian_id = CASE WHEN p_picked_up_by_type = 'guardian' THEN p_picked_up_by_id ELSE NULL END,
    check_out_authorized_pickup_id = CASE WHEN p_picked_up_by_type = 'authorized' THEN p_picked_up_by_id ELSE NULL END,
    check_out_person_name = v_person.person_name,
    check_out_person_relationship = v_person.relationship,
    check_out_verified = p_verified,
    check_out_verification_method = p_verification_method,
    check_out_method = p_method,
    parent_pickup_notes = p_notes,
    total_hours = v_total_hours
  WHERE id = v_attendance_id;

  -- Update authorized pickup usage count if applicable
  IF p_picked_up_by_type = 'authorized' THEN
    UPDATE authorized_pickups SET
      times_used = times_used + 1,
      last_pickup_at = NOW()
    WHERE id = p_picked_up_by_id;
  END IF;

  success := true;
  attendance_id := v_attendance_id;
  message := 'Check-out recorded successfully. Total hours: ' || ROUND(v_total_hours, 2);
  blocked := false;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Attendance Views
-- =====================================================

-- View: Today's attendance by classroom
CREATE OR REPLACE VIEW today_attendance_by_classroom AS
SELECT
  c.id as classroom_id,
  c.name as classroom_name,
  c.capacity as classroom_capacity,
  COUNT(a.id) FILTER (WHERE a.check_out_time IS NULL) as children_present,
  COUNT(a.id) FILTER (WHERE a.check_out_time IS NOT NULL) as children_checked_out,
  (SELECT COUNT(*) FROM children ch WHERE ch.classroom_id = c.id AND ch.status = 'active') as total_enrolled,
  c.organization_id
FROM classrooms c
LEFT JOIN attendance a ON a.classroom_id = c.id AND a.date = CURRENT_DATE
WHERE c.status = 'active'
GROUP BY c.id, c.name, c.capacity, c.organization_id;

-- View: Child attendance for the month
CREATE OR REPLACE VIEW monthly_attendance_summary AS
SELECT
  ch.id as child_id,
  ch.first_name,
  ch.last_name,
  ch.classroom_id,
  DATE_TRUNC('month', a.date) as month,
  COUNT(*) FILTER (WHERE a.status = 'present') as days_present,
  COUNT(*) FILTER (WHERE a.status = 'absent') as days_absent,
  COUNT(*) FILTER (WHERE a.status = 'late') as days_late,
  SUM(a.total_hours) as total_hours,
  AVG(a.total_hours) as avg_hours_per_day,
  ch.organization_id
FROM children ch
LEFT JOIN attendance a ON a.child_id = ch.id
WHERE ch.status = 'active'
GROUP BY ch.id, ch.first_name, ch.last_name, ch.classroom_id, DATE_TRUNC('month', a.date), ch.organization_id;

COMMENT ON TABLE unauthorized_pickup_attempts IS 'Log of blocked unauthorized pickup attempts';
COMMENT ON FUNCTION record_check_in IS 'Records child check-in with validation';
COMMENT ON FUNCTION record_check_out IS 'Records child check-out with pickup authorization validation';

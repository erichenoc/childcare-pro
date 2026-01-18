-- =====================================================
-- MIGRATION 007: Incidents Expansion with Signature
-- =====================================================
-- Enhanced incident reporting with mandatory parent signature

-- Expand incidents table
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  -- Reporting teacher (REQUIRED)
  reporting_teacher_id UUID REFERENCES profiles(id);

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  -- Witnesses
  witness_staff_ids UUID[] DEFAULT '{}';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  witness_names TEXT[]; -- For non-staff witnesses

-- Parent notification details
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  parent_notified_method TEXT; -- 'phone', 'in_person', 'email', 'text'
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  parent_notified_by UUID REFERENCES profiles(id);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  parent_response TEXT;

-- Parent signature (MANDATORY for closure)
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  parent_signature_data TEXT; -- Base64 canvas signature
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  parent_signature_url TEXT; -- Stored image URL
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  parent_signed_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  parent_signed_by_name TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  parent_signed_by_relationship TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  signature_ip_address INET;

-- Document copies
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  pdf_url TEXT; -- Generated PDF
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  daycare_copy_url TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  parent_copy_url TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  parent_copy_sent BOOLEAN DEFAULT false;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  parent_copy_sent_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  parent_copy_sent_method TEXT; -- 'email', 'printed', 'both'

-- Follow-up tracking
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  follow_up_date DATE;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  follow_up_completed BOOLEAN DEFAULT false;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  follow_up_completed_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  follow_up_completed_by UUID REFERENCES profiles(id);

-- Closure
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  status TEXT DEFAULT 'open'; -- 'open', 'pending_signature', 'closed'
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  closed_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  closed_by UUID REFERENCES profiles(id);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  closure_notes TEXT;

-- Incident number for reference
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS
  incident_number TEXT;

-- Create index for incident number
CREATE INDEX IF NOT EXISTS idx_incidents_number ON incidents(incident_number);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_reporting_teacher ON incidents(reporting_teacher_id);

-- =====================================================
-- Incident Number Generator
-- =====================================================

-- Function to generate incident number
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_count INTEGER;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_month := TO_CHAR(CURRENT_DATE, 'MM');

  SELECT COUNT(*) + 1 INTO v_count
  FROM incidents
  WHERE organization_id = NEW.organization_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE);

  NEW.incident_number := 'INC-' || v_year || v_month || '-' || LPAD(v_count::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for incident number
DROP TRIGGER IF EXISTS generate_incident_number_trigger ON incidents;
CREATE TRIGGER generate_incident_number_trigger
  BEFORE INSERT ON incidents
  FOR EACH ROW
  WHEN (NEW.incident_number IS NULL)
  EXECUTE FUNCTION generate_incident_number();

-- =====================================================
-- Signature Validation
-- =====================================================

-- Function to validate incident can be closed (signature required)
CREATE OR REPLACE FUNCTION validate_incident_closure()
RETURNS TRIGGER AS $$
BEGIN
  -- If trying to close the incident
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    -- Check for parent signature
    IF NEW.parent_signature_url IS NULL AND NEW.parent_signature_data IS NULL THEN
      RAISE EXCEPTION 'Cannot close incident: Parent signature is REQUIRED. Incident # %', NEW.incident_number;
    END IF;

    -- Set closure timestamp if not set
    IF NEW.closed_at IS NULL THEN
      NEW.closed_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for closure validation
DROP TRIGGER IF EXISTS validate_incident_closure_trigger ON incidents;
CREATE TRIGGER validate_incident_closure_trigger
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION validate_incident_closure();

-- Function to record parent signature
CREATE OR REPLACE FUNCTION record_incident_signature(
  p_incident_id UUID,
  p_signature_data TEXT, -- Base64 encoded signature
  p_signed_by_name TEXT,
  p_signed_by_relationship TEXT,
  p_ip_address INET DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  signed_at TIMESTAMPTZ
) AS $$
DECLARE
  v_incident RECORD;
BEGIN
  -- Get incident
  SELECT * INTO v_incident FROM incidents WHERE id = p_incident_id;

  IF v_incident IS NULL THEN
    success := false;
    message := 'Incident not found';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_incident.parent_signature_url IS NOT NULL OR v_incident.parent_signature_data IS NOT NULL THEN
    success := false;
    message := 'Incident already has a signature';
    signed_at := v_incident.parent_signed_at;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Update incident with signature
  UPDATE incidents SET
    parent_signature_data = p_signature_data,
    parent_signed_at = NOW(),
    parent_signed_by_name = p_signed_by_name,
    parent_signed_by_relationship = p_signed_by_relationship,
    signature_ip_address = p_ip_address,
    status = 'pending_closure'
  WHERE id = p_incident_id;

  success := true;
  message := 'Signature recorded successfully';
  signed_at := NOW();
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Incident Report View
-- =====================================================

-- Complete incident view for reporting
CREATE OR REPLACE VIEW incident_report_view AS
SELECT
  i.id,
  i.incident_number,
  i.organization_id,
  i.child_id,
  ch.first_name as child_first_name,
  ch.last_name as child_last_name,
  ch.date_of_birth as child_dob,
  c.name as classroom_name,
  i.incident_type,
  i.severity,
  i.occurred_at,
  i.location,
  i.description,
  i.action_taken,
  i.reporting_teacher_id,
  CONCAT(rt.first_name, ' ', rt.last_name) as reported_by_name,
  i.witness_staff_ids,
  (
    SELECT ARRAY_AGG(CONCAT(p.first_name, ' ', p.last_name))
    FROM profiles p
    WHERE p.id = ANY(i.witness_staff_ids)
  ) as witness_names_staff,
  i.witness_names,
  i.parent_notified,
  i.parent_notified_at,
  i.parent_notified_method,
  i.parent_signature_url IS NOT NULL OR i.parent_signature_data IS NOT NULL as has_signature,
  i.parent_signed_at,
  i.parent_signed_by_name,
  i.parent_signed_by_relationship,
  i.status,
  i.follow_up_required,
  i.follow_up_date,
  i.follow_up_completed,
  i.attachments,
  i.pdf_url,
  i.created_at,
  i.updated_at,
  -- Organization info for header
  o.name as organization_name,
  o.address as organization_address,
  o.city as organization_city,
  o.state as organization_state,
  o.phone as organization_phone,
  o.logo_url as organization_logo
FROM incidents i
JOIN children ch ON i.child_id = ch.id
LEFT JOIN classrooms c ON i.classroom_id = c.id
LEFT JOIN profiles rt ON i.reporting_teacher_id = rt.id
LEFT JOIN organizations o ON i.organization_id = o.id;

COMMENT ON FUNCTION record_incident_signature IS 'Records parent digital signature on incident report';
COMMENT ON FUNCTION validate_incident_closure IS 'Ensures incident cannot be closed without parent signature';

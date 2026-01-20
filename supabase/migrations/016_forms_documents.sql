-- =====================================================
-- MIGRATION 016: Forms & Documents Module
-- =====================================================
-- Document management with templates, signatures, and expiration tracking
-- DCF required forms, enrollment forms, medical releases, etc.

-- =====================================================
-- Document Templates
-- =====================================================

-- Predefined document templates (system-wide and organization-specific)
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = system template

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'enrollment', 'medical', 'dcf', 'permission', 'emergency', 'financial', 'other'

  -- Template content
  content_type TEXT NOT NULL DEFAULT 'html', -- 'html', 'pdf', 'external_url'
  content TEXT, -- HTML content or external URL
  template_url TEXT, -- URL to downloadable template

  -- Requirements
  requires_signature BOOLEAN DEFAULT false,
  requires_parent_signature BOOLEAN DEFAULT false,
  requires_staff_signature BOOLEAN DEFAULT false,
  requires_witness_signature BOOLEAN DEFAULT false,

  -- Expiration
  has_expiration BOOLEAN DEFAULT false,
  expiration_months INTEGER, -- Months until expiration (NULL = never)

  -- DCF specific
  is_dcf_required BOOLEAN DEFAULT false,
  dcf_form_number TEXT, -- e.g., 'CF-FSP 5219'

  -- Applies to
  applies_to TEXT NOT NULL DEFAULT 'child', -- 'child', 'family', 'staff', 'organization'

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system_template BOOLEAN DEFAULT false, -- Cannot be edited by org

  -- Version control
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES document_templates(id),

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_templates_org ON document_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_doc_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_doc_templates_dcf ON document_templates(is_dcf_required) WHERE is_dcf_required = true;

-- Insert common DCF Florida required forms
INSERT INTO document_templates (
  name, description, category, is_dcf_required, dcf_form_number,
  requires_signature, requires_parent_signature, has_expiration, expiration_months,
  applies_to, is_system_template, is_active
) VALUES
  ('Enrollment Application', 'Initial child enrollment form', 'enrollment', true, 'CF-FSP 5219',
   true, true, false, NULL, 'child', true, true),
  ('Health Exam Report', 'Annual health examination by licensed physician', 'medical', true, 'HRS-H 3040',
   true, false, true, 12, 'child', true, true),
  ('Immunization Certificate', 'Florida Certificate of Immunization', 'medical', true, 'DH 680',
   true, false, true, 12, 'child', true, true),
  ('Emergency Medical Authorization', 'Authorization for emergency medical treatment', 'emergency', true, NULL,
   true, true, true, 12, 'child', true, true),
  ('Transportation Authorization', 'Field trip and transportation consent', 'permission', true, NULL,
   true, true, true, 12, 'child', true, true),
  ('Photo/Media Release', 'Permission to photograph/video for promotional use', 'permission', false, NULL,
   true, true, false, NULL, 'child', true, true),
  ('Authorized Pickup Form', 'List of authorized persons for pickup', 'enrollment', true, NULL,
   true, true, true, 12, 'child', true, true),
  ('Parent Handbook Acknowledgment', 'Acknowledgment of receipt of parent handbook', 'enrollment', true, NULL,
   true, true, false, NULL, 'family', true, true),
  ('Financial Agreement', 'Tuition and payment agreement', 'financial', true, NULL,
   true, true, true, 12, 'family', true, true),
  ('Background Screening Affidavit', 'Level 2 background screening for staff', 'dcf', true, 'CF 1649',
   true, false, true, 60, 'staff', true, true),
  ('Child Abuse Reporting Agreement', 'Acknowledgment of mandatory reporting requirements', 'dcf', true, NULL,
   true, false, false, NULL, 'staff', true, true),
  ('Medication Administration Form', 'Authorization to administer medication', 'medical', true, NULL,
   true, true, true, 12, 'child', true, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Document Records (Completed/Submitted Documents)
-- =====================================================

-- Actual documents associated with entities
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES document_templates(id),

  -- Document info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,

  -- Associated entity
  entity_type TEXT NOT NULL, -- 'child', 'family', 'staff'
  entity_id UUID NOT NULL, -- ID of child, family, or staff

  -- File storage
  file_url TEXT, -- URL to stored document
  file_type TEXT, -- 'pdf', 'image', 'doc'
  file_size INTEGER, -- Size in bytes
  file_name TEXT, -- Original filename

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'approved', 'rejected', 'expired'

  -- Dates
  submitted_at TIMESTAMPTZ,
  effective_date DATE,
  expiration_date DATE,

  -- Verification
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  rejection_reason TEXT,

  -- Metadata
  notes TEXT,
  uploaded_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_template ON documents(template_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_expiration ON documents(expiration_date) WHERE expiration_date IS NOT NULL;

-- =====================================================
-- Document Signatures
-- =====================================================

-- Track signatures on documents
CREATE TABLE IF NOT EXISTS document_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Signer info
  signer_type TEXT NOT NULL, -- 'parent', 'guardian', 'staff', 'witness'
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signer_relationship TEXT, -- 'mother', 'father', 'guardian', 'director', etc.

  -- Signature
  signature_data TEXT, -- Base64 encoded signature image
  signature_ip TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Linked profile (if applicable)
  profile_id UUID REFERENCES profiles(id),
  guardian_id UUID REFERENCES guardians(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signatures_document ON document_signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_signatures_org ON document_signatures(organization_id);

-- =====================================================
-- Document Requests (Pending Documents)
-- =====================================================

-- Track requested documents from parents/staff
CREATE TABLE IF NOT EXISTS document_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES document_templates(id),

  -- Request info
  entity_type TEXT NOT NULL, -- 'child', 'family', 'staff'
  entity_id UUID NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'viewed', 'submitted', 'approved', 'overdue'

  -- Communication
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by UUID REFERENCES profiles(id),
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,

  -- Due date
  due_date DATE,

  -- Resolution
  document_id UUID REFERENCES documents(id), -- Linked when submitted

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_requests_org ON document_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_doc_requests_entity ON document_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_doc_requests_status ON document_requests(status);
CREATE INDEX IF NOT EXISTS idx_doc_requests_due ON document_requests(due_date) WHERE status IN ('pending', 'sent', 'viewed');

-- =====================================================
-- Document Compliance Summary
-- =====================================================

-- Pre-computed compliance status per entity
CREATE TABLE IF NOT EXISTS document_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Status
  compliance_status TEXT NOT NULL DEFAULT 'incomplete', -- 'compliant', 'incomplete', 'overdue', 'pending_review'

  -- Counts
  total_required INTEGER DEFAULT 0,
  total_submitted INTEGER DEFAULT 0,
  total_approved INTEGER DEFAULT 0,
  total_expiring_soon INTEGER DEFAULT 0, -- Within 30 days
  total_expired INTEGER DEFAULT 0,

  -- Details
  missing_documents TEXT[], -- Array of template names
  expiring_documents TEXT[], -- Array of document names with dates

  last_checked_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_doc_compliance_org ON document_compliance(organization_id);
CREATE INDEX IF NOT EXISTS idx_doc_compliance_entity ON document_compliance(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_doc_compliance_status ON document_compliance(compliance_status);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_compliance ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY "Users can view templates in their org or system templates"
  ON document_templates FOR SELECT
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id() OR
    is_system_admin()
  );

CREATE POLICY "Directors can manage org templates"
  ON document_templates FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    is_system_template = false AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Documents policies
CREATE POLICY "Users can view documents in their organization"
  ON documents FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can create documents"
  ON documents FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Staff can update documents"
  ON documents FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Directors can delete documents"
  ON documents FOR DELETE
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Signatures policies
CREATE POLICY "Users can view signatures in their organization"
  ON document_signatures FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Anyone can create signatures"
  ON document_signatures FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- Requests policies
CREATE POLICY "Users can view requests in their organization"
  ON document_requests FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage requests"
  ON document_requests FOR ALL
  USING (organization_id = get_user_organization_id());

-- Compliance policies
CREATE POLICY "Users can view compliance in their organization"
  ON document_compliance FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "System can update compliance"
  ON document_compliance FOR ALL
  USING (organization_id = get_user_organization_id());

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to check if a document is expiring soon
CREATE OR REPLACE FUNCTION is_document_expiring_soon(
  p_expiration_date DATE,
  p_days_threshold INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_expiration_date IS NULL THEN
    RETURN false;
  END IF;
  RETURN p_expiration_date <= (CURRENT_DATE + (p_days_threshold || ' days')::INTERVAL);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update document compliance for an entity
CREATE OR REPLACE FUNCTION update_document_compliance(
  p_organization_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_required_templates RECORD;
  v_total_required INTEGER := 0;
  v_total_submitted INTEGER := 0;
  v_total_approved INTEGER := 0;
  v_total_expiring INTEGER := 0;
  v_total_expired INTEGER := 0;
  v_missing TEXT[] := ARRAY[]::TEXT[];
  v_expiring TEXT[] := ARRAY[]::TEXT[];
  v_status TEXT;
BEGIN
  -- Get required templates for this entity type
  FOR v_required_templates IN
    SELECT dt.id, dt.name
    FROM document_templates dt
    WHERE dt.is_active = true
      AND dt.applies_to = p_entity_type
      AND dt.is_dcf_required = true
      AND (dt.organization_id IS NULL OR dt.organization_id = p_organization_id)
  LOOP
    v_total_required := v_total_required + 1;

    -- Check if document exists and is valid
    IF EXISTS (
      SELECT 1 FROM documents d
      WHERE d.organization_id = p_organization_id
        AND d.entity_type = p_entity_type
        AND d.entity_id = p_entity_id
        AND d.template_id = v_required_templates.id
        AND d.status = 'approved'
        AND (d.expiration_date IS NULL OR d.expiration_date > CURRENT_DATE)
    ) THEN
      v_total_approved := v_total_approved + 1;

      -- Check if expiring soon
      IF EXISTS (
        SELECT 1 FROM documents d
        WHERE d.organization_id = p_organization_id
          AND d.entity_type = p_entity_type
          AND d.entity_id = p_entity_id
          AND d.template_id = v_required_templates.id
          AND d.status = 'approved'
          AND is_document_expiring_soon(d.expiration_date, 30)
      ) THEN
        v_total_expiring := v_total_expiring + 1;
        v_expiring := array_append(v_expiring, v_required_templates.name);
      END IF;
    ELSIF EXISTS (
      SELECT 1 FROM documents d
      WHERE d.organization_id = p_organization_id
        AND d.entity_type = p_entity_type
        AND d.entity_id = p_entity_id
        AND d.template_id = v_required_templates.id
        AND d.status IN ('pending', 'submitted')
    ) THEN
      v_total_submitted := v_total_submitted + 1;
    ELSE
      -- Document is missing or expired
      IF EXISTS (
        SELECT 1 FROM documents d
        WHERE d.organization_id = p_organization_id
          AND d.entity_type = p_entity_type
          AND d.entity_id = p_entity_id
          AND d.template_id = v_required_templates.id
          AND d.status = 'approved'
          AND d.expiration_date < CURRENT_DATE
      ) THEN
        v_total_expired := v_total_expired + 1;
      END IF;
      v_missing := array_append(v_missing, v_required_templates.name);
    END IF;
  END LOOP;

  -- Determine compliance status
  IF v_total_required = 0 THEN
    v_status := 'compliant';
  ELSIF v_total_approved = v_total_required THEN
    v_status := 'compliant';
  ELSIF v_total_expired > 0 THEN
    v_status := 'overdue';
  ELSIF v_total_submitted > 0 THEN
    v_status := 'pending_review';
  ELSE
    v_status := 'incomplete';
  END IF;

  -- Upsert compliance record
  INSERT INTO document_compliance (
    organization_id, entity_type, entity_id,
    compliance_status, total_required, total_submitted, total_approved,
    total_expiring_soon, total_expired, missing_documents, expiring_documents,
    last_checked_at, updated_at
  )
  VALUES (
    p_organization_id, p_entity_type, p_entity_id,
    v_status, v_total_required, v_total_submitted, v_total_approved,
    v_total_expiring, v_total_expired, v_missing, v_expiring,
    NOW(), NOW()
  )
  ON CONFLICT (organization_id, entity_type, entity_id)
  DO UPDATE SET
    compliance_status = v_status,
    total_required = v_total_required,
    total_submitted = v_total_submitted,
    total_approved = v_total_approved,
    total_expiring_soon = v_total_expiring,
    total_expired = v_total_expired,
    missing_documents = v_missing,
    expiring_documents = v_expiring,
    last_checked_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update compliance when documents change
CREATE OR REPLACE FUNCTION trigger_update_document_compliance()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_document_compliance(
    COALESCE(NEW.organization_id, OLD.organization_id),
    COALESCE(NEW.entity_type, OLD.entity_type),
    COALESCE(NEW.entity_id, OLD.entity_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_doc_compliance_trigger ON documents;
CREATE TRIGGER update_doc_compliance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_document_compliance();

-- Function to get organization document summary
CREATE OR REPLACE FUNCTION get_organization_document_summary(p_organization_id UUID)
RETURNS TABLE (
  total_entities INTEGER,
  fully_compliant INTEGER,
  pending_review INTEGER,
  incomplete INTEGER,
  overdue INTEGER,
  compliance_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_entities,
    COUNT(*) FILTER (WHERE dc.compliance_status = 'compliant')::INTEGER as fully_compliant,
    COUNT(*) FILTER (WHERE dc.compliance_status = 'pending_review')::INTEGER as pending_review,
    COUNT(*) FILTER (WHERE dc.compliance_status = 'incomplete')::INTEGER as incomplete,
    COUNT(*) FILTER (WHERE dc.compliance_status = 'overdue')::INTEGER as overdue,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND(COUNT(*) FILTER (WHERE dc.compliance_status = 'compliant')::DECIMAL / COUNT(*)::DECIMAL * 100, 1)
      ELSE 0
    END as compliance_rate
  FROM document_compliance dc
  WHERE dc.organization_id = p_organization_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Views
-- =====================================================

-- View: Expiring documents
CREATE OR REPLACE VIEW expiring_documents AS
SELECT
  d.organization_id,
  d.id as document_id,
  d.name as document_name,
  d.entity_type,
  d.entity_id,
  d.expiration_date,
  d.expiration_date - CURRENT_DATE as days_until_expiration,
  CASE
    WHEN d.entity_type = 'child' THEN (SELECT c.first_name || ' ' || c.last_name FROM children c WHERE c.id = d.entity_id)
    WHEN d.entity_type = 'staff' THEN (SELECT p.first_name || ' ' || p.last_name FROM profiles p WHERE p.id = d.entity_id)
    WHEN d.entity_type = 'family' THEN (SELECT f.name FROM families f WHERE f.id = d.entity_id)
  END as entity_name
FROM documents d
WHERE d.status = 'approved'
  AND d.expiration_date IS NOT NULL
  AND d.expiration_date <= CURRENT_DATE + INTERVAL '30 days'
  AND d.expiration_date >= CURRENT_DATE
ORDER BY d.expiration_date ASC;

-- View: Missing required documents
CREATE OR REPLACE VIEW missing_required_documents AS
SELECT
  dc.organization_id,
  dc.entity_type,
  dc.entity_id,
  UNNEST(dc.missing_documents) as missing_document_name,
  dc.compliance_status,
  CASE
    WHEN dc.entity_type = 'child' THEN (SELECT c.first_name || ' ' || c.last_name FROM children c WHERE c.id = dc.entity_id)
    WHEN dc.entity_type = 'staff' THEN (SELECT p.first_name || ' ' || p.last_name FROM profiles p WHERE p.id = dc.entity_id)
    WHEN dc.entity_type = 'family' THEN (SELECT f.name FROM families f WHERE f.id = dc.entity_id)
  END as entity_name
FROM document_compliance dc
WHERE array_length(dc.missing_documents, 1) > 0;

-- =====================================================
-- Triggers for updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_document_templates_updated_at ON document_templates;
CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_requests_updated_at ON document_requests;
CREATE TRIGGER update_document_requests_updated_at
  BEFORE UPDATE ON document_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_compliance_updated_at ON document_compliance;
CREATE TRIGGER update_document_compliance_updated_at
  BEFORE UPDATE ON document_compliance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE document_templates IS 'Document templates including DCF required forms';
COMMENT ON TABLE documents IS 'Submitted/uploaded documents for children, families, and staff';
COMMENT ON TABLE document_signatures IS 'Electronic signatures on documents';
COMMENT ON TABLE document_requests IS 'Pending document requests sent to parents/staff';
COMMENT ON TABLE document_compliance IS 'Pre-computed document compliance status per entity';

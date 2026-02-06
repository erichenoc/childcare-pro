-- =====================================================
-- MIGRATION 005: Guardians, Emergency Contacts, Authorized Pickups
-- =====================================================
-- Complete family/guardian management system

-- Create guardians table (separate from families for detailed tracking)
CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,

  relationship_type TEXT NOT NULL,
  -- 'father', 'mother', 'stepfather', 'stepmother', 'legal_guardian',
  -- 'grandparent', 'aunt', 'uncle', 'foster_parent', 'other'

  relationship_to_children TEXT, -- Additional detail if needed

  -- Contact info
  email TEXT,
  phone TEXT NOT NULL,
  secondary_phone TEXT,
  work_phone TEXT,
  preferred_contact_method TEXT DEFAULT 'phone', -- 'phone', 'email', 'text'

  -- Address (may differ from family address)
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Employment
  employer_name TEXT,
  employer_phone TEXT,
  employer_address TEXT,
  occupation TEXT,
  work_schedule TEXT, -- e.g., "M-F 9am-5pm"

  -- Identification
  photo_url TEXT,
  id_document_type TEXT, -- 'drivers_license', 'passport', 'state_id', 'military_id'
  id_document_number TEXT,
  id_document_url TEXT,
  id_expiration_date DATE,

  -- Permissions
  is_primary_contact BOOLEAN DEFAULT false,
  is_authorized_pickup BOOLEAN DEFAULT true, -- Parents auto-authorized
  can_make_decisions BOOLEAN DEFAULT true, -- Medical, educational decisions
  receives_invoices BOOLEAN DEFAULT false,
  receives_notifications BOOLEAN DEFAULT true,
  receives_daily_reports BOOLEAN DEFAULT true,

  -- Portal access
  has_portal_access BOOLEAN DEFAULT false,
  portal_user_id UUID REFERENCES auth.users(id),
  portal_last_login TIMESTAMPTZ,

  -- Custody/Legal
  custody_status TEXT, -- 'full', 'joint', 'none', 'restricted'
  custody_notes TEXT,
  has_custody_documents BOOLEAN DEFAULT false,
  custody_documents_url TEXT,

  -- Emergency contact priority
  emergency_priority INTEGER DEFAULT 1, -- 1 = first to call

  notes TEXT,
  status TEXT DEFAULT 'active',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guardians_org ON guardians(organization_id);
CREATE INDEX IF NOT EXISTS idx_guardians_family ON guardians(family_id);
CREATE INDEX IF NOT EXISTS idx_guardians_email ON guardians(email);
CREATE INDEX IF NOT EXISTS idx_guardians_phone ON guardians(phone);
CREATE INDEX IF NOT EXISTS idx_guardians_relationship ON guardians(relationship_type);

-- Junction table for guardian-child relationships (many-to-many)
CREATE TABLE IF NOT EXISTS guardian_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL, -- Specific relationship to this child
  is_authorized_pickup BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(guardian_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_guardian_children_guardian ON guardian_children(guardian_id);
CREATE INDEX IF NOT EXISTS idx_guardian_children_child ON guardian_children(child_id);

-- Emergency contacts table (separate from guardians - can be anyone)
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- 'grandmother', 'neighbor', 'family friend', etc.

  phone TEXT NOT NULL,
  secondary_phone TEXT,
  email TEXT,

  -- Priority order (minimum 2 required)
  priority_order INTEGER NOT NULL DEFAULT 1, -- 1 = first to call

  -- Pickup authorization
  is_authorized_pickup BOOLEAN DEFAULT false,

  -- If authorized for pickup, need photo/ID
  photo_url TEXT,
  id_document_url TEXT,

  -- Availability
  availability_notes TEXT, -- e.g., "Only available after 3pm"

  notes TEXT,
  status TEXT DEFAULT 'active',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_org ON emergency_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_child ON emergency_contacts(child_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_priority ON emergency_contacts(priority_order);

-- Authorized pickups table (non-guardian people authorized to pick up)
CREATE TABLE IF NOT EXISTS authorized_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- REQUIRED: Photo and ID for verification
  photo_url TEXT NOT NULL,
  id_document_type TEXT NOT NULL, -- 'drivers_license', 'passport', 'state_id'
  id_document_number TEXT NOT NULL,
  id_document_url TEXT NOT NULL,

  -- Validity period
  is_active BOOLEAN DEFAULT true,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE, -- NULL = indefinite

  -- Restrictions
  restrictions TEXT, -- e.g., "Only on Mondays and Wednesdays"
  allowed_days TEXT[], -- ['monday', 'wednesday']
  time_restrictions TEXT, -- e.g., "Only after 3:00 PM"

  -- Verification
  added_by UUID REFERENCES profiles(id),
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  verification_method TEXT, -- 'in_person', 'video_call', 'document_only'

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_pickup_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_authorized_pickups_org ON authorized_pickups(organization_id);
CREATE INDEX IF NOT EXISTS idx_authorized_pickups_child ON authorized_pickups(child_id);
CREATE INDEX IF NOT EXISTS idx_authorized_pickups_active ON authorized_pickups(is_active);

-- RLS Policies for guardians
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view guardians in their organization"
  ON guardians FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage guardians"
  ON guardians FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director', 'lead_teacher')
  );

CREATE POLICY "Staff can update guardians"
  ON guardians FOR UPDATE
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director', 'lead_teacher')
  );

CREATE POLICY "Directors can delete guardians"
  ON guardians FOR DELETE
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- RLS for guardian_children
ALTER TABLE guardian_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view guardian_children via guardian access"
  ON guardian_children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardians g
      WHERE g.id = guardian_id
      AND (g.organization_id = get_user_organization_id() OR is_system_admin())
    )
  );

-- RLS for emergency_contacts
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view emergency contacts in their organization"
  ON emergency_contacts FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage emergency contacts"
  ON emergency_contacts FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) NOT IN ('parent')
  );

-- RLS for authorized_pickups
ALTER TABLE authorized_pickups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authorized pickups in their organization"
  ON authorized_pickups FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage authorized pickups"
  ON authorized_pickups FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) NOT IN ('parent')
  );

-- Triggers
CREATE TRIGGER update_guardians_updated_at
  BEFORE UPDATE ON guardians
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_authorized_pickups_updated_at
  BEFORE UPDATE ON authorized_pickups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Validation Functions
-- =====================================================

-- Function to check if child has minimum emergency contacts
CREATE OR REPLACE FUNCTION check_emergency_contacts_count(p_child_id UUID)
RETURNS TABLE (
  has_minimum BOOLEAN,
  contact_count INTEGER,
  message TEXT
) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM emergency_contacts
  WHERE child_id = p_child_id AND status = 'active';

  has_minimum := v_count >= 2;
  contact_count := v_count;

  IF v_count = 0 THEN
    message := 'No emergency contacts on file. Minimum 2 required.';
  ELSIF v_count = 1 THEN
    message := 'Only 1 emergency contact on file. Minimum 2 required.';
  ELSE
    message := 'Emergency contacts requirement met.';
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to validate pickup person
CREATE OR REPLACE FUNCTION validate_pickup_person(
  p_child_id UUID,
  p_person_type TEXT, -- 'guardian', 'authorized', 'emergency_contact'
  p_person_id UUID
)
RETURNS TABLE (
  is_valid BOOLEAN,
  person_name TEXT,
  relationship TEXT,
  photo_url TEXT,
  restrictions TEXT,
  message TEXT
) AS $$
BEGIN
  IF p_person_type = 'guardian' THEN
    SELECT
      true,
      g.first_name || ' ' || g.last_name,
      g.relationship_type,
      g.photo_url,
      NULL::TEXT,
      'Guardian - Authorized'
    INTO is_valid, person_name, relationship, photo_url, restrictions, message
    FROM guardians g
    JOIN guardian_children gc ON g.id = gc.guardian_id
    WHERE gc.child_id = p_child_id
      AND g.id = p_person_id
      AND gc.is_authorized_pickup = true
      AND g.status = 'active';

  ELSIF p_person_type = 'authorized' THEN
    SELECT
      ap.is_active AND (ap.valid_until IS NULL OR ap.valid_until >= CURRENT_DATE),
      ap.name,
      ap.relationship,
      ap.photo_url,
      ap.restrictions,
      CASE
        WHEN NOT ap.is_active THEN 'Authorization inactive'
        WHEN ap.valid_until < CURRENT_DATE THEN 'Authorization expired'
        ELSE 'Authorized Pickup - Valid'
      END
    INTO is_valid, person_name, relationship, photo_url, restrictions, message
    FROM authorized_pickups ap
    WHERE ap.child_id = p_child_id AND ap.id = p_person_id;

  ELSIF p_person_type = 'emergency_contact' THEN
    SELECT
      ec.is_authorized_pickup,
      ec.name,
      ec.relationship,
      ec.photo_url,
      NULL::TEXT,
      CASE
        WHEN ec.is_authorized_pickup THEN 'Emergency Contact - Authorized for pickup'
        ELSE 'Emergency Contact - NOT authorized for pickup'
      END
    INTO is_valid, person_name, relationship, photo_url, restrictions, message
    FROM emergency_contacts ec
    WHERE ec.child_id = p_child_id AND ec.id = p_person_id AND ec.status = 'active';
  ELSE
    is_valid := false;
    message := 'Invalid person type';
  END IF;

  IF person_name IS NULL THEN
    is_valid := false;
    message := 'Person not found or not authorized for this child';
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get all authorized pickup people for a child
CREATE OR REPLACE FUNCTION get_authorized_pickups_for_child(p_child_id UUID)
RETURNS TABLE (
  person_id UUID,
  person_type TEXT,
  name TEXT,
  relationship TEXT,
  phone TEXT,
  photo_url TEXT,
  has_photo BOOLEAN,
  has_id BOOLEAN,
  restrictions TEXT
) AS $$
BEGIN
  -- Guardians
  RETURN QUERY
  SELECT
    g.id as person_id,
    'guardian'::TEXT as person_type,
    g.first_name || ' ' || g.last_name as name,
    g.relationship_type as relationship,
    g.phone,
    g.photo_url,
    g.photo_url IS NOT NULL as has_photo,
    g.id_document_url IS NOT NULL as has_id,
    NULL::TEXT as restrictions
  FROM guardians g
  JOIN guardian_children gc ON g.id = gc.guardian_id
  WHERE gc.child_id = p_child_id
    AND gc.is_authorized_pickup = true
    AND g.status = 'active';

  -- Authorized pickups
  RETURN QUERY
  SELECT
    ap.id as person_id,
    'authorized'::TEXT as person_type,
    ap.name,
    ap.relationship,
    ap.phone,
    ap.photo_url,
    ap.photo_url IS NOT NULL as has_photo,
    ap.id_document_url IS NOT NULL as has_id,
    ap.restrictions
  FROM authorized_pickups ap
  WHERE ap.child_id = p_child_id
    AND ap.is_active = true
    AND (ap.valid_until IS NULL OR ap.valid_until >= CURRENT_DATE);

  -- Emergency contacts authorized for pickup
  RETURN QUERY
  SELECT
    ec.id as person_id,
    'emergency_contact'::TEXT as person_type,
    ec.name,
    ec.relationship,
    ec.phone,
    ec.photo_url,
    ec.photo_url IS NOT NULL as has_photo,
    ec.id_document_url IS NOT NULL as has_id,
    NULL::TEXT as restrictions
  FROM emergency_contacts ec
  WHERE ec.child_id = p_child_id
    AND ec.is_authorized_pickup = true
    AND ec.status = 'active';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE guardians IS 'Parents and legal guardians of children';
COMMENT ON TABLE emergency_contacts IS 'Emergency contacts for each child (minimum 2 required)';
COMMENT ON TABLE authorized_pickups IS 'Non-guardian people authorized to pick up children';
COMMENT ON FUNCTION validate_pickup_person(UUID, TEXT, UUID) IS 'Validates if a person is authorized to pick up a specific child';

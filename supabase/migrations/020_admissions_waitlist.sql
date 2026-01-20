-- =====================================================
-- Migration: Admissions & Waitlist Management
-- Description: Leads, inquiries, tours, waitlist, and enrollment workflow
-- =====================================================

-- ==================== Enums ====================

-- Lead/Inquiry status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_status') THEN
    CREATE TYPE inquiry_status AS ENUM (
      'new', 'contacted', 'tour_scheduled', 'tour_completed',
      'application_sent', 'application_received', 'waitlisted',
      'offered', 'accepted', 'enrolled', 'declined', 'withdrawn'
    );
  END IF;
END$$;

-- Lead source
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source') THEN
    CREATE TYPE lead_source AS ENUM (
      'website', 'referral', 'walk_in', 'phone', 'social_media',
      'google', 'childcare_aware', 'dcf_referral', 'other'
    );
  END IF;
END$$;

-- Tour status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tour_status') THEN
    CREATE TYPE tour_status AS ENUM (
      'scheduled', 'confirmed', 'completed', 'no_show', 'cancelled', 'rescheduled'
    );
  END IF;
END$$;

-- Waitlist priority
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'waitlist_priority') THEN
    CREATE TYPE waitlist_priority AS ENUM ('normal', 'high', 'vip', 'sibling');
  END IF;
END$$;

-- ==================== Inquiries/Leads ====================

CREATE TABLE IF NOT EXISTS admission_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Contact information
  parent_first_name TEXT NOT NULL,
  parent_last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_contact_method TEXT DEFAULT 'email',

  -- Child information
  child_first_name TEXT NOT NULL,
  child_last_name TEXT,
  child_date_of_birth DATE NOT NULL,
  child_gender TEXT,

  -- Requested care
  desired_start_date DATE,
  schedule_type TEXT, -- full_time, part_time, etc.
  requested_classroom_id UUID REFERENCES classrooms(id),
  special_needs_notes TEXT,

  -- Source tracking
  lead_source lead_source NOT NULL DEFAULT 'website',
  referral_source TEXT, -- If referral, who referred them
  marketing_campaign TEXT, -- Track marketing effectiveness

  -- Status and workflow
  status inquiry_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES staff(id),

  -- Communication history stored in activity_log

  -- Outcome
  converted_to_family_id UUID REFERENCES families(id),
  converted_to_child_id UUID REFERENCES children(id),
  decline_reason TEXT,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ
);

-- ==================== Tours ====================

CREATE TABLE IF NOT EXISTS admission_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inquiry_id UUID NOT NULL REFERENCES admission_inquiries(id) ON DELETE CASCADE,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,

  -- Staff
  tour_guide_id UUID REFERENCES staff(id),

  -- Status
  status tour_status NOT NULL DEFAULT 'scheduled',
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Notes
  pre_tour_notes TEXT,
  post_tour_notes TEXT, -- Observations from the tour
  parent_feedback TEXT,

  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Waitlist ====================

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inquiry_id UUID NOT NULL REFERENCES admission_inquiries(id) ON DELETE CASCADE,

  -- Waitlist details
  position INTEGER,
  priority waitlist_priority NOT NULL DEFAULT 'normal',
  priority_reason TEXT, -- e.g., "Sibling of current student"

  -- Requested placement
  requested_classroom_id UUID REFERENCES classrooms(id),
  requested_start_date DATE,
  flexible_start_date BOOLEAN DEFAULT false,

  -- Age-based placement
  child_age_at_start_months INTEGER,
  age_group TEXT, -- Calculated age group at desired start

  -- Status
  is_active BOOLEAN DEFAULT true,
  offered_spot_at TIMESTAMPTZ,
  offer_expires_at TIMESTAMPTZ,
  offer_response TEXT, -- accepted, declined, expired

  -- Deposit
  deposit_required DECIMAL(10,2),
  deposit_paid BOOLEAN DEFAULT false,
  deposit_paid_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_active_waitlist_entry UNIQUE (inquiry_id, is_active) WHERE is_active = true
);

-- ==================== Enrollment Applications ====================

CREATE TABLE IF NOT EXISTS enrollment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inquiry_id UUID NOT NULL REFERENCES admission_inquiries(id) ON DELETE CASCADE,

  -- Application details
  application_number TEXT,
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),

  -- Parent/Guardian information (JSON for flexibility)
  parent_info JSONB NOT NULL DEFAULT '{}',
  -- Format: { name, relationship, ssn_last4, employer, work_phone, etc. }

  -- Emergency contacts
  emergency_contacts JSONB NOT NULL DEFAULT '[]',
  -- Format: [{ name, relationship, phone, authorized_pickup }]

  -- Child details
  child_info JSONB NOT NULL DEFAULT '{}',
  -- Format: { allergies, medical_conditions, medications, doctor_name, doctor_phone, etc. }

  -- Required documents checklist
  documents_checklist JSONB NOT NULL DEFAULT '{}',
  -- Format: { birth_certificate: true, immunization_records: false, etc. }

  -- Authorizations/Consents
  authorizations JSONB NOT NULL DEFAULT '{}',
  -- Format: { photo_consent: true, sunscreen_consent: true, field_trip_consent: false, etc. }

  -- Signatures
  parent_signature TEXT, -- Could be data URL of signature
  parent_signature_date DATE,

  -- Review
  reviewed_by UUID REFERENCES staff(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Enrollment date
  approved_start_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Admission Communication Log ====================

CREATE TABLE IF NOT EXISTS admission_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inquiry_id UUID NOT NULL REFERENCES admission_inquiries(id) ON DELETE CASCADE,

  -- Communication details
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'phone', 'sms', 'in_person', 'note')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT,
  content TEXT,

  -- Staff
  staff_id UUID REFERENCES staff(id),

  -- Follow-up
  requires_follow_up BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Indexes ====================

CREATE INDEX IF NOT EXISTS idx_admission_inquiries_org ON admission_inquiries(organization_id);
CREATE INDEX IF NOT EXISTS idx_admission_inquiries_status ON admission_inquiries(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_admission_inquiries_email ON admission_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_admission_inquiries_created ON admission_inquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admission_tours_org ON admission_tours(organization_id);
CREATE INDEX IF NOT EXISTS idx_admission_tours_inquiry ON admission_tours(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_admission_tours_scheduled ON admission_tours(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_admission_tours_status ON admission_tours(status);

CREATE INDEX IF NOT EXISTS idx_waitlist_entries_org ON waitlist_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_inquiry ON waitlist_entries(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_active ON waitlist_entries(organization_id, is_active, position)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_classroom ON waitlist_entries(requested_classroom_id);

CREATE INDEX IF NOT EXISTS idx_enrollment_applications_org ON enrollment_applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_inquiry ON enrollment_applications(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_status ON enrollment_applications(status);

CREATE INDEX IF NOT EXISTS idx_admission_communications_inquiry ON admission_communications(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_admission_communications_date ON admission_communications(created_at DESC);

-- ==================== RLS Policies ====================

ALTER TABLE admission_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_communications ENABLE ROW LEVEL SECURITY;

-- Policies for admission_inquiries
CREATE POLICY "admission_inquiries_org_access" ON admission_inquiries
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM staff WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policies for admission_tours
CREATE POLICY "admission_tours_org_access" ON admission_tours
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM staff WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policies for waitlist_entries
CREATE POLICY "waitlist_entries_org_access" ON waitlist_entries
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM staff WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policies for enrollment_applications
CREATE POLICY "enrollment_applications_org_access" ON enrollment_applications
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM staff WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policies for admission_communications
CREATE POLICY "admission_communications_org_access" ON admission_communications
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM staff WHERE email = auth.jwt() ->> 'email'
    )
  );

-- ==================== Triggers ====================

-- Update timestamps
CREATE TRIGGER admission_inquiries_updated_at
  BEFORE UPDATE ON admission_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

CREATE TRIGGER admission_tours_updated_at
  BEFORE UPDATE ON admission_tours
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

CREATE TRIGGER waitlist_entries_updated_at
  BEFORE UPDATE ON waitlist_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

CREATE TRIGGER enrollment_applications_updated_at
  BEFORE UPDATE ON enrollment_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- Auto-update waitlist positions when entry is removed
CREATE OR REPLACE FUNCTION reorder_waitlist()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE waitlist_entries
    SET position = position - 1
    WHERE organization_id = OLD.organization_id
      AND is_active = true
      AND position > OLD.position;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER waitlist_reorder
  AFTER UPDATE ON waitlist_entries
  FOR EACH ROW
  WHEN (OLD.is_active = true AND NEW.is_active = false)
  EXECUTE FUNCTION reorder_waitlist();

-- ==================== Helper Functions ====================

-- Get next waitlist position
CREATE OR REPLACE FUNCTION get_next_waitlist_position(
  p_organization_id UUID,
  p_classroom_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  max_position INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), 0)
  INTO max_position
  FROM waitlist_entries
  WHERE organization_id = p_organization_id
    AND is_active = true
    AND (p_classroom_id IS NULL OR requested_classroom_id = p_classroom_id);

  RETURN max_position + 1;
END;
$$ LANGUAGE plpgsql;

-- Get admission pipeline stats
CREATE OR REPLACE FUNCTION get_admission_pipeline_stats(
  p_organization_id UUID
) RETURNS TABLE (
  status inquiry_status,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT ai.status, COUNT(*)::BIGINT
  FROM admission_inquiries ai
  WHERE ai.organization_id = p_organization_id
  GROUP BY ai.status
  ORDER BY ai.status;
END;
$$ LANGUAGE plpgsql;

-- Get waitlist by age group
CREATE OR REPLACE FUNCTION get_waitlist_by_age_group(
  p_organization_id UUID
) RETURNS TABLE (
  age_group TEXT,
  count BIGINT,
  avg_wait_days NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.age_group,
    COUNT(*)::BIGINT,
    AVG(EXTRACT(DAY FROM NOW() - we.created_at))::NUMERIC AS avg_wait_days
  FROM waitlist_entries we
  WHERE we.organization_id = p_organization_id
    AND we.is_active = true
  GROUP BY we.age_group
  ORDER BY we.age_group;
END;
$$ LANGUAGE plpgsql;

-- ==================== Comments ====================

COMMENT ON TABLE admission_inquiries IS 'Prospective family inquiries and leads';
COMMENT ON TABLE admission_tours IS 'Scheduled and completed facility tours';
COMMENT ON TABLE waitlist_entries IS 'Children waiting for an available spot';
COMMENT ON TABLE enrollment_applications IS 'Full enrollment application with documents';
COMMENT ON TABLE admission_communications IS 'All communication with prospective families';

COMMENT ON COLUMN admission_inquiries.lead_source IS 'How the family learned about the center';
COMMENT ON COLUMN waitlist_entries.position IS 'Position in waitlist (1 = first in line)';
COMMENT ON COLUMN waitlist_entries.priority IS 'Priority level (siblings get higher priority)';

-- =====================================================
-- Migration 025: Fire Drill Tracking (DCF Compliance)
-- Florida DCF requires documented monthly fire/evacuation drills
-- =====================================================

-- Fire drill records
CREATE TABLE IF NOT EXISTS fire_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Drill details
  drill_date DATE NOT NULL,
  drill_time TIME NOT NULL,
  drill_type TEXT NOT NULL DEFAULT 'fire' CHECK (drill_type IN ('fire', 'tornado', 'lockdown', 'evacuation')),
  duration_seconds INTEGER, -- How long the evacuation took

  -- Weather/conditions
  weather_conditions TEXT, -- 'clear', 'rainy', 'cold', etc.

  -- Participants
  total_children INTEGER NOT NULL DEFAULT 0,
  total_staff INTEGER NOT NULL DEFAULT 0,

  -- Results
  evacuation_successful BOOLEAN NOT NULL DEFAULT true,
  issues_noted TEXT, -- Any problems during the drill
  corrective_actions TEXT, -- Actions taken to fix issues

  -- Compliance
  all_exits_used BOOLEAN DEFAULT false,
  assembly_point_reached BOOLEAN DEFAULT true,
  headcount_verified BOOLEAN DEFAULT true,

  -- Documentation
  conducted_by UUID REFERENCES profiles(id), -- Staff who led the drill
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fire_drills_org ON fire_drills(organization_id);
CREATE INDEX IF NOT EXISTS idx_fire_drills_date ON fire_drills(organization_id, drill_date DESC);
CREATE INDEX IF NOT EXISTS idx_fire_drills_type ON fire_drills(organization_id, drill_type);

-- RLS
ALTER TABLE fire_drills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fire_drills_org_access" ON fire_drills
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER fire_drills_updated_at
  BEFORE UPDATE ON fire_drills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

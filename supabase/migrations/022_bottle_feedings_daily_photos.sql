-- =====================================================
-- Bottle Feedings & Daily Photos Module
-- Additional tracking for infants and parent communication
-- =====================================================

-- ==================== Bottle/Feeding Tracking ====================
-- For infants: track bottle feedings with oz, milk type, etc.

CREATE TABLE IF NOT EXISTS bottle_feedings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES profiles(id),

    -- Feeding details
    feeding_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    amount_oz DECIMAL(4,1) NOT NULL, -- Ounces consumed
    milk_type VARCHAR(50) NOT NULL CHECK (milk_type IN (
        'breast_milk', 'formula', 'whole_milk', 'cow_milk', 'soy_milk',
        'almond_milk', 'oat_milk', 'other'
    )),
    formula_brand VARCHAR(100), -- If formula, which brand
    temperature VARCHAR(20) CHECK (temperature IN ('warm', 'room_temp', 'cold')),

    -- Feeding behavior
    duration_minutes INTEGER,
    finished_bottle BOOLEAN DEFAULT FALSE,
    burped BOOLEAN DEFAULT FALSE,
    spit_up BOOLEAN DEFAULT FALSE,

    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== Daily Photos ====================
-- Photos captured during the day to share with parents

CREATE TABLE IF NOT EXISTS daily_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES profiles(id),

    -- Photo details
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    photo_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Context
    activity_type VARCHAR(50), -- What were they doing?
    location VARCHAR(100),

    -- Sharing
    shared_with_parents BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== Indexes ====================

CREATE INDEX IF NOT EXISTS idx_bottle_feedings_org ON bottle_feedings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bottle_feedings_child ON bottle_feedings(child_id);
CREATE INDEX IF NOT EXISTS idx_bottle_feedings_time ON bottle_feedings(feeding_time);
CREATE INDEX IF NOT EXISTS idx_bottle_feedings_child_date ON bottle_feedings(child_id, DATE(feeding_time));

CREATE INDEX IF NOT EXISTS idx_daily_photos_org ON daily_photos(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_photos_child ON daily_photos(child_id);
CREATE INDEX IF NOT EXISTS idx_daily_photos_time ON daily_photos(photo_time);
CREATE INDEX IF NOT EXISTS idx_daily_photos_child_date ON daily_photos(child_id, DATE(photo_time));

-- ==================== Row Level Security ====================

ALTER TABLE bottle_feedings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bottle_feedings
CREATE POLICY "bottle_feedings_org_select" ON bottle_feedings
FOR SELECT USING (
    organization_id IN (
        SELECT pm.organization_id FROM profile_memberships pm
        WHERE pm.profile_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'director', 'teacher', 'lead_teacher', 'assistant')
    )
);

CREATE POLICY "bottle_feedings_org_insert" ON bottle_feedings
FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT pm.organization_id FROM profile_memberships pm
        WHERE pm.profile_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'director', 'teacher', 'lead_teacher', 'assistant')
    )
);

CREATE POLICY "bottle_feedings_org_update" ON bottle_feedings
FOR UPDATE USING (
    organization_id IN (
        SELECT pm.organization_id FROM profile_memberships pm
        WHERE pm.profile_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'director', 'teacher', 'lead_teacher', 'assistant')
    )
);

CREATE POLICY "bottle_feedings_org_delete" ON bottle_feedings
FOR DELETE USING (
    organization_id IN (
        SELECT pm.organization_id FROM profile_memberships pm
        WHERE pm.profile_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'director')
    )
);

-- RLS Policies for daily_photos
CREATE POLICY "daily_photos_org_select" ON daily_photos
FOR SELECT USING (
    organization_id IN (
        SELECT pm.organization_id FROM profile_memberships pm
        WHERE pm.profile_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'director', 'teacher', 'lead_teacher', 'assistant')
    )
);

CREATE POLICY "daily_photos_org_insert" ON daily_photos
FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT pm.organization_id FROM profile_memberships pm
        WHERE pm.profile_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'director', 'teacher', 'lead_teacher', 'assistant')
    )
);

CREATE POLICY "daily_photos_org_update" ON daily_photos
FOR UPDATE USING (
    organization_id IN (
        SELECT pm.organization_id FROM profile_memberships pm
        WHERE pm.profile_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'director', 'teacher', 'lead_teacher', 'assistant')
    )
);

CREATE POLICY "daily_photos_org_delete" ON daily_photos
FOR DELETE USING (
    organization_id IN (
        SELECT pm.organization_id FROM profile_memberships pm
        WHERE pm.profile_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'director')
    )
);

-- ==================== Updated At Triggers ====================

CREATE TRIGGER bottle_feedings_updated_at
BEFORE UPDATE ON bottle_feedings
FOR EACH ROW
EXECUTE FUNCTION update_daily_activity_timestamp();

CREATE TRIGGER daily_photos_updated_at
BEFORE UPDATE ON daily_photos
FOR EACH ROW
EXECUTE FUNCTION update_daily_activity_timestamp();

-- ==================== Comments ====================

COMMENT ON TABLE bottle_feedings IS 'Track bottle feedings for infants - amount, milk type, feeding behavior';
COMMENT ON TABLE daily_photos IS 'Photos captured during the day to share with parents';

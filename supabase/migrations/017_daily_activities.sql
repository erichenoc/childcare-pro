-- =====================================================
-- Daily Activities Module
-- Track daily activities for children (meals, naps, bathroom, activities)
-- =====================================================

-- ==================== Activity Types ====================

-- Activity category enum reference: meals, naps, bathroom, activities, health, mood
-- Each tracked in its own table for specialized fields

-- ==================== Meal Tracking ====================

CREATE TABLE IF NOT EXISTS meal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES profiles(id),

    -- Meal details
    meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner')),
    meal_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    food_served TEXT,
    amount_eaten VARCHAR(20) CHECK (amount_eaten IN ('all', 'most', 'some', 'little', 'none', 'refused')),
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== Nap/Sleep Tracking ====================

CREATE TABLE IF NOT EXISTS nap_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES profiles(id),

    -- Nap details
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN end_time IS NOT NULL
            THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 60
            ELSE NULL
        END
    ) STORED,
    quality VARCHAR(20) CHECK (quality IN ('restful', 'light', 'restless', 'did_not_sleep')),
    location VARCHAR(100),
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== Bathroom/Diaper Tracking ====================

CREATE TABLE IF NOT EXISTS bathroom_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES profiles(id),

    -- Bathroom details
    record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('diaper', 'potty', 'bathroom')),
    record_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Diaper specific
    diaper_condition VARCHAR(20) CHECK (diaper_condition IN ('wet', 'dirty', 'both', 'dry')),

    -- Potty/bathroom specific
    potty_success BOOLEAN,

    -- Health indicators
    has_rash BOOLEAN DEFAULT FALSE,
    unusual_observation TEXT,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== Activity/Learning Moments ====================

CREATE TABLE IF NOT EXISTS activity_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES profiles(id),

    -- Activity details
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'art', 'music', 'outdoor_play', 'indoor_play', 'reading', 'circle_time',
        'sensory', 'gross_motor', 'fine_motor', 'social', 'science', 'math',
        'language', 'dramatic_play', 'free_play', 'other'
    )),
    activity_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    activity_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Engagement tracking
    engagement_level VARCHAR(20) CHECK (engagement_level IN ('highly_engaged', 'engaged', 'somewhat_engaged', 'not_interested')),
    duration_minutes INTEGER,

    -- Learning areas
    learning_areas TEXT[], -- Array of learning domains covered

    -- Media
    photos TEXT[], -- Array of photo URLs

    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== Mood/Behavior Tracking ====================

CREATE TABLE IF NOT EXISTS mood_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES profiles(id),

    -- Mood details
    record_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    mood VARCHAR(30) NOT NULL CHECK (mood IN (
        'happy', 'content', 'excited', 'calm', 'tired', 'fussy',
        'sad', 'frustrated', 'anxious', 'unwell'
    )),
    energy_level VARCHAR(20) CHECK (energy_level IN ('high', 'normal', 'low', 'very_low')),

    -- Context
    trigger_event TEXT,
    comfort_measures TEXT,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== Health Observations ====================

CREATE TABLE IF NOT EXISTS health_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES profiles(id),

    -- Observation details
    observation_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    observation_type VARCHAR(50) NOT NULL CHECK (observation_type IN (
        'temperature', 'injury', 'illness_symptoms', 'medication',
        'allergic_reaction', 'behavior_change', 'other'
    )),

    -- Specifics
    temperature_value DECIMAL(4,1), -- For temperature readings
    medication_name VARCHAR(255),
    medication_dosage VARCHAR(100),
    medication_time TIMESTAMP WITH TIME ZONE,

    description TEXT NOT NULL,
    action_taken TEXT,
    parent_notified BOOLEAN DEFAULT FALSE,
    parent_notified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== Daily Report (Aggregation) ====================

CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,

    -- Report status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'sent')),

    -- Summary fields (optional - can be used for additional notes)
    overall_day_summary TEXT,
    highlights TEXT,
    reminders_for_parents TEXT,

    -- Photos for the day
    photos TEXT[],

    -- Sending
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_by UUID REFERENCES profiles(id),
    sent_via VARCHAR(20) CHECK (sent_via IN ('email', 'app', 'both')),

    -- Timestamps
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one report per child per day
    UNIQUE(organization_id, child_id, report_date)
);

-- ==================== Indexes ====================

CREATE INDEX IF NOT EXISTS idx_meal_records_org ON meal_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_meal_records_child ON meal_records(child_id);
CREATE INDEX IF NOT EXISTS idx_meal_records_time ON meal_records(meal_time);
CREATE INDEX IF NOT EXISTS idx_meal_records_child_date ON meal_records(child_id, DATE(meal_time));

CREATE INDEX IF NOT EXISTS idx_nap_records_org ON nap_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_nap_records_child ON nap_records(child_id);
CREATE INDEX IF NOT EXISTS idx_nap_records_time ON nap_records(start_time);

CREATE INDEX IF NOT EXISTS idx_bathroom_records_org ON bathroom_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_bathroom_records_child ON bathroom_records(child_id);
CREATE INDEX IF NOT EXISTS idx_bathroom_records_time ON bathroom_records(record_time);

CREATE INDEX IF NOT EXISTS idx_activity_records_org ON activity_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_records_child ON activity_records(child_id);
CREATE INDEX IF NOT EXISTS idx_activity_records_time ON activity_records(activity_time);

CREATE INDEX IF NOT EXISTS idx_mood_records_org ON mood_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_mood_records_child ON mood_records(child_id);
CREATE INDEX IF NOT EXISTS idx_mood_records_time ON mood_records(record_time);

CREATE INDEX IF NOT EXISTS idx_health_observations_org ON health_observations(organization_id);
CREATE INDEX IF NOT EXISTS idx_health_observations_child ON health_observations(child_id);
CREATE INDEX IF NOT EXISTS idx_health_observations_time ON health_observations(observation_time);

CREATE INDEX IF NOT EXISTS idx_daily_reports_org ON daily_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_child ON daily_reports(child_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_status ON daily_reports(status);

-- ==================== Row Level Security ====================

ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE nap_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bathroom_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for all activity tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['meal_records', 'nap_records', 'bathroom_records', 'activity_records', 'mood_records', 'health_observations', 'daily_reports'])
    LOOP
        -- Select policy
        EXECUTE format('
            CREATE POLICY IF NOT EXISTS "%s_org_select" ON %s
            FOR SELECT
            USING (
                organization_id IN (
                    SELECT pm.organization_id FROM profile_memberships pm
                    WHERE pm.profile_id = auth.uid()
                    AND pm.role IN (''owner'', ''admin'', ''director'', ''teacher'', ''lead_teacher'', ''assistant'')
                )
            )', tbl, tbl);

        -- Insert policy
        EXECUTE format('
            CREATE POLICY IF NOT EXISTS "%s_org_insert" ON %s
            FOR INSERT
            WITH CHECK (
                organization_id IN (
                    SELECT pm.organization_id FROM profile_memberships pm
                    WHERE pm.profile_id = auth.uid()
                    AND pm.role IN (''owner'', ''admin'', ''director'', ''teacher'', ''lead_teacher'', ''assistant'')
                )
            )', tbl, tbl);

        -- Update policy
        EXECUTE format('
            CREATE POLICY IF NOT EXISTS "%s_org_update" ON %s
            FOR UPDATE
            USING (
                organization_id IN (
                    SELECT pm.organization_id FROM profile_memberships pm
                    WHERE pm.profile_id = auth.uid()
                    AND pm.role IN (''owner'', ''admin'', ''director'', ''teacher'', ''lead_teacher'', ''assistant'')
                )
            )', tbl, tbl);

        -- Delete policy
        EXECUTE format('
            CREATE POLICY IF NOT EXISTS "%s_org_delete" ON %s
            FOR DELETE
            USING (
                organization_id IN (
                    SELECT pm.organization_id FROM profile_memberships pm
                    WHERE pm.profile_id = auth.uid()
                    AND pm.role IN (''owner'', ''admin'', ''director'')
                )
            )', tbl, tbl);
    END LOOP;
END $$;

-- ==================== Updated At Triggers ====================

CREATE OR REPLACE FUNCTION update_daily_activity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['meal_records', 'nap_records', 'bathroom_records', 'activity_records', 'mood_records', 'health_observations', 'daily_reports'])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS %s_updated_at ON %s', tbl, tbl);
        EXECUTE format('
            CREATE TRIGGER %s_updated_at
            BEFORE UPDATE ON %s
            FOR EACH ROW
            EXECUTE FUNCTION update_daily_activity_timestamp()', tbl, tbl);
    END LOOP;
END $$;

-- ==================== Helper Functions ====================

-- Get daily activity summary for a child
CREATE OR REPLACE FUNCTION get_child_daily_summary(
    p_child_id UUID,
    p_date DATE
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'date', p_date,
        'meals', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', id,
                'meal_type', meal_type,
                'meal_time', meal_time,
                'food_served', food_served,
                'amount_eaten', amount_eaten,
                'notes', notes
            ) ORDER BY meal_time), '[]'::json)
            FROM meal_records
            WHERE child_id = p_child_id
            AND DATE(meal_time) = p_date
        ),
        'naps', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', id,
                'start_time', start_time,
                'end_time', end_time,
                'duration_minutes', duration_minutes,
                'quality', quality,
                'notes', notes
            ) ORDER BY start_time), '[]'::json)
            FROM nap_records
            WHERE child_id = p_child_id
            AND DATE(start_time) = p_date
        ),
        'bathroom', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', id,
                'record_type', record_type,
                'record_time', record_time,
                'diaper_condition', diaper_condition,
                'potty_success', potty_success,
                'notes', notes
            ) ORDER BY record_time), '[]'::json)
            FROM bathroom_records
            WHERE child_id = p_child_id
            AND DATE(record_time) = p_date
        ),
        'activities', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', id,
                'activity_type', activity_type,
                'activity_time', activity_time,
                'activity_name', activity_name,
                'description', description,
                'engagement_level', engagement_level,
                'duration_minutes', duration_minutes,
                'photos', photos
            ) ORDER BY activity_time), '[]'::json)
            FROM activity_records
            WHERE child_id = p_child_id
            AND DATE(activity_time) = p_date
        ),
        'moods', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', id,
                'record_time', record_time,
                'mood', mood,
                'energy_level', energy_level,
                'notes', notes
            ) ORDER BY record_time), '[]'::json)
            FROM mood_records
            WHERE child_id = p_child_id
            AND DATE(record_time) = p_date
        ),
        'health_observations', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', id,
                'observation_time', observation_time,
                'observation_type', observation_type,
                'description', description,
                'action_taken', action_taken,
                'parent_notified', parent_notified
            ) ORDER BY observation_time), '[]'::json)
            FROM health_observations
            WHERE child_id = p_child_id
            AND DATE(observation_time) = p_date
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== Views ====================

-- Daily activity counts by classroom
CREATE OR REPLACE VIEW daily_activity_counts AS
SELECT
    c.organization_id,
    c.classroom_id,
    DATE(CURRENT_DATE) as report_date,
    COUNT(DISTINCT mr.id) as meals_recorded,
    COUNT(DISTINCT nr.id) as naps_recorded,
    COUNT(DISTINCT br.id) as bathroom_records,
    COUNT(DISTINCT ar.id) as activities_recorded,
    COUNT(DISTINCT modr.id) as moods_recorded
FROM children c
LEFT JOIN meal_records mr ON c.id = mr.child_id AND DATE(mr.meal_time) = CURRENT_DATE
LEFT JOIN nap_records nr ON c.id = nr.child_id AND DATE(nr.start_time) = CURRENT_DATE
LEFT JOIN bathroom_records br ON c.id = br.child_id AND DATE(br.record_time) = CURRENT_DATE
LEFT JOIN activity_records ar ON c.id = ar.child_id AND DATE(ar.activity_time) = CURRENT_DATE
LEFT JOIN mood_records modr ON c.id = modr.child_id AND DATE(modr.record_time) = CURRENT_DATE
WHERE c.enrollment_status = 'enrolled'
GROUP BY c.organization_id, c.classroom_id;

COMMENT ON TABLE meal_records IS 'Track meals and feeding for children';
COMMENT ON TABLE nap_records IS 'Track naps and sleep patterns';
COMMENT ON TABLE bathroom_records IS 'Track diaper changes and bathroom visits';
COMMENT ON TABLE activity_records IS 'Track activities and learning moments';
COMMENT ON TABLE mood_records IS 'Track mood and behavior throughout the day';
COMMENT ON TABLE health_observations IS 'Track health-related observations';
COMMENT ON TABLE daily_reports IS 'Daily summary reports sent to parents';

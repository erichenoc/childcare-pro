-- =====================================================
-- Learning & Milestones Module - DCF Florida Compliance
-- Child Development Tracking System
-- =====================================================

-- ==================== Milestone Categories ====================
CREATE TABLE IF NOT EXISTS milestone_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  age_range_start_months INTEGER NOT NULL DEFAULT 0,
  age_range_end_months INTEGER NOT NULL DEFAULT 60,
  display_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default development areas based on FL Early Learning Standards
INSERT INTO milestone_categories (name, description, age_range_start_months, age_range_end_months, display_order, icon, color) VALUES
  ('Physical Development', 'Gross motor, fine motor, and self-help skills', 0, 60, 1, 'activity', '#EF4444'),
  ('Cognitive Development', 'Problem-solving, reasoning, and learning approaches', 0, 60, 2, 'brain', '#8B5CF6'),
  ('Language & Literacy', 'Communication, vocabulary, and early literacy', 0, 60, 3, 'message-circle', '#3B82F6'),
  ('Social-Emotional', 'Self-regulation, relationships, and emotional expression', 0, 60, 4, 'heart', '#EC4899'),
  ('Creative Arts', 'Music, art, dramatic play, and creative expression', 0, 60, 5, 'palette', '#F59E0B'),
  ('Mathematical Thinking', 'Numbers, patterns, shapes, and measurement', 12, 60, 6, 'calculator', '#10B981')
ON CONFLICT DO NOTHING;

-- ==================== Milestone Templates ====================
-- Pre-defined milestones based on developmental stages
CREATE TABLE IF NOT EXISTS milestone_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES milestone_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  age_range_start_months INTEGER NOT NULL,
  age_range_end_months INTEGER NOT NULL,
  is_dcf_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  assessment_criteria TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert sample developmental milestones
INSERT INTO milestone_templates (category_id, name, description, age_range_start_months, age_range_end_months, is_dcf_required, display_order, assessment_criteria)
SELECT
  c.id,
  m.name,
  m.description,
  m.start_months,
  m.end_months,
  m.dcf_required,
  m.display_order,
  m.criteria
FROM milestone_categories c,
(VALUES
  -- Physical Development - Infants
  ('Physical Development', 'Holds head steady', 'Can hold head up independently when supported', 0, 4, false, 1, ARRAY['Holds head at 45° angle', 'Holds head at 90° angle', 'Holds head steady unsupported']),
  ('Physical Development', 'Rolls over', 'Rolls from tummy to back and back to tummy', 3, 7, false, 2, ARRAY['Rolls tummy to back', 'Rolls back to tummy', 'Rolls both directions']),
  ('Physical Development', 'Sits without support', 'Can sit independently for extended periods', 5, 9, false, 3, ARRAY['Sits with support', 'Sits briefly alone', 'Sits independently']),
  ('Physical Development', 'Crawls', 'Moves on hands and knees', 6, 10, false, 4, ARRAY['Army crawls', 'Rocks on hands/knees', 'Crawls forward']),
  ('Physical Development', 'Walks independently', 'Takes steps without support', 9, 15, false, 5, ARRAY['Cruises furniture', 'Takes 2-3 steps', 'Walks across room']),
  -- Language - Infants/Toddlers
  ('Language & Literacy', 'Babbles', 'Makes consonant-vowel sounds', 4, 8, false, 1, ARRAY['Coos', 'Makes consonant sounds', 'Babbles with varied sounds']),
  ('Language & Literacy', 'First words', 'Says 1-3 meaningful words', 10, 15, false, 2, ARRAY['Says one word', 'Says 2-3 words', 'Uses words meaningfully']),
  ('Language & Literacy', 'Two-word phrases', 'Combines two words together', 18, 24, false, 3, ARRAY['Understands phrases', 'Attempts combinations', 'Uses 2-word phrases']),
  ('Language & Literacy', 'Recognizes name', 'Recognizes own written name', 36, 48, true, 4, ARRAY['Recognizes first letter', 'Identifies name', 'Writes name']),
  -- Social-Emotional
  ('Social-Emotional', 'Social smile', 'Smiles in response to people', 1, 4, false, 1, ARRAY['Smiles at faces', 'Smiles at familiar people', 'Initiates social smiles']),
  ('Social-Emotional', 'Shows attachment', 'Demonstrates attachment to caregivers', 6, 12, false, 2, ARRAY['Prefers familiar adults', 'Shows separation anxiety', 'Seeks comfort from caregivers']),
  ('Social-Emotional', 'Parallel play', 'Plays alongside other children', 18, 30, false, 3, ARRAY['Aware of peers', 'Plays near peers', 'Imitates peer play']),
  ('Social-Emotional', 'Cooperative play', 'Engages in cooperative play with peers', 36, 48, false, 4, ARRAY['Takes turns', 'Shares materials', 'Plays cooperatively']),
  -- Cognitive
  ('Cognitive Development', 'Object permanence', 'Understands objects exist when hidden', 6, 12, false, 1, ARRAY['Looks for dropped object', 'Finds partially hidden', 'Finds completely hidden']),
  ('Cognitive Development', 'Sorts objects', 'Groups similar objects together', 18, 30, false, 2, ARRAY['Matches identical', 'Sorts by one attribute', 'Sorts by two attributes']),
  ('Cognitive Development', 'Counts to 10', 'Can count objects up to 10', 36, 48, true, 3, ARRAY['Counts to 5', 'Counts to 10', 'Counts with 1:1 correspondence']),
  -- Mathematical
  ('Mathematical Thinking', 'Recognizes shapes', 'Identifies basic geometric shapes', 24, 48, false, 1, ARRAY['Matches shapes', 'Names circle/square', 'Names multiple shapes']),
  ('Mathematical Thinking', 'Understands size concepts', 'Compares big/small, tall/short', 24, 36, false, 2, ARRAY['Big vs small', 'Tall vs short', 'Orders by size'])
) AS m(category_name, name, description, start_months, end_months, dcf_required, display_order, criteria)
WHERE c.name = m.category_name
ON CONFLICT DO NOTHING;

-- ==================== Child Milestones ====================
-- Track individual child's progress on milestones
CREATE TABLE IF NOT EXISTS child_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  template_id UUID REFERENCES milestone_templates(id) ON DELETE SET NULL,
  category_id UUID REFERENCES milestone_categories(id) ON DELETE SET NULL,
  custom_milestone_name TEXT, -- For custom milestones not from template
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'emerging', 'developing', 'achieved', 'exceeding')),
  observed_date DATE,
  target_date DATE,
  notes TEXT,
  evidence_photos TEXT[],
  observed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT milestone_source CHECK (template_id IS NOT NULL OR custom_milestone_name IS NOT NULL)
);

-- ==================== Milestone Observations ====================
-- Detailed observations for each milestone
CREATE TABLE IF NOT EXISTS milestone_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  child_milestone_id UUID NOT NULL REFERENCES child_milestones(id) ON DELETE CASCADE,
  observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  observation_notes TEXT NOT NULL,
  skill_level TEXT CHECK (skill_level IN ('not_observed', 'emerging', 'developing', 'proficient')),
  context TEXT, -- Where/when observed (circle time, free play, etc.)
  photos TEXT[],
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== Learning Plans ====================
-- Individual learning plans for children
CREATE TABLE IF NOT EXISTS learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  plan_period_start DATE NOT NULL,
  plan_period_end DATE NOT NULL,
  goals TEXT NOT NULL,
  strategies TEXT,
  accommodations TEXT,
  family_involvement TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== Learning Plan Goals ====================
CREATE TABLE IF NOT EXISTS learning_plan_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_plan_id UUID NOT NULL REFERENCES learning_plans(id) ON DELETE CASCADE,
  category_id UUID REFERENCES milestone_categories(id) ON DELETE SET NULL,
  goal_description TEXT NOT NULL,
  success_criteria TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'achieved', 'modified')),
  progress_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== Portfolio Entries ====================
-- Child's learning portfolio with work samples
CREATE TABLE IF NOT EXISTS portfolio_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  category_id UUID REFERENCES milestone_categories(id) ON DELETE SET NULL,
  child_milestone_id UUID REFERENCES child_milestones(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video', 'document', 'artwork', 'audio')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[],
  is_shared_with_family BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== Assessment Periods ====================
-- Formal assessment periods (quarterly, etc.)
CREATE TABLE IF NOT EXISTS assessment_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quarterly', 'semester', 'annual', 'custom')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== Child Assessments ====================
-- Summary assessments for each child per period
CREATE TABLE IF NOT EXISTS child_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  assessment_period_id UUID NOT NULL REFERENCES assessment_periods(id) ON DELETE CASCADE,
  assessed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_progress TEXT CHECK (overall_progress IN ('below_expectations', 'meeting_expectations', 'exceeding_expectations')),
  strengths TEXT,
  areas_for_growth TEXT,
  recommendations TEXT,
  family_conference_date DATE,
  family_conference_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'shared_with_family')),
  shared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_id, assessment_period_id)
);

-- ==================== Indexes ====================
CREATE INDEX IF NOT EXISTS idx_child_milestones_org ON child_milestones(organization_id);
CREATE INDEX IF NOT EXISTS idx_child_milestones_child ON child_milestones(child_id);
CREATE INDEX IF NOT EXISTS idx_child_milestones_status ON child_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestone_observations_milestone ON milestone_observations(child_milestone_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_child ON learning_plans(child_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_entries_child ON portfolio_entries(child_id);
CREATE INDEX IF NOT EXISTS idx_child_assessments_child ON child_assessments(child_id);
CREATE INDEX IF NOT EXISTS idx_child_assessments_period ON child_assessments(assessment_period_id);

-- ==================== RLS Policies ====================
ALTER TABLE milestone_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plan_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_assessments ENABLE ROW LEVEL SECURITY;

-- Milestone categories/templates are read-only for all authenticated users
CREATE POLICY "milestone_categories_read" ON milestone_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "milestone_templates_read" ON milestone_templates FOR SELECT TO authenticated USING (true);

-- Organization-scoped policies
CREATE POLICY "child_milestones_org" ON child_milestones FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "milestone_observations_org" ON milestone_observations FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "learning_plans_org" ON learning_plans FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "learning_plan_goals_org" ON learning_plan_goals FOR ALL TO authenticated
  USING (learning_plan_id IN (SELECT id FROM learning_plans WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "portfolio_entries_org" ON portfolio_entries FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "assessment_periods_org" ON assessment_periods FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "child_assessments_org" ON child_assessments FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- ==================== Triggers ====================
CREATE OR REPLACE FUNCTION update_milestone_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_child_milestones_timestamp
  BEFORE UPDATE ON child_milestones
  FOR EACH ROW EXECUTE FUNCTION update_milestone_modified_timestamp();

CREATE TRIGGER update_learning_plans_timestamp
  BEFORE UPDATE ON learning_plans
  FOR EACH ROW EXECUTE FUNCTION update_milestone_modified_timestamp();

CREATE TRIGGER update_child_assessments_timestamp
  BEFORE UPDATE ON child_assessments
  FOR EACH ROW EXECUTE FUNCTION update_milestone_modified_timestamp();

-- ==================== Helper Functions ====================

-- Get milestone progress summary for a child
CREATE OR REPLACE FUNCTION get_child_milestone_summary(p_child_id UUID)
RETURNS TABLE (
  category_name TEXT,
  total_milestones BIGINT,
  not_started BIGINT,
  emerging BIGINT,
  developing BIGINT,
  achieved BIGINT,
  exceeding BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.name AS category_name,
    COUNT(*) AS total_milestones,
    COUNT(*) FILTER (WHERE cm.status = 'not_started') AS not_started,
    COUNT(*) FILTER (WHERE cm.status = 'emerging') AS emerging,
    COUNT(*) FILTER (WHERE cm.status = 'developing') AS developing,
    COUNT(*) FILTER (WHERE cm.status = 'achieved') AS achieved,
    COUNT(*) FILTER (WHERE cm.status = 'exceeding') AS exceeding
  FROM child_milestones cm
  JOIN milestone_categories mc ON cm.category_id = mc.id
  WHERE cm.child_id = p_child_id
  GROUP BY mc.name, mc.display_order
  ORDER BY mc.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE child_milestones IS 'Individual child progress on developmental milestones';
COMMENT ON TABLE milestone_templates IS 'Pre-defined developmental milestones based on FL Early Learning Standards';
COMMENT ON TABLE learning_plans IS 'Individual learning plans for children with specific goals and strategies';
COMMENT ON TABLE portfolio_entries IS 'Child learning portfolio with work samples and evidence';

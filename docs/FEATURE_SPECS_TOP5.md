# ChildCare Pro -- Top 5 Missing Features Technical Specifications

**Document Version:** 1.0
**Date:** 2026-02-24
**Status:** Draft -- Ready for Review
**Author:** Claude Code (AI-Assisted Specification)

---

## Table of Contents

1. [SPEC 1: Real-time Allergy Alert System (ICE: 700)](#spec-1-real-time-allergy-alert-system)
2. [SPEC 2: Staff Training Hour Tracking (ICE: 700)](#spec-2-staff-training-hour-tracking)
3. [SPEC 3: Fire Drill Tracking Module (ICE: 630)](#spec-3-fire-drill-tracking-module)
4. [SPEC 4: DCF Licensing Report Generator (ICE: 600)](#spec-4-dcf-licensing-report-generator)
5. [SPEC 5: Parent Portal Dashboard (ICE: 540)](#spec-5-parent-portal-dashboard)

---

## SPEC 1: Real-time Allergy Alert System

**ICE Score:** 700
**Priority:** Critical -- Child Safety
**Estimated Total Effort:** 48-60 hours

### 1.1 Problem Statement

Children's allergy data is stored in the `children` table (`allergies JSONB DEFAULT '[]'` and `dietary_restrictions JSONB DEFAULT '[]'`) but is completely disconnected from the food program module. When staff record meals via `daily_menus` or `meal_records`, there is no cross-referencing against children's known allergens. A child with a peanut allergy could be served a meal containing peanuts without any system warning. This creates a significant liability and safety risk.

### 1.2 Functional Requirements

#### User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| AA-01 | Kitchen Staff | See a real-time alert when a menu item contains allergens that match any enrolled child's allergies | I can prepare safe alternatives before serving | Must Have |
| AA-02 | Teacher | See allergy badges on each child's card in the attendance and meal pages | I know at a glance which children have restrictions | Must Have |
| AA-03 | Director | View a master allergen matrix showing all children and their allergens across classrooms | I can oversee food safety compliance | Must Have |
| AA-04 | Kitchen Staff | Be required to acknowledge allergen conflicts before recording a meal as served | No meal is served without explicit awareness of allergy risks | Must Have |
| AA-05 | Parent | Receive a push notification if my child's classroom is being served a meal flagged for their allergen | I have visibility into my child's safety | Should Have |
| AA-06 | Director | See an allergy incident audit trail showing all flagged meals and their acknowledgments | I can demonstrate compliance in DCF audits | Should Have |
| AA-07 | Teacher | Scan a child's allergy card via QR or lookup during meal time | I can quickly verify dietary restrictions during busy meal transitions | Could Have |
| AA-08 | Kitchen Staff | See suggested substitutions when an allergen conflict is detected | I can quickly prepare a safe alternative | Could Have |

#### Business Rules

1. **Allergen matching** must be case-insensitive and support both English and Spanish allergen names.
2. **Blocking alerts** (must-acknowledge) are required for the top 9 FDA allergens: milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soybeans, sesame.
3. **Warning alerts** (non-blocking) are issued for other dietary restrictions (vegetarian, halal, kosher, etc.).
4. A meal **cannot be marked as served** to a child with a matching allergen unless the staff member explicitly acknowledges the alert and provides a substitution note.
5. All allergen alerts and acknowledgments must be logged to an audit table.
6. Parent notifications are sent only for blocking-level alerts, not warnings.

### 1.3 Technical Requirements

#### 1.3.1 Database Schema Changes

```sql
-- New migration: 025_allergy_alerts.sql

-- ==================== Allergen Registry ====================
-- Canonical allergen list for consistent matching
CREATE TABLE IF NOT EXISTS allergen_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL UNIQUE,        -- 'Peanuts'
  name_es TEXT NOT NULL,               -- 'Cacahuetes/Mani'
  category TEXT NOT NULL,              -- 'fda_top9', 'common', 'dietary'
  severity TEXT NOT NULL DEFAULT 'high', -- 'high' (blocking), 'medium' (warning), 'low' (info)
  aliases TEXT[] DEFAULT '{}',         -- ['cacahuate', 'groundnut', 'mani']
  icon TEXT,                           -- Emoji or icon name
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: FDA Top 9 + common dietary restrictions
INSERT INTO allergen_registry (name_en, name_es, category, severity, aliases) VALUES
  ('Milk', 'Leche', 'fda_top9', 'high', '{"dairy", "lactose", "casein", "whey", "lacteo", "lactosa"}'),
  ('Eggs', 'Huevos', 'fda_top9', 'high', '{"egg", "huevo", "albumin", "albumina"}'),
  ('Fish', 'Pescado', 'fda_top9', 'high', '{"fish", "cod", "salmon", "tuna", "bacalao", "atun"}'),
  ('Shellfish', 'Mariscos', 'fda_top9', 'high', '{"shrimp", "crab", "lobster", "camaron", "cangrejo"}'),
  ('Tree Nuts', 'Frutos Secos', 'fda_top9', 'high', '{"almond", "walnut", "cashew", "pistachio", "almendra", "nuez"}'),
  ('Peanuts', 'Cacahuetes', 'fda_top9', 'high', '{"peanut", "mani", "cacahuate", "groundnut"}'),
  ('Wheat', 'Trigo', 'fda_top9', 'high', '{"gluten", "flour", "harina"}'),
  ('Soybeans', 'Soja', 'fda_top9', 'high', '{"soy", "soya", "tofu", "edamame"}'),
  ('Sesame', 'Sesamo', 'fda_top9', 'high', '{"ajonjoli", "tahini"}'),
  ('Vegetarian', 'Vegetariano', 'dietary', 'medium', '{"veggie", "no meat", "sin carne"}'),
  ('Vegan', 'Vegano', 'dietary', 'medium', '{"plant-based", "no animal"}'),
  ('Halal', 'Halal', 'dietary', 'medium', '{}'),
  ('Kosher', 'Kosher', 'dietary', 'medium', '{}'),
  ('Gluten Free', 'Sin Gluten', 'dietary', 'medium', '{"celiac", "celiaco"}')
ON CONFLICT (name_en) DO NOTHING;

-- ==================== Menu Item Allergens ====================
-- Link allergens to menu items served in daily_menus
ALTER TABLE daily_menus ADD COLUMN IF NOT EXISTS
  allergens_present TEXT[] DEFAULT '{}';
ALTER TABLE daily_menus ADD COLUMN IF NOT EXISTS
  allergen_check_completed BOOLEAN DEFAULT false;
ALTER TABLE daily_menus ADD COLUMN IF NOT EXISTS
  allergen_checked_by UUID REFERENCES profiles(id);
ALTER TABLE daily_menus ADD COLUMN IF NOT EXISTS
  allergen_checked_at TIMESTAMPTZ;

-- ==================== Allergy Alert Log ====================
CREATE TABLE IF NOT EXISTS allergy_alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  daily_menu_id UUID REFERENCES daily_menus(id) ON DELETE SET NULL,
  meal_record_id UUID REFERENCES meal_records(id) ON DELETE SET NULL,

  -- Alert details
  alert_type TEXT NOT NULL,            -- 'blocking', 'warning'
  allergen_name TEXT NOT NULL,         -- 'Peanuts'
  menu_item_description TEXT,          -- What meal triggered it
  child_allergens TEXT[],              -- Child's full allergen list

  -- Resolution
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  substitution_provided TEXT,          -- 'Served sunflower butter instead of peanut butter'
  resolution_action TEXT NOT NULL DEFAULT 'pending',
    -- 'pending', 'substituted', 'child_skipped_meal', 'false_alarm', 'parent_approved'

  -- Parent notification
  parent_notified BOOLEAN DEFAULT false,
  parent_notified_at TIMESTAMPTZ,
  parent_notification_method TEXT,     -- 'push', 'email', 'sms'

  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_allergy_alerts_org_date ON allergy_alert_log(organization_id, date);
CREATE INDEX idx_allergy_alerts_child ON allergy_alert_log(child_id);
CREATE INDEX idx_allergy_alerts_unack ON allergy_alert_log(acknowledged) WHERE acknowledged = false;

-- RLS
ALTER TABLE allergen_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view allergen registry"
  ON allergen_registry FOR SELECT USING (true);

CREATE POLICY "Users can view alerts in their organization"
  ON allergy_alert_log FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Staff can manage alerts"
  ON allergy_alert_log FOR ALL
  USING (organization_id = get_user_organization_id());

-- ==================== Cross-reference Function ====================
CREATE OR REPLACE FUNCTION check_meal_allergens(
  p_organization_id UUID,
  p_daily_menu_id UUID,
  p_allergens_present TEXT[]
)
RETURNS TABLE (
  child_id UUID,
  child_name TEXT,
  child_allergens TEXT[],
  matching_allergens TEXT[],
  alert_type TEXT,
  classroom_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.first_name || ' ' || c.last_name,
    ARRAY(SELECT jsonb_array_elements_text(c.allergies)),
    ARRAY(
      SELECT DISTINCT unnest(p_allergens_present)
      INTERSECT
      SELECT lower(jsonb_array_elements_text(c.allergies))
    ),
    CASE
      WHEN EXISTS (
        SELECT 1 FROM allergen_registry ar
        WHERE ar.severity = 'high'
        AND (
          lower(ar.name_en) = ANY(
            SELECT lower(unnest(p_allergens_present))
            INTERSECT
            SELECT lower(jsonb_array_elements_text(c.allergies))
          )
          OR ar.name_es = ANY(
            SELECT unnest(p_allergens_present)
            INTERSECT
            SELECT jsonb_array_elements_text(c.allergies)
          )
        )
      ) THEN 'blocking'
      ELSE 'warning'
    END,
    c.classroom_id
  FROM children c
  WHERE c.organization_id = p_organization_id
    AND c.status = 'active'
    AND c.allergies IS NOT NULL
    AND jsonb_array_length(c.allergies) > 0
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(c.allergies) child_allergen
      WHERE lower(child_allergen) = ANY(
        SELECT lower(unnest(p_allergens_present))
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.3.2 API Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `app/api/allergy-alerts/check/route.ts` | POST | Cross-reference a daily menu's allergens against enrolled children | Staff+ |
| `app/api/allergy-alerts/acknowledge/route.ts` | POST | Acknowledge a blocking alert with substitution info | Staff+ |
| `app/api/allergy-alerts/history/route.ts` | GET | Get allergen alert history with filters (date range, child, classroom) | Director+ |
| `app/api/allergy-alerts/matrix/route.ts` | GET | Get allergen matrix (all children x all allergens) | Director+ |

#### 1.3.3 Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AllergenBadge` | `shared/components/ui/glass-allergen-badge.tsx` | Pill badge showing allergen name with severity color |
| `AllergyAlertBanner` | `features/food-program/components/AllergyAlertBanner.tsx` | Full-width blocking banner shown when allergen conflicts detected |
| `AllergyAcknowledgeModal` | `features/food-program/components/AllergyAcknowledgeModal.tsx` | Modal requiring substitution note before serving |
| `AllergenMatrix` | `features/food-program/components/AllergenMatrix.tsx` | Classroom-grouped matrix of children x allergens |
| `ChildAllergyCard` | `features/children/components/ChildAllergyCard.tsx` | Compact allergy summary shown on child cards |
| `MealAllergenChecker` | `features/food-program/components/MealAllergenChecker.tsx` | Multi-select allergen tagger for daily menu creation |

#### 1.3.4 Services

| Service | Location | Methods |
|---------|----------|---------|
| `allergy-alert.service.ts` | `features/food-program/services/` | `checkMealAllergens()`, `acknowledgeAlert()`, `getAlertHistory()`, `getAllergenMatrix()` |

#### 1.3.5 Type Definitions

```typescript
// shared/types/allergy-alerts.ts

export type AllergenSeverity = 'high' | 'medium' | 'low'
export type AlertType = 'blocking' | 'warning'
export type AlertResolution = 'pending' | 'substituted' | 'child_skipped_meal' | 'false_alarm' | 'parent_approved'

export interface Allergen {
  id: string
  name_en: string
  name_es: string
  category: 'fda_top9' | 'common' | 'dietary'
  severity: AllergenSeverity
  aliases: string[]
  icon: string | null
}

export interface AllergyAlert {
  id: string
  organization_id: string
  child_id: string
  daily_menu_id: string | null
  meal_record_id: string | null
  alert_type: AlertType
  allergen_name: string
  menu_item_description: string | null
  child_allergens: string[]
  acknowledged: boolean
  acknowledged_by: string | null
  acknowledged_at: string | null
  substitution_provided: string | null
  resolution_action: AlertResolution
  parent_notified: boolean
  parent_notified_at: string | null
  date: string
  created_at: string
  child?: {
    id: string
    first_name: string
    last_name: string
    classroom_id: string | null
    photo_url: string | null
  }
}

export interface AllergenCheckResult {
  child_id: string
  child_name: string
  child_allergens: string[]
  matching_allergens: string[]
  alert_type: AlertType
  classroom_id: string | null
}

export interface AllergenMatrixEntry {
  child_id: string
  child_name: string
  classroom_name: string
  allergens: string[]
  dietary_restrictions: string[]
}

export interface AcknowledgeAlertPayload {
  alert_id: string
  substitution_provided: string
  resolution_action: AlertResolution
}
```

### 1.4 Acceptance Criteria

| ID | Criterion | Testable Condition |
|----|-----------|--------------------|
| AC-01 | Allergy cross-reference works | Given a daily menu with "peanut butter sandwich" tagged with "Peanuts" allergen, when checked against enrolled children, then all children with peanut-related allergies are returned |
| AC-02 | Blocking alerts prevent serving | Given a child with a "Milk" allergy and a meal tagged with "Milk", when a staff member tries to mark the meal as served for that child, then a modal blocks the action until acknowledged |
| AC-03 | Acknowledgment requires substitution | Given a blocking alert, when the staff acknowledges it, then they must enter a non-empty substitution note |
| AC-04 | Alert audit trail is persisted | Given any allergen alert (blocking or warning), when it is created or resolved, then a record exists in `allergy_alert_log` with all relevant metadata |
| AC-05 | Parent notification fires | Given a blocking alert for a child, when the alert is triggered, then a push notification is sent to the child's family contact |
| AC-06 | Allergen badges display on child cards | Given a child with `allergies: ["Peanuts", "Milk"]`, when the child card is rendered in attendance or meal pages, then two colored badges ("Peanuts" in red, "Milk" in red) are visible |
| AC-07 | Allergen matrix loads correctly | Given 30 active children with various allergies, when the director opens the allergen matrix page, then all children are grouped by classroom with their allergens displayed in a grid |
| AC-08 | Multi-language matching | Given a child with allergy "leche" (Spanish) and a meal tagged with "Milk" (English), when the cross-reference runs, then the match is detected |

### 1.5 UI Wireframe

```
+------------------------------------------------------------------+
| FOOD PROGRAM > RECORD DAILY MEAL                                 |
+------------------------------------------------------------------+
|                                                                  |
| Date: [2026-02-24]  Meal: [Lunch v]                             |
|                                                                  |
| Menu Item: [Peanut Butter & Jelly Sandwich          ]            |
| Allergens: [x] Peanuts  [x] Wheat  [ ] Milk  [ ] Eggs  [+More] |
|                                                                  |
+==================================================================+
| !! ALLERGY ALERT -- 3 CHILDREN AFFECTED                          |
|                                                                  |
| +------------------------------------------------------------+  |
| | BLOCKING: Sofia Martinez (Sala Mariposas)                   |  |
| | Allergens: [Peanuts]  <-- matches meal allergen             |  |
| | [!] Must provide substitution before serving                |  |
| | [ Acknowledge & Provide Substitution ]                      |  |
| +------------------------------------------------------------+  |
|                                                                  |
| +------------------------------------------------------------+  |
| | BLOCKING: Diego Ramirez (Sala Estrellas)                    |  |
| | Allergens: [Peanuts] [Wheat]  <-- matches 2 allergens      |  |
| | [!] Must provide substitution before serving                |  |
| | [ Acknowledge & Provide Substitution ]                      |  |
| +------------------------------------------------------------+  |
|                                                                  |
| +------------------------------------------------------------+  |
| | WARNING: Emma Lopez (Sala Exploradores)                     |  |
| | Dietary: [Gluten Free]  <-- matches Wheat                  |  |
| | [i] Review recommended                                      |  |
| +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
| Children Served:  15/22  |  Alerts Resolved: 1/3                 |
| [ Save Meal Record ]  (disabled until all blocking alerts ack'd) |
+------------------------------------------------------------------+
```

```
+------------------------------------------------------------------+
| ACKNOWLEDGE ALLERGY ALERT (Modal)                                 |
+------------------------------------------------------------------+
|                                                                  |
|  Child: Sofia Martinez                                           |
|  Classroom: Sala Mariposas                                       |
|  Allergy: PEANUTS (FDA Top 9 -- HIGH SEVERITY)                  |
|  Menu Item: Peanut Butter & Jelly Sandwich                       |
|                                                                  |
|  Substitution Provided: *                                        |
|  +----------------------------------------------------------+   |
|  | Served sunflower butter sandwich instead                  |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  Resolution:                                                     |
|  (o) Substituted alternative meal                                |
|  ( ) Child skipped this meal                                     |
|  ( ) Parent pre-approved this item                               |
|  ( ) False alarm -- allergen not actually present                |
|                                                                  |
|  [ ] Notify parent about this alert                              |
|                                                                  |
|  [ Cancel ]                    [ Confirm Acknowledgment ]        |
+------------------------------------------------------------------+
```

### 1.6 Dependencies on Existing Code

| Dependency | File/Table | Relationship |
|------------|-----------|--------------|
| Children allergies | `children.allergies` (JSONB) in `001_initial_schema.sql` | Read allergens for cross-reference |
| Children dietary restrictions | `children.dietary_restrictions` (JSONB) in `001_initial_schema.sql` | Read dietary info for warnings |
| Daily menus | `daily_menus` table in `009_food_program.sql` | Attach allergen tags; block saving |
| Meal records | `meal_records` table in `009_food_program.sql` | Block individual child serving |
| Meal attendance | `MealAttendance` type in `shared/types/food-program.ts` | Extend with allergy check |
| Food program record page | `app/dashboard/food-program/record/page.tsx` | Integrate alert banners |
| Child card components | Various child listing components | Add allergy badges |
| Push notification service | `features/notifications/services/push.service.ts` | Send parent alerts |
| Organization context | `shared/lib/organization-context.ts` | Multi-tenant scoping |

### 1.7 Effort Breakdown

| Task | Hours |
|------|-------|
| Database migration + seed data | 4 |
| Allergen matching function (DB + service) | 8 |
| API routes (4 endpoints) | 6 |
| AllergyAlertBanner component | 6 |
| AcknowledgeModal component | 4 |
| AllergenMatrix dashboard page | 6 |
| Child card allergy badges integration | 3 |
| Parent notification integration | 4 |
| Type definitions + Zod schemas | 2 |
| Integration with food-program/record page | 5 |
| Unit + integration tests | 6 |
| **Total** | **54 hours** |

---

## SPEC 2: Staff Training Hour Tracking

**ICE Score:** 700
**Priority:** High -- Compliance
**Estimated Total Effort:** 40-50 hours

### 2.1 Problem Statement

Florida DCF requires child care personnel to complete specific training hour minimums annually. The current system (migration `004_staff_certifications.sql`) tracks **certifications** (CDA, CPR, 45-hour, 40-hour initial) and has a basic annual in-service hour counter on the `profiles` table (`annual_training_hours_completed`), but it lacks:

- **Detailed training record CRUD** -- individual training sessions with dates, topics, providers, and hours are not tracked granularly.
- **Accumulation dashboard** -- no visual progress bars showing hours completed vs. required for each staff member by fiscal year.
- **Expiry/deadline alerts** -- no automated warnings when a staff member is approaching the June 30 fiscal year deadline with insufficient hours.
- **PDF export for DCF audits** -- no way to generate a compliance report showing all training records for a staff member or the entire center.
- **Training provider/event management** -- no way to register a training event once and assign it to multiple staff members.

The existing `app/dashboard/staff/training/page.tsx` page allows bulk logging of in-service hours but does not persist individual training session records. The `certificationService.logInServiceHours()` method only increments the counter on the profile; it does not create a detailed record.

### 2.2 Functional Requirements

#### User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| TH-01 | Director | Create a training session record (date, topic, provider, hours, attendees) | I have a detailed log of all training conducted | Must Have |
| TH-02 | Director | View each staff member's training hour progress vs. their annual requirement | I can identify who needs more training before the fiscal year deadline | Must Have |
| TH-03 | Director | See a dashboard showing center-wide training compliance status | I can quickly assess overall compliance | Must Have |
| TH-04 | Staff Member | View my own training history and hour balance | I know how many hours I still need | Must Have |
| TH-05 | Director | Receive alerts when staff are behind pace (e.g., <5 hours by January, <8 by April) | I can intervene before the deadline | Should Have |
| TH-06 | Director | Export a PDF training report per staff member for DCF audits | I can provide documentation during inspections | Should Have |
| TH-07 | Director | Upload a certificate or attendance sheet scan for each training record | I have proof of attendance on file | Should Have |
| TH-08 | Director | Create a recurring training event template (e.g., monthly CPR refresher) | I can reuse common training sessions | Could Have |

#### Business Rules

1. **Florida DCF Fiscal Year**: July 1 through June 30.
2. **Annual in-service requirement**: 10 hours per fiscal year for all child care personnel (not just teachers).
3. **40-hour introductory training**: Must be completed within the first year of employment. Not tracked here (already in certifications).
4. **Training topics**: Must include at least one hour each in the following areas per fiscal year: (a) child development, (b) health/safety/nutrition, (c) behavior management. The system should track which required topics have been covered.
5. **Hour increments**: Training hours can be logged in 0.5-hour increments.
6. **Duplicate prevention**: The same staff member cannot be logged for the same training session twice.
7. **Retroactive logging**: Training can be logged retroactively for the current fiscal year only.

### 2.3 Technical Requirements

#### 2.3.1 Database Schema Changes

```sql
-- New migration: 026_training_hours.sql

-- ==================== Training Events ====================
-- A training event is a session that one or more staff members attend
CREATE TABLE IF NOT EXISTS training_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Event info
  title TEXT NOT NULL,
  description TEXT,
  training_topic TEXT NOT NULL,
    -- 'child_development', 'health_safety', 'nutrition', 'behavior_management',
    -- 'special_needs', 'early_literacy', 'safe_sleep', 'child_abuse_prevention',
    -- 'emergency_procedures', 'communication', 'curriculum', 'cpr_first_aid', 'other'
  custom_topic TEXT,                    -- When topic = 'other'

  -- Provider
  provider_name TEXT,                   -- 'DCF Online', 'Red Cross', 'In-house'
  provider_type TEXT,                   -- 'internal', 'external', 'online'
  instructor_name TEXT,

  -- Schedule
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  duration_hours DECIMAL(4,1) NOT NULL, -- 0.5 min increment

  -- Location
  location TEXT,                        -- 'Conference Room A', 'Online', 'Fire Station #5'

  -- Documentation
  certificate_template_url TEXT,
  attachment_urls TEXT[] DEFAULT '{}',

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  fiscal_year TEXT NOT NULL,            -- '2025-2026'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_events_org ON training_events(organization_id);
CREATE INDEX idx_training_events_date ON training_events(event_date);
CREATE INDEX idx_training_events_fy ON training_events(fiscal_year);

-- ==================== Training Attendance ====================
-- Records which staff attended which training event
CREATE TABLE IF NOT EXISTS training_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  training_event_id UUID NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Attendance
  attended BOOLEAN DEFAULT true,
  hours_credited DECIMAL(4,1) NOT NULL, -- Can differ from event duration (partial attendance)

  -- Documentation
  certificate_url TEXT,                 -- Individual certificate/scan
  notes TEXT,

  -- Verification
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(training_event_id, profile_id) -- Prevent duplicate logging
);

CREATE INDEX idx_training_attendance_profile ON training_attendance(profile_id);
CREATE INDEX idx_training_attendance_event ON training_attendance(training_event_id);

-- ==================== Training Hour Summary View ====================
CREATE OR REPLACE VIEW training_hours_summary AS
SELECT
  p.id AS profile_id,
  p.organization_id,
  p.first_name,
  p.last_name,
  p.role,
  p.hire_date,
  te.fiscal_year,
  SUM(ta.hours_credited) AS total_hours,
  10.0 AS required_hours,
  10.0 - COALESCE(SUM(ta.hours_credited), 0) AS remaining_hours,
  ROUND((COALESCE(SUM(ta.hours_credited), 0) / 10.0) * 100, 1) AS completion_percentage,
  COUNT(DISTINCT te.training_topic) AS unique_topics_covered,
  ARRAY_AGG(DISTINCT te.training_topic) AS topics_covered
FROM profiles p
LEFT JOIN training_attendance ta ON ta.profile_id = p.id AND ta.attended = true
LEFT JOIN training_events te ON te.id = ta.training_event_id
WHERE p.role != 'parent' AND p.status = 'active'
GROUP BY p.id, p.organization_id, p.first_name, p.last_name, p.role, p.hire_date, te.fiscal_year;

-- RLS
ALTER TABLE training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view training events in their org"
  ON training_events FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Directors can manage training events"
  ON training_events FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

CREATE POLICY "Users can view training attendance in their org"
  ON training_attendance FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Directors can manage training attendance"
  ON training_attendance FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );
```

#### 2.3.2 API Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `app/api/training-events/route.ts` | GET, POST | List/create training events | Director+ |
| `app/api/training-events/[id]/route.ts` | GET, PUT, DELETE | CRUD single training event | Director+ |
| `app/api/training-events/[id]/attendance/route.ts` | GET, POST | Manage attendees for an event | Director+ |
| `app/api/training-hours/summary/route.ts` | GET | Get training hour summary for all staff (or single via query param) | Staff (own), Director (all) |
| `app/api/training-hours/export/route.ts` | GET | Generate PDF training report | Director+ |
| `app/api/training-hours/alerts/route.ts` | GET | Get staff who are behind pace | Director+ |

#### 2.3.3 Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `TrainingEventForm` | `features/staff/components/TrainingEventForm.tsx` | Create/edit training events with attendee selection |
| `TrainingEventList` | `features/staff/components/TrainingEventList.tsx` | List training events with filters |
| `TrainingHoursProgressBar` | `features/staff/components/TrainingHoursProgressBar.tsx` | Visual progress bar (hours/10) per staff member |
| `TrainingComplianceDashboard` | Integrated into `app/dashboard/staff/compliance/page.tsx` | Center-wide training hour overview |
| `StaffTrainingHistory` | `features/staff/components/StaffTrainingHistory.tsx` | Per-staff member training record table |
| `TrainingHoursPDFExport` | `features/staff/utils/training-hours-pdf.ts` | PDF generation using @react-pdf/renderer |

#### 2.3.4 Pages

| Page | Route | Purpose |
|------|-------|---------|
| Training Events | `app/dashboard/staff/training/events/page.tsx` | List all training events for the fiscal year |
| New Training Event | `app/dashboard/staff/training/events/new/page.tsx` | Create a training event with attendees |
| Training Hours Dashboard | `app/dashboard/staff/training/hours/page.tsx` | All staff progress toward annual requirement |
| Staff Training Detail | Enhance `app/dashboard/staff/[id]/certifications/page.tsx` | Add training hours tab |

#### 2.3.5 Type Definitions

```typescript
// shared/types/training-hours.ts

export type TrainingTopic =
  | 'child_development'
  | 'health_safety'
  | 'nutrition'
  | 'behavior_management'
  | 'special_needs'
  | 'early_literacy'
  | 'safe_sleep'
  | 'child_abuse_prevention'
  | 'emergency_procedures'
  | 'communication'
  | 'curriculum'
  | 'cpr_first_aid'
  | 'other'

export type ProviderType = 'internal' | 'external' | 'online'

export interface TrainingEvent {
  id: string
  organization_id: string
  title: string
  description: string | null
  training_topic: TrainingTopic
  custom_topic: string | null
  provider_name: string | null
  provider_type: ProviderType | null
  instructor_name: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  duration_hours: number
  location: string | null
  fiscal_year: string
  attachment_urls: string[]
  created_by: string | null
  created_at: string
  updated_at: string
  attendance_count?: number
}

export interface TrainingAttendance {
  id: string
  organization_id: string
  training_event_id: string
  profile_id: string
  attended: boolean
  hours_credited: number
  certificate_url: string | null
  notes: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
  profile?: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
  training_event?: TrainingEvent
}

export interface TrainingHoursSummary {
  profile_id: string
  first_name: string
  last_name: string
  role: string
  fiscal_year: string
  total_hours: number
  required_hours: number
  remaining_hours: number
  completion_percentage: number
  unique_topics_covered: number
  topics_covered: TrainingTopic[]
  required_topics_missing: TrainingTopic[]
  pace_status: 'on_track' | 'behind' | 'at_risk' | 'complete'
}

export interface TrainingEventFormData {
  title: string
  description?: string
  training_topic: TrainingTopic
  custom_topic?: string
  provider_name?: string
  provider_type?: ProviderType
  instructor_name?: string
  event_date: string
  start_time?: string
  end_time?: string
  duration_hours: number
  location?: string
  attendee_ids: string[]
}
```

### 2.4 Acceptance Criteria

| ID | Criterion | Testable Condition |
|----|-----------|--------------------|
| AC-01 | Training event creation | Given a director fills out the training event form with title, topic, date, hours, and selects 5 attendees, when submitted, then a `training_events` record is created and 5 `training_attendance` records are created |
| AC-02 | Hour accumulation | Given a staff member has attended 3 training events for 2, 3, and 1.5 hours respectively, when the summary is queried, then `total_hours = 6.5` and `remaining_hours = 3.5` |
| AC-03 | Fiscal year boundary | Given a training event dated June 15 (fiscal year 2025-2026) and another dated July 5 (fiscal year 2026-2027), when viewing the 2025-2026 summary, then only the June 15 hours count |
| AC-04 | Duplicate prevention | Given a staff member is already logged for event X, when attempting to log them again for event X, then a unique constraint error is returned |
| AC-05 | Progress bar display | Given a staff member with 7 out of 10 required hours, when the dashboard renders, then a progress bar shows 70% filled |
| AC-06 | Behind-pace alert | Given it is January 15 and a staff member has only 2 hours (expected pace ~5 hours by midpoint), then they appear in the "Behind Pace" alert list |
| AC-07 | PDF export | Given a director clicks "Export PDF" for a staff member, then a PDF is generated containing: staff name, all training records, total hours, and completion status |
| AC-08 | Required topic tracking | Given a staff member has completed 10 hours but all in "curriculum" topic, when viewing their summary, then a warning shows they are missing required topics (child development, health/safety, behavior management) |

### 2.5 UI Wireframe

```
+------------------------------------------------------------------+
| STAFF > TRAINING HOURS DASHBOARD                                  |
| Fiscal Year: [2025-2026 v]                      [ + New Event ]  |
+------------------------------------------------------------------+
|                                                                  |
| +--------+  +--------+  +--------+  +--------+  +--------+      |
| | 12     |  | 10     |  | 83%    |  | 2      |  | 1      |      |
| | Staff  |  | Compliant | Rate   |  | Behind |  | At Risk|      |
| +--------+  +--------+  +--------+  +--------+  +--------+      |
|                                                                  |
| +-----------+---------+----------+----------+----------+------+  |
| | Staff     | Hours   | Progress | Topics   | Status   | Act  |  |
| +-----------+---------+----------+----------+----------+------+  |
| | Maria G.  | 10/10   | [======] | 5/3 req  | Complete | [>]  |  |
| | Juan P.   |  8/10   | [====  ] | 3/3 req  | On Track | [>]  |  |
| | Ana R.    |  4/10   | [==    ] | 1/3 req  | Behind   | [>]  |  |
| | Carlos M. |  2/10   | [=     ] | 1/3 req  | At Risk  | [>]  |  |
| +-----------+---------+----------+----------+----------+------+  |
|                                                                  |
| RECENT TRAINING EVENTS                                           |
| +------------------------------------------------------------+  |
| | Feb 15 - Child Development Workshop (3 hrs) - 8 attendees  |  |
| | Feb 01 - CPR/First Aid Recertification (4 hrs) - 12 staff  |  |
| | Jan 20 - Behavior Management Seminar (2 hrs) - 6 attendees |  |
| +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

### 2.6 Dependencies on Existing Code

| Dependency | File/Table | Relationship |
|------------|-----------|--------------|
| Staff profiles | `profiles` table, `staffService` | Source of staff list |
| Existing certification service | `features/staff/services/certification.service.ts` | Extends with training hour methods |
| Compliance page | `app/dashboard/staff/compliance/page.tsx` | Integrate training hours section |
| Existing training page | `app/dashboard/staff/training/page.tsx` | Refactor to use new training events model |
| Fiscal year calculation | Already in `004_staff_certifications.sql` check_staff_compliance function | Reuse fiscal year logic |
| PDF renderer | `@react-pdf/renderer` (already in `package.json`) | Generate training reports |
| Organization context | `shared/lib/organization-context.ts` | Multi-tenant scoping |
| i18n | `shared/lib/i18n/` | Bilingual labels |

### 2.7 Effort Breakdown

| Task | Hours |
|------|-------|
| Database migration + views | 4 |
| API routes (6 endpoints) | 8 |
| Training event service | 4 |
| Training event form component | 5 |
| Training hours dashboard page | 6 |
| Progress bar + pace calculation | 3 |
| Staff training detail integration | 3 |
| PDF export utility | 4 |
| Refactor existing training page | 3 |
| Type definitions + Zod schemas | 2 |
| Unit + integration tests | 4 |
| **Total** | **46 hours** |

---

## SPEC 3: Fire Drill Tracking Module

**ICE Score:** 630
**Priority:** High -- Compliance
**Estimated Total Effort:** 32-40 hours

### 3.1 Problem Statement

Florida DCF Rule 65C-22.002(4)(d) requires licensed child care facilities to conduct monthly fire drills and maintain documentation of each drill. Currently, ChildCare Pro has no fire drill tracking capability whatsoever. Facilities must keep physical paper logs, which are prone to being lost, incomplete, or unorganized during DCF inspections. This is one of the most commonly cited violations during licensing inspections.

### 3.2 Functional Requirements

#### User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| FD-01 | Director | Schedule fire drills with recurring monthly reminders | I never miss the monthly requirement | Must Have |
| FD-02 | Director | Log a completed fire drill with date, time, duration, participants, and notes | I have a permanent record for DCF | Must Have |
| FD-03 | Director | See a compliance calendar showing which months have completed drills and which are overdue | I can quickly identify gaps | Must Have |
| FD-04 | Director | Record the evacuation time (from alarm to last person at assembly point) | I can track improvement over time | Must Have |
| FD-05 | Teacher | Be notified when a fire drill is scheduled for today | I can prepare my classroom | Should Have |
| FD-06 | Director | Record issues found during the drill (blocked exit, child unaccounted for, etc.) | I can track corrective actions | Should Have |
| FD-07 | Director | Export a fire drill compliance report as PDF for DCF inspections | I can present organized documentation | Should Have |
| FD-08 | Director | See historical trends (avg evacuation time, issues frequency) | I can improve emergency preparedness | Could Have |

#### Business Rules

1. **Monthly requirement**: At least one fire drill per calendar month is required by Florida DCF.
2. **Drill timing**: Drills should vary in time of day across months (morning, midday, afternoon).
3. **Evacuation time**: Must be recorded in seconds. Florida DCF recommends under 3 minutes.
4. **Participants**: All present children and staff on the day of the drill must be accounted for. The system should cross-reference with attendance records.
5. **Weather exceptions**: If a drill cannot be conducted due to weather, this must be documented with a make-up drill within 48 hours.
6. **Fire marshal visits**: If the local fire marshal conducts an inspection, this should also be logged as a compliance event.

### 3.3 Technical Requirements

#### 3.3.1 Database Schema Changes

```sql
-- New migration: 027_fire_drills.sql

-- ==================== Fire Drills ====================
CREATE TABLE IF NOT EXISTS fire_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Schedule
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  drill_type TEXT NOT NULL DEFAULT 'fire',
    -- 'fire', 'tornado', 'lockdown', 'fire_marshal_inspection'

  -- Execution
  executed BOOLEAN DEFAULT false,
  executed_date DATE,
  executed_time TIME,
  alarm_activated_at TIMESTAMPTZ,
  last_person_clear_at TIMESTAMPTZ,
  evacuation_seconds INTEGER,           -- Time from alarm to all-clear

  -- Participants
  children_present INTEGER,
  children_evacuated INTEGER,
  staff_present INTEGER,
  staff_evacuated INTEGER,
  visitors_present INTEGER DEFAULT 0,

  -- Details
  assembly_point TEXT,                  -- 'Front parking lot', 'Back playground'
  weather_conditions TEXT,              -- 'Clear', 'Rainy', 'Cold'
  drill_leader_id UUID REFERENCES profiles(id),

  -- Issues & corrective actions
  issues_found JSONB DEFAULT '[]',
    -- [{description: "Exit B was blocked by chairs", severity: "high",
    --   corrective_action: "Cleared immediately", resolved: true}]

  -- Documentation
  notes TEXT,
  attachment_urls TEXT[] DEFAULT '{}',

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled',
    -- 'scheduled', 'completed', 'missed', 'rescheduled', 'cancelled'
  cancellation_reason TEXT,
  rescheduled_to UUID REFERENCES fire_drills(id),

  -- Metadata
  conducted_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fire_drills_org ON fire_drills(organization_id);
CREATE INDEX idx_fire_drills_date ON fire_drills(scheduled_date);
CREATE INDEX idx_fire_drills_status ON fire_drills(status);
CREATE INDEX idx_fire_drills_type ON fire_drills(drill_type);

-- ==================== Fire Drill Participants ====================
-- Detailed participant tracking (optional -- for linking to attendance)
CREATE TABLE IF NOT EXISTS fire_drill_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fire_drill_id UUID NOT NULL REFERENCES fire_drills(id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL,        -- 'child', 'staff', 'visitor'
  participant_id UUID,                   -- child_id or profile_id (NULL for visitors)
  participant_name TEXT,                 -- For visitors or fallback
  classroom_id UUID REFERENCES classrooms(id),
  evacuated BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fdp_drill ON fire_drill_participants(fire_drill_id);

-- ==================== Compliance View ====================
CREATE OR REPLACE VIEW fire_drill_compliance AS
WITH months AS (
  SELECT generate_series(
    date_trunc('year', CURRENT_DATE),
    date_trunc('month', CURRENT_DATE),
    '1 month'::interval
  )::date AS month_start
),
drills_by_month AS (
  SELECT
    fd.organization_id,
    date_trunc('month', fd.executed_date)::date AS drill_month,
    COUNT(*) AS drill_count,
    MIN(fd.evacuation_seconds) AS best_time,
    AVG(fd.evacuation_seconds) AS avg_time,
    BOOL_OR(jsonb_array_length(fd.issues_found) > 0) AS had_issues
  FROM fire_drills fd
  WHERE fd.status = 'completed' AND fd.executed = true
  GROUP BY fd.organization_id, date_trunc('month', fd.executed_date)
)
SELECT
  m.month_start,
  d.organization_id,
  COALESCE(d.drill_count, 0) AS drills_completed,
  CASE WHEN d.drill_count > 0 THEN true ELSE false END AS is_compliant,
  d.best_time,
  d.avg_time,
  d.had_issues
FROM months m
LEFT JOIN drills_by_month d ON d.drill_month = m.month_start;

-- RLS
ALTER TABLE fire_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_drill_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fire drills in their org"
  ON fire_drills FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Directors can manage fire drills"
  ON fire_drills FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

CREATE POLICY "Users can view fire drill participants in their org"
  ON fire_drill_participants FOR SELECT
  USING (
    fire_drill_id IN (
      SELECT id FROM fire_drills WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Directors can manage fire drill participants"
  ON fire_drill_participants FOR ALL
  USING (
    fire_drill_id IN (
      SELECT id FROM fire_drills WHERE organization_id = get_user_organization_id()
    ) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );
```

#### 3.3.2 API Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `app/api/fire-drills/route.ts` | GET, POST | List/create fire drills | Director+ |
| `app/api/fire-drills/[id]/route.ts` | GET, PUT, DELETE | CRUD single fire drill | Director+ |
| `app/api/fire-drills/[id]/execute/route.ts` | POST | Mark a drill as executed with results | Director+ |
| `app/api/fire-drills/compliance/route.ts` | GET | Get monthly compliance status for current year | Director+ |
| `app/api/fire-drills/export/route.ts` | GET | Generate PDF compliance report | Director+ |

#### 3.3.3 Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `FireDrillCalendar` | `features/fire-drills/components/FireDrillCalendar.tsx` | Monthly calendar view with compliance badges |
| `FireDrillForm` | `features/fire-drills/components/FireDrillForm.tsx` | Create/schedule a fire drill |
| `FireDrillExecutionForm` | `features/fire-drills/components/FireDrillExecutionForm.tsx` | Log drill results (evacuation time, issues, participants) |
| `FireDrillComplianceCard` | `features/fire-drills/components/FireDrillComplianceCard.tsx` | Summary card for dashboard |
| `FireDrillIssueLogger` | `features/fire-drills/components/FireDrillIssueLogger.tsx` | Add/manage issues found during drills |
| `EvacuationTimeChart` | `features/fire-drills/components/EvacuationTimeChart.tsx` | Recharts line chart of evacuation times over months |

#### 3.3.4 Pages

| Page | Route | Purpose |
|------|-------|---------|
| Fire Drills Dashboard | `app/dashboard/fire-drills/page.tsx` | Calendar view + compliance status + recent drills |
| Schedule Fire Drill | `app/dashboard/fire-drills/schedule/page.tsx` | Schedule a new drill |
| Fire Drill Detail | `app/dashboard/fire-drills/[id]/page.tsx` | View/execute a drill |

#### 3.3.5 Type Definitions

```typescript
// shared/types/fire-drills.ts

export type DrillType = 'fire' | 'tornado' | 'lockdown' | 'fire_marshal_inspection'
export type DrillStatus = 'scheduled' | 'completed' | 'missed' | 'rescheduled' | 'cancelled'

export interface DrillIssue {
  description: string
  severity: 'low' | 'medium' | 'high'
  corrective_action: string
  resolved: boolean
}

export interface FireDrill {
  id: string
  organization_id: string
  scheduled_date: string
  scheduled_time: string | null
  drill_type: DrillType
  executed: boolean
  executed_date: string | null
  executed_time: string | null
  alarm_activated_at: string | null
  last_person_clear_at: string | null
  evacuation_seconds: number | null
  children_present: number | null
  children_evacuated: number | null
  staff_present: number | null
  staff_evacuated: number | null
  visitors_present: number
  assembly_point: string | null
  weather_conditions: string | null
  drill_leader_id: string | null
  issues_found: DrillIssue[]
  notes: string | null
  attachment_urls: string[]
  status: DrillStatus
  cancellation_reason: string | null
  conducted_by: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface FireDrillFormData {
  scheduled_date: string
  scheduled_time?: string
  drill_type: DrillType
  notes?: string
}

export interface FireDrillExecutionData {
  executed_date: string
  executed_time: string
  evacuation_seconds: number
  children_present: number
  children_evacuated: number
  staff_present: number
  staff_evacuated: number
  visitors_present?: number
  assembly_point: string
  weather_conditions: string
  issues_found?: DrillIssue[]
  notes?: string
}

export interface MonthlyCompliance {
  month: string             // '2026-01'
  drills_completed: number
  is_compliant: boolean
  best_time: number | null  // seconds
  avg_time: number | null   // seconds
  had_issues: boolean
}
```

### 3.4 Acceptance Criteria

| ID | Criterion | Testable Condition |
|----|-----------|--------------------|
| AC-01 | Drill scheduling | Given a director creates a fire drill for March 15, then a record is created with status "scheduled" and appears on the calendar |
| AC-02 | Drill execution logging | Given a scheduled drill, when the director fills the execution form (evacuation time: 145 seconds, 22 children, 6 staff, no issues), then the status changes to "completed" and all fields are saved |
| AC-03 | Monthly compliance check | Given drills completed in January and February but NOT March, when viewing the compliance calendar, then January and February show green checkmarks and March shows a red "Overdue" badge |
| AC-04 | Evacuation time tracking | Given 6 months of completed drills with varying evacuation times, when viewing the trends chart, then a line chart shows the time progression |
| AC-05 | Issue tracking | Given a drill where the director logs "Exit B blocked by furniture" as high severity, then the issue appears in the drill record and is included in the compliance report |
| AC-06 | PDF export | Given a year's worth of drill records, when exporting the compliance report, then a PDF contains a table of all drills with dates, times, participant counts, and issue summaries |
| AC-07 | Cross-reference with attendance | Given 25 children were marked present in attendance on drill day, when executing the drill, then the form pre-fills "children_present: 25" from attendance data |
| AC-08 | Missed drill alert | Given it is the 25th of the month and no drill has been conducted or scheduled for the current month, then a warning banner appears on the dashboard |

### 3.5 UI Wireframe

```
+------------------------------------------------------------------+
| FIRE DRILLS > COMPLIANCE DASHBOARD                                |
|                                          [ + Schedule Drill ]     |
+------------------------------------------------------------------+
|                                                                  |
|  2026 COMPLIANCE STATUS                                          |
|  +-----+-----+-----+-----+-----+-----+-----+-----+-----+       |
|  | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep |       |
|  | [v] | [v] | [!] | --- | --- | --- | --- | --- | --- |       |
|  | 120s| 115s| OVER|     |     |     |     |     |     |       |
|  +-----+-----+-----+-----+-----+-----+-----+-----+-----+       |
|  [v] = Completed     [!] = Overdue     --- = Future              |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  EVACUATION TIME TREND                                           |
|  180s |                                                          |
|  150s |--*                                                       |
|  120s |      *---*                                               |
|   90s |          Target ------ ---- ---- ----                    |
|   60s |                                                          |
|       +--Jan--Feb--Mar--Apr--May--Jun--Jul                       |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  RECENT DRILLS                                                   |
|  +------------------------------------------------------------+  |
|  | Feb 12, 2026  | Fire | 10:30 AM | 115 sec | 25 kids |      |  |
|  | 6 staff | No issues | [View Detail]                        |  |
|  +------------------------------------------------------------+  |
|  | Jan 15, 2026  | Fire | 2:15 PM  | 120 sec | 28 kids |      |  |
|  | 7 staff | 1 issue: Exit blocked | [View Detail]             |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

```
+------------------------------------------------------------------+
| FIRE DRILL EXECUTION FORM                                         |
+------------------------------------------------------------------+
|                                                                  |
|  Drill Type: Fire Drill                 Date: [2026-02-24]      |
|  Time Started: [10:30 AM]                                        |
|                                                                  |
|  EVACUATION RESULTS                                              |
|  Evacuation Time: [   145   ] seconds                            |
|  Assembly Point:  [ Front parking lot        ]                   |
|  Weather:         [ Clear v ]                                    |
|                                                                  |
|  PARTICIPANTS (auto-filled from attendance)                      |
|  Children Present:   [ 25 ]   Children Evacuated: [ 25 ]        |
|  Staff Present:      [  6 ]   Staff Evacuated:    [  6 ]        |
|  Visitors:           [  2 ]                                      |
|                                                                  |
|  ISSUES FOUND                                                    |
|  +------------------------------------------------------------+  |
|  | (none yet)                              [ + Add Issue ]     |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  Notes:                                                          |
|  +------------------------------------------------------------+  |
|  | Smooth evacuation. All children accounted for within 2 min  |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  [ Cancel ]                        [ Complete Fire Drill ]       |
+------------------------------------------------------------------+
```

### 3.6 Dependencies on Existing Code

| Dependency | File/Table | Relationship |
|------------|-----------|--------------|
| Attendance records | `attendance` table, `attendanceService` | Pre-fill participant counts from today's attendance |
| Staff attendance | `staff_attendance` table | Pre-fill staff counts |
| Classrooms | `classrooms` table | Group participant tracking by classroom |
| Organization context | `shared/lib/organization-context.ts` | Multi-tenant scoping |
| Dashboard sidebar | `features/layout/components/sidebar.tsx` | Add "Fire Drills" nav item |
| Recharts | `recharts` (already in `package.json`) | Evacuation time trend chart |
| PDF renderer | `@react-pdf/renderer` (already in `package.json`) | Compliance report export |
| i18n | `shared/lib/i18n/` | Bilingual labels |

### 3.7 Effort Breakdown

| Task | Hours |
|------|-------|
| Database migration + seed data | 3 |
| API routes (5 endpoints) | 6 |
| Fire drill service | 4 |
| Calendar compliance view | 5 |
| Drill execution form | 4 |
| Issue logger component | 3 |
| Evacuation time chart | 2 |
| PDF compliance report | 3 |
| Dashboard integration (sidebar + card) | 2 |
| Type definitions + Zod schemas | 2 |
| Unit + integration tests | 4 |
| **Total** | **38 hours** |

---

## SPEC 4: DCF Licensing Report Generator

**ICE Score:** 600
**Priority:** High -- Compliance
**Estimated Total Effort:** 44-54 hours

### 4.1 Problem Statement

Florida DCF requires child care facilities to maintain and submit comprehensive documentation for license renewal and inspections. The data exists across multiple ChildCare Pro modules (attendance, staff certifications, incidents, ratios, food program) but there is no unified mechanism to compile it into a single, print-ready report. Directors currently must manually gather data from different screens, export individual spreadsheets, and assemble them -- a process that takes hours and is error-prone.

### 4.2 Functional Requirements

#### User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| LR-01 | Director | Generate a comprehensive DCF licensing report covering a selected date range | I can submit organized documentation for license renewal | Must Have |
| LR-02 | Director | Select which report sections to include (ratios, training, incidents, drills, enrollment) | I can customize the report for the specific inspection type | Must Have |
| LR-03 | Director | Preview the report before exporting | I can review and correct any issues | Must Have |
| LR-04 | Director | Export the report as PDF with professional formatting | I can print or email it to DCF | Must Have |
| LR-05 | Director | See a compliance checklist showing pass/fail for each DCF requirement | I know what needs attention before an inspection | Should Have |
| LR-06 | Director | Track report submission history (date submitted, to whom, status) | I have a record of all submissions | Should Have |
| LR-07 | Director | Schedule automatic monthly compliance snapshots | I have a historical compliance record | Could Have |
| LR-08 | Director | Compare compliance across two time periods | I can demonstrate improvement | Could Have |

#### Business Rules

1. **Report sections** map to DCF inspection areas:
   - Staff qualifications and training compliance
   - Child-to-staff ratio compliance
   - Incident reports
   - Fire drill records
   - Enrollment and capacity compliance
   - Health and safety (immunizations)
   - Food program compliance (CACFP)
2. **Compliance scoring**: Each section receives a pass/fail/warning status based on DCF rules.
3. **Date range**: Reports can span any date range but default to the current license period (typically 1 year).
4. **Organization branding**: Reports include the facility's logo, name, license number, and address.
5. **Signature line**: The generated PDF includes a signature line for the director.

### 4.3 Technical Requirements

#### 4.3.1 Database Schema Changes

```sql
-- New migration: 028_dcf_reports.sql

-- ==================== DCF Report History ====================
CREATE TABLE IF NOT EXISTS dcf_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Report metadata
  report_title TEXT NOT NULL,
  report_type TEXT NOT NULL,
    -- 'full_licensing', 'annual_renewal', 'interim_inspection', 'complaint_response', 'custom'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Sections included
  sections_included TEXT[] NOT NULL DEFAULT '{}',
    -- 'staff_compliance', 'ratios', 'incidents', 'fire_drills',
    -- 'enrollment', 'immunizations', 'food_program', 'background_checks'

  -- Compliance scores at time of generation
  compliance_snapshot JSONB NOT NULL DEFAULT '{}',
    -- {
    --   overall_score: 92,
    --   sections: {
    --     staff_compliance: { score: 95, status: 'pass', issues: [...] },
    --     ratios: { score: 100, status: 'pass', issues: [] },
    --     ...
    --   }
    -- }

  -- File
  pdf_url TEXT,
  file_size_bytes INTEGER,

  -- Submission tracking
  submitted_to TEXT,                    -- 'DCF Region 11', 'Fire Marshal'
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id),
  submission_method TEXT,               -- 'email', 'mail', 'in_person', 'portal'
  submission_reference TEXT,            -- Confirmation number or tracking

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
    -- 'draft', 'generated', 'submitted', 'acknowledged', 'review_required'
  notes TEXT,

  -- Metadata
  generated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dcf_reports_org ON dcf_reports(organization_id);
CREATE INDEX idx_dcf_reports_period ON dcf_reports(period_start, period_end);
CREATE INDEX idx_dcf_reports_status ON dcf_reports(status);

-- RLS
ALTER TABLE dcf_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view DCF reports in their org"
  ON dcf_reports FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Directors can manage DCF reports"
  ON dcf_reports FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );
```

#### 4.3.2 Report Data Aggregation Functions

The report generator does **not** create new data tables for the individual modules. Instead, it reads from existing tables:

| Section | Source Tables | Data Aggregated |
|---------|-------------|-----------------|
| Staff Compliance | `profiles`, `staff_certifications`, `training_events`, `training_attendance` | % compliant, missing certs, expiring certs, training hours |
| Ratios | `attendance`, `staff_attendance`, `staff_assignments`, `classrooms` | Daily ratio snapshots, violations, average ratios |
| Incidents | `incidents` | Count by type/severity, open vs closed, avg resolution time |
| Fire Drills | `fire_drills` | Monthly compliance, avg evacuation time, issues |
| Enrollment | `children`, `classrooms` | Capacity vs enrollment, age distribution |
| Immunizations | `immunization_records` (migration 015) | % compliant, overdue vaccinations |
| Food Program | `daily_menus`, `meal_records`, `food_budgets` | CACFP participation rates, budget adherence |
| Background Checks | `profiles` (background_check_date, background_check_clear) | % with current clearance |

#### 4.3.3 API Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `app/api/dcf-reports/route.ts` | GET, POST | List reports / initiate report generation | Director+ |
| `app/api/dcf-reports/[id]/route.ts` | GET, PUT, DELETE | Get/update/delete a report | Director+ |
| `app/api/dcf-reports/[id]/generate/route.ts` | POST | Generate the PDF for a configured report | Director+ |
| `app/api/dcf-reports/[id]/submit/route.ts` | POST | Record submission details | Director+ |
| `app/api/dcf-reports/compliance-check/route.ts` | GET | Run real-time compliance check without saving | Director+ |

#### 4.3.4 Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DCFReportBuilder` | `features/dcf-reports/components/DCFReportBuilder.tsx` | Multi-step wizard for configuring report |
| `DCFComplianceChecklist` | `features/dcf-reports/components/DCFComplianceChecklist.tsx` | Pass/fail/warning checklist by section |
| `DCFReportPreview` | `features/dcf-reports/components/DCFReportPreview.tsx` | HTML preview of the report before PDF generation |
| `DCFReportHistory` | `features/dcf-reports/components/DCFReportHistory.tsx` | List of generated reports with status |
| `DCFSectionCard` | `features/dcf-reports/components/DCFSectionCard.tsx` | Individual section summary card |
| `DCFReportPDF` | `features/dcf-reports/utils/dcf-report-pdf.ts` | @react-pdf/renderer document |

#### 4.3.5 Pages

| Page | Route | Purpose |
|------|-------|---------|
| DCF Reports Dashboard | `app/dashboard/dcf-reports/page.tsx` | Compliance overview + report history |
| New Report | `app/dashboard/dcf-reports/new/page.tsx` | Report builder wizard |
| Report Detail | `app/dashboard/dcf-reports/[id]/page.tsx` | Preview + export + submission tracking |

#### 4.3.6 Type Definitions

```typescript
// shared/types/dcf-reports.ts

export type ReportType = 'full_licensing' | 'annual_renewal' | 'interim_inspection' | 'complaint_response' | 'custom'
export type ReportSection = 'staff_compliance' | 'ratios' | 'incidents' | 'fire_drills' | 'enrollment' | 'immunizations' | 'food_program' | 'background_checks'
export type ReportStatus = 'draft' | 'generated' | 'submitted' | 'acknowledged' | 'review_required'
export type ComplianceStatus = 'pass' | 'fail' | 'warning' | 'not_applicable'
export type SubmissionMethod = 'email' | 'mail' | 'in_person' | 'portal'

export interface SectionCompliance {
  score: number                   // 0-100
  status: ComplianceStatus
  issues: string[]
  warnings: string[]
  data_summary: Record<string, unknown>  // Section-specific summary data
}

export interface ComplianceSnapshot {
  overall_score: number           // 0-100
  overall_status: ComplianceStatus
  generated_at: string
  sections: Record<ReportSection, SectionCompliance>
}

export interface DCFReport {
  id: string
  organization_id: string
  report_title: string
  report_type: ReportType
  period_start: string
  period_end: string
  sections_included: ReportSection[]
  compliance_snapshot: ComplianceSnapshot
  pdf_url: string | null
  file_size_bytes: number | null
  submitted_to: string | null
  submitted_at: string | null
  submitted_by: string | null
  submission_method: SubmissionMethod | null
  submission_reference: string | null
  status: ReportStatus
  notes: string | null
  generated_by: string | null
  created_at: string
  updated_at: string
}

export interface DCFReportFormData {
  report_title: string
  report_type: ReportType
  period_start: string
  period_end: string
  sections_included: ReportSection[]
  notes?: string
}

export interface ComplianceCheckResult {
  section: ReportSection
  label: string
  score: number
  status: ComplianceStatus
  description: string
  issues: { severity: 'critical' | 'warning' | 'info'; message: string }[]
}
```

### 4.4 Acceptance Criteria

| ID | Criterion | Testable Condition |
|----|-----------|--------------------|
| AC-01 | Report creation wizard | Given a director selects "Annual Renewal" type, date range Jan 1 - Dec 31, and checks 5 sections, when submitted, then a `dcf_reports` record is created with the correct configuration |
| AC-02 | Compliance aggregation | Given the system has attendance data for 250 days, when generating the ratios section, then the report shows the number of days in compliance, out of compliance, and the compliance percentage |
| AC-03 | Staff compliance section | Given 12 staff members where 10 have complete training, when generating the staff section, then the report shows "83% compliant" with 2 deficiency entries |
| AC-04 | PDF generation | Given a fully configured report, when the director clicks "Generate PDF", then a downloadable PDF is created with all sections, the facility header, and a signature line |
| AC-05 | Compliance checklist | Given mixed compliance states across sections, when viewing the checklist, then each section shows the correct pass/fail/warning icon and description |
| AC-06 | Submission tracking | Given a generated report, when the director logs "submitted to DCF Region 11 on Feb 20 via email", then the submission record is saved and the status changes to "submitted" |
| AC-07 | Report history | Given 3 previously generated reports, when viewing the reports dashboard, then all 3 appear in a list with status badges and download links |
| AC-08 | Real-time compliance check | Given the director runs a compliance check without saving, then all sections are evaluated and results are shown instantly without creating a report record |

### 4.5 UI Wireframe

```
+------------------------------------------------------------------+
| DCF REPORTS > COMPLIANCE OVERVIEW                                 |
|                                          [ + New Report ]         |
+------------------------------------------------------------------+
|                                                                  |
|  CURRENT COMPLIANCE STATUS (as of today)                         |
|  Overall Score: 87/100   Status: [WARNING]                       |
|                                                                  |
|  +-------------------+--------+-------+------------------------+ |
|  | Section           | Score  | Status| Issues                 | |
|  +-------------------+--------+-------+------------------------+ |
|  | Staff Training    |  83%   | [!]   | 2 staff behind pace    | |
|  | Child:Staff Ratios| 100%   | [v]   | No violations          | |
|  | Incident Reports  |  95%   | [v]   | 1 open follow-up       | |
|  | Fire Drills       |  67%   | [X]   | March drill missing    | |
|  | Enrollment/Cap.   | 100%   | [v]   | Within capacity        | |
|  | Immunizations     |  90%   | [!]   | 3 children overdue     | |
|  | Food Program      |  92%   | [v]   | 2 days missing records | |
|  | Background Checks | 100%   | [v]   | All current            | |
|  +-------------------+--------+-------+------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  REPORT HISTORY                                                  |
|  +------------------------------------------------------------+  |
|  | Annual Renewal 2025 | Generated Feb 15 | Submitted Feb 18  |  |
|  | Status: Acknowledged | Score: 94 | [Download PDF] [View]   |  |
|  +------------------------------------------------------------+  |
|  | Q3 Interim | Generated Oct 10 | Submitted Oct 12           |  |
|  | Status: Submitted | Score: 88 | [Download PDF] [View]      |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

```
+------------------------------------------------------------------+
| NEW DCF REPORT -- STEP 1/3: CONFIGURATION                        |
+------------------------------------------------------------------+
|                                                                  |
|  Report Title: [ Annual Licensing Renewal 2025-2026        ]     |
|  Report Type:  [ Annual Renewal  v ]                             |
|                                                                  |
|  Date Range:                                                     |
|  From: [ 2025-07-01 ]    To: [ 2026-06-30 ]                     |
|                                                                  |
|  SECTIONS TO INCLUDE:                                            |
|  [x] Staff Training & Qualifications                             |
|  [x] Child-to-Staff Ratios                                       |
|  [x] Incident Reports                                            |
|  [x] Fire Drill Records                                          |
|  [x] Enrollment & Capacity                                       |
|  [x] Immunization Compliance                                     |
|  [ ] Food Program (CACFP)        -- optional                     |
|  [x] Background Check Status                                     |
|                                                                  |
|  Notes:                                                          |
|  [ For annual DCF license renewal inspection             ]       |
|                                                                  |
|  [ Cancel ]                  [ Next: Preview Report >> ]         |
+------------------------------------------------------------------+
```

### 4.6 Dependencies on Existing Code

| Dependency | File/Table | Relationship |
|------------|-----------|--------------|
| Staff certifications | `staff_certifications`, `profiles`, `certificationService` | Staff compliance data |
| Training hours | New `training_events` + `training_attendance` (SPEC 2) | Training hour data |
| Attendance | `attendance`, `staff_attendance`, `attendanceService` | Ratio calculations |
| Classrooms | `classrooms`, `classroomsService` | Capacity data |
| Incidents | `incidents`, `incidentsService` | Incident counts |
| Fire drills | New `fire_drills` (SPEC 3) | Monthly compliance |
| Children | `children`, `childrenService` | Enrollment data |
| Immunizations | `immunization_records` (migration 015) | Vaccination compliance |
| Food program | `daily_menus`, `meal_records`, `food_budgets` | CACFP data |
| Organization | `organizations` | Facility info for report header |
| PDF renderer | `@react-pdf/renderer` | PDF generation |
| Report export utils | `shared/utils/report-export.ts` | Existing export helpers |

**NOTE:** This spec has a **soft dependency** on SPEC 2 (Training Hours) and SPEC 3 (Fire Drills). The report generator can function without those modules by simply omitting the corresponding sections, but for full compliance coverage, those specs should be implemented first.

### 4.7 Effort Breakdown

| Task | Hours |
|------|-------|
| Database migration | 2 |
| Compliance aggregation service (8 sections) | 12 |
| API routes (5 endpoints) | 6 |
| Report builder wizard (3-step) | 6 |
| Compliance checklist component | 4 |
| Report preview page | 4 |
| PDF generation (multi-section) | 8 |
| Submission tracking | 2 |
| Report history page | 3 |
| Type definitions + Zod schemas | 2 |
| Unit + integration tests | 4 |
| **Total** | **53 hours** |

---

## SPEC 5: Parent Portal Dashboard

**ICE Score:** 540
**Priority:** Medium-High -- User Experience
**Estimated Total Effort:** 56-68 hours

### 5.1 Problem Statement

The family portal at `app/family-portal/(portal)/` has a basic structure with routes for dashboard, photos, billing, attendance, children, profile, and chat. However, the current dashboard page (`app/family-portal/(portal)/page.tsx`) is minimal -- it shows children cards with attendance status, quick action buttons, pending invoices, and recent photos. Critical features are missing:

- **Daily activity feed**: Parents cannot see meals, naps, diaper changes, mood, or activities logged by teachers (data exists in `meal_records`, `nap_records`, `bathroom_records` from migration 017).
- **Learning milestones**: Parents cannot see their child's developmental progress (data exists in `child_milestones`, `milestone_observations` from migration 018).
- **Real-time updates**: No push notification integration for the portal.
- **Daily summary report**: No consolidated daily report view.
- **Message center**: The chat page exists but there is no inbox for teacher-to-parent messages (data exists in `messages` table).
- **Bottle feeding tracking**: Parents of infants cannot see bottle feeding data (exists in `bottle_feedings` from migration 022).
- **Incomplete sub-pages**: Many portal pages likely have placeholder content.

### 5.2 Functional Requirements

#### User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| PP-01 | Parent | See a daily summary card for each child showing meals, naps, bathroom, mood, and activities | I know how my child's day is going at a glance | Must Have |
| PP-02 | Parent | View a chronological activity feed of everything logged for my child today | I can follow along with their day in real-time | Must Have |
| PP-03 | Parent | See my child's attendance history with check-in/check-out times for the past 30 days | I can track patterns and verify hours | Must Have |
| PP-04 | Parent | View and pay pending invoices | I can stay current on payments | Must Have |
| PP-05 | Parent | See photos from the current day and browse a gallery of past photos | I can see moments from my child's day | Must Have |
| PP-06 | Parent | Read messages from teachers and reply | I can communicate about my child | Must Have |
| PP-07 | Parent | View my child's learning milestones and developmental progress | I can follow their growth and contribute observations at home | Should Have |
| PP-08 | Parent | Receive push notifications for: daily report available, new photo, message from teacher, billing due | I stay informed without checking the app constantly | Should Have |
| PP-09 | Parent | See bottle feeding logs with times and amounts (infants) | I know exactly what and when my baby was fed | Should Have |
| PP-10 | Parent | See a weekly or monthly summary report I can download as PDF | I have records for my pediatrician or own reference | Could Have |
| PP-11 | Parent | Update my contact info, authorized pickups, and emergency contacts | The daycare always has current information | Must Have |
| PP-12 | Parent | Use the portal comfortably on my phone (mobile-first design) | I can check on my child from anywhere | Must Have |

#### Business Rules

1. **Data scoping**: Parents can ONLY see data for children linked to their family. This must be enforced at the database level (RLS) and application level.
2. **Real-time**: The activity feed should poll for updates every 60 seconds or use Supabase realtime subscriptions.
3. **Photo privacy**: Only photos explicitly shared with parents (`shared_with_parents = true`) should appear.
4. **Message privacy**: Parents can only see messages where they are the recipient or messages of type "announcement".
5. **Billing**: Parents can view invoices and pay via Stripe Checkout (existing integration). They cannot modify invoices.
6. **Mobile-first**: All components must be designed for 375px width first, then scale up.
7. **Language**: Portal must support both English and Spanish (existing i18n system).

### 5.3 Technical Requirements

#### 5.3.1 Database Schema Changes

No new tables are required. The data already exists in:
- `meal_records`, `nap_records`, `bathroom_records`, `mood_records`, `activity_records` (migration 017)
- `child_milestones`, `milestone_observations` (migration 018)
- `bottle_feedings`, `daily_photos` (migration 022)
- `attendance` (migration 001)
- `invoices`, `payments` (migration 001)
- `messages` (migration 001)

**RLS Policy additions needed:**

```sql
-- New migration: 029_parent_portal_rls.sql

-- Parents need to read daily activity data for their children

-- Get family_ids for the current parent user
CREATE OR REPLACE FUNCTION get_parent_child_ids()
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT c.id FROM children c
    JOIN families f ON c.family_id = f.id
    JOIN guardians g ON g.family_id = f.id
    WHERE g.user_id = auth.uid()
    AND c.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- meal_records: parents can read their children's records
CREATE POLICY "Parents can view their children's meal records"
  ON meal_records FOR SELECT
  USING (child_id = ANY(get_parent_child_ids()));

-- nap_records: parents can read their children's records
CREATE POLICY "Parents can view their children's nap records"
  ON nap_records FOR SELECT
  USING (child_id = ANY(get_parent_child_ids()));

-- bathroom_records: parents can read their children's records
CREATE POLICY "Parents can view their children's bathroom records"
  ON bathroom_records FOR SELECT
  USING (child_id = ANY(get_parent_child_ids()));

-- bottle_feedings: parents can read their children's records
CREATE POLICY "Parents can view their children's bottle feedings"
  ON bottle_feedings FOR SELECT
  USING (child_id = ANY(get_parent_child_ids()));

-- daily_photos: parents can view shared photos of their children
CREATE POLICY "Parents can view shared photos of their children"
  ON daily_photos FOR SELECT
  USING (child_id = ANY(get_parent_child_ids()) AND shared_with_parents = true);

-- child_milestones: parents can view their children's milestones
CREATE POLICY "Parents can view their children's milestones"
  ON child_milestones FOR SELECT
  USING (child_id = ANY(get_parent_child_ids()));

-- milestone_observations: parents can view and create observations
CREATE POLICY "Parents can view their children's milestone observations"
  ON milestone_observations FOR SELECT
  USING (
    child_milestone_id IN (
      SELECT id FROM child_milestones WHERE child_id = ANY(get_parent_child_ids())
    )
  );
```

#### 5.3.2 API Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `app/api/family-portal/daily-summary/route.ts` | GET | Get today's daily summary for all children of the parent | Parent |
| `app/api/family-portal/activity-feed/route.ts` | GET | Get chronological activity feed (paginated) for a child | Parent |
| `app/api/family-portal/attendance/route.ts` | GET | Get attendance history for children (date range) | Parent |
| `app/api/family-portal/photos/route.ts` | GET | Get shared photos (paginated) for children | Parent |
| `app/api/family-portal/milestones/route.ts` | GET | Get milestone progress for a child | Parent |
| `app/api/family-portal/messages/route.ts` | GET, POST | Get/send messages | Parent |
| `app/api/family-portal/billing/route.ts` | GET | Get invoices and payment history | Parent |
| `app/api/family-portal/profile/route.ts` | GET, PUT | Get/update family profile | Parent |
| `app/api/family-portal/bottle-feedings/route.ts` | GET | Get bottle feeding logs for infant children | Parent |

#### 5.3.3 Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DailySummaryCard` | `features/family-portal/components/DailySummaryCard.tsx` | Compact card showing meals, naps, bathroom, mood for one child |
| `ActivityFeed` | `features/family-portal/components/ActivityFeed.tsx` | Chronological timeline of all activities |
| `ActivityFeedItem` | `features/family-portal/components/ActivityFeedItem.tsx` | Single activity entry (meal, nap, photo, etc.) |
| `AttendanceCalendar` | `features/family-portal/components/AttendanceCalendar.tsx` | Month view calendar with attendance dots |
| `PhotoGallery` | `features/family-portal/components/PhotoGallery.tsx` | Grid gallery with lightbox |
| `InvoiceCard` | `features/family-portal/components/InvoiceCard.tsx` | Invoice summary with pay button |
| `MessageThread` | `features/family-portal/components/MessageThread.tsx` | Message conversation view |
| `MilestoneProgressCard` | `features/family-portal/components/MilestoneProgressCard.tsx` | Developmental milestone progress ring |
| `BottleFeedingLog` | `features/family-portal/components/BottleFeedingLog.tsx` | Feeding timeline for infants |
| `ChildTabSelector` | `features/family-portal/components/ChildTabSelector.tsx` | Tab bar for parents with multiple children |
| `DailyReportPDF` | `features/family-portal/utils/daily-report-pdf.ts` | PDF export of daily summary |

#### 5.3.4 Pages (enhance existing)

| Page | Route | Enhancement Needed |
|------|-------|--------------------|
| Dashboard | `app/family-portal/(portal)/page.tsx` | Add DailySummaryCard, ActivityFeed, real-time updates |
| Attendance | `app/family-portal/(portal)/attendance/page.tsx` | Add AttendanceCalendar, history table |
| Billing | `app/family-portal/(portal)/billing/page.tsx` | Add InvoiceCard with Stripe pay button, payment history |
| Photos | `app/family-portal/(portal)/photos/page.tsx` | Add PhotoGallery with lightbox and date grouping |
| Children | `app/family-portal/(portal)/children/page.tsx` | Add milestones section, bottle feeding for infants |
| Chat | `app/family-portal/(portal)/chat/page.tsx` | Add message inbox, conversation threads |
| Profile | `app/family-portal/(portal)/profile/page.tsx` | Add editable contact info, authorized pickups, emergency contacts |
| NEW: Milestones | `app/family-portal/(portal)/milestones/page.tsx` | New page for learning milestones view |

#### 5.3.5 Services

| Service | Location | Methods |
|---------|----------|---------|
| `portal-daily.service.ts` | `features/family-portal/services/` | `getDailySummary()`, `getActivityFeed()`, `getBottleFeedings()` |
| `portal-attendance.service.ts` | `features/family-portal/services/` | `getAttendanceHistory()`, `getAttendanceStats()` |
| `portal-billing.service.ts` | `features/family-portal/services/` | `getInvoices()`, `getPaymentHistory()`, `initiatePayment()` |
| `portal-photos.service.ts` | `features/family-portal/services/` | `getSharedPhotos()` |
| `portal-messages.service.ts` | `features/family-portal/services/` | `getMessages()`, `sendMessage()`, `markRead()` |
| `portal-milestones.service.ts` | `features/family-portal/services/` | `getMilestones()`, `addObservation()` |

#### 5.3.6 Type Definitions

```typescript
// shared/types/family-portal.ts

export interface DailySummary {
  child_id: string
  child_name: string
  child_photo_url: string | null
  date: string
  attendance: {
    checked_in: boolean
    check_in_time: string | null
    check_out_time: string | null
  }
  meals: {
    meal_type: string
    food_served: string
    amount_eaten: string
    time: string
  }[]
  naps: {
    start_time: string
    end_time: string | null
    duration_minutes: number | null
    quality: string | null
  }[]
  bathroom: {
    type: string     // 'diaper_wet', 'diaper_dirty', 'potty'
    time: string
    notes: string | null
  }[]
  mood: string | null     // 'happy', 'calm', 'fussy', 'sad'
  activities: {
    activity_type: string
    description: string
    time: string
  }[]
  photos_count: number
  bottle_feedings?: {
    time: string
    amount_oz: number
    milk_type: string
    finished: boolean
  }[]
}

export interface ActivityFeedItem {
  id: string
  type: 'meal' | 'nap' | 'bathroom' | 'activity' | 'photo' | 'bottle' | 'mood' | 'note'
  time: string
  title: string
  description: string
  icon: string
  color: string
  metadata: Record<string, unknown>
}

export interface PortalAttendanceRecord {
  date: string
  check_in_time: string | null
  check_out_time: string | null
  status: string
  total_hours: number | null
}

export interface PortalAttendanceStats {
  total_days: number
  present_days: number
  absent_days: number
  late_days: number
  average_hours_per_day: number
  attendance_rate: number
}

export interface PortalMessage {
  id: string
  sender_name: string
  sender_role: string
  sender_avatar: string | null
  content: string
  is_read: boolean
  created_at: string
  attachments: string[]
}

export interface PortalInvoice {
  id: string
  invoice_number: string
  period: string
  due_date: string
  total: number
  amount_paid: number
  balance: number
  status: string
  can_pay_online: boolean
}
```

### 5.4 Acceptance Criteria

| ID | Criterion | Testable Condition |
|----|-----------|--------------------|
| AC-01 | Daily summary displays | Given a child who had breakfast (ate "most"), a 90-minute nap, and 2 diaper changes today, when the parent opens the dashboard, then the DailySummaryCard shows all this information |
| AC-02 | Activity feed is chronological | Given 10 activities logged throughout the day, when the parent views the activity feed, then items appear newest-first with correct timestamps |
| AC-03 | Data scoping enforced | Given Parent A has Child X and Parent B has Child Y, when Parent A views the portal, then they see ONLY Child X's data and never Child Y's |
| AC-04 | Photo gallery loads shared photos only | Given 5 photos taken today but only 3 marked `shared_with_parents = true`, when the parent opens the photos page, then only the 3 shared photos appear |
| AC-05 | Invoice payment works | Given a pending invoice, when the parent clicks "Pay Now", then they are redirected to Stripe Checkout and upon success the invoice status updates |
| AC-06 | Attendance calendar works | Given 20 days of attendance data, when the parent views the attendance calendar, then green dots mark present days, red dots mark absent days, and clicking a day shows details |
| AC-07 | Mobile-first responsive | Given a 375px wide viewport, when the dashboard loads, then all content is readable, cards stack vertically, and no horizontal scrolling occurs |
| AC-08 | Multi-child support | Given a parent with 3 children, when viewing the dashboard, then a tab selector allows switching between children, and the summary updates accordingly |
| AC-09 | Real-time updates | Given a teacher logs a new meal for a child, when the parent has the dashboard open, then the new meal appears within 60 seconds without manual refresh |
| AC-10 | Message send/receive | Given a parent sends a message to the teacher, then the message appears in the teacher's dashboard and vice versa |
| AC-11 | Milestone viewing | Given a child with 15 tracked milestones (8 achieved, 4 in progress, 3 not started), when the parent views milestones, then a progress ring shows 53% and milestone cards show correct statuses |
| AC-12 | Bottle feeding for infants | Given an infant with 5 bottle feedings logged today, when the parent views the daily summary, then all 5 appear with time, ounces, and milk type |

### 5.5 UI Wireframe

```
+------------------------------------------+
| FAMILY PORTAL (Mobile View - 375px)      |
+------------------------------------------+
| [Logo]  ChildCare Pro    [Bell] [Menu]   |
+------------------------------------------+
|                                          |
| Hola, Maria!                             |
| Bienvenida al portal de padres           |
|                                          |
| +-[ Sofia ]-+-[ Diego ]-+               |
| (tab selector for children)              |
|                                          |
| +--------------------------------------+ |
| | TODAY: Feb 24, 2026                  | |
| |                                      | |
| | [v] Checked in at 7:45 AM           | |
| |                                      | |
| | Meals     Naps     Bathroom   Mood   | |
| | B:Most    1h 30m   3 changes  :)     | |
| | L:All                        Happy   | |
| | S:--                                 | |
| |                                      | |
| | [ View Full Activity Feed >> ]       | |
| +--------------------------------------+ |
|                                          |
| ACTIVITY FEED                            |
| +--------------------------------------+ |
| | 2:30 PM  [nap] Nap ended            | |
| |          Slept 1h 30m - Restful      | |
| | 2:15 PM  [cam] New Photo!           | |
| |          [photo thumbnail]           | |
| | 1:00 PM  [nap] Nap started          | |
| | 12:30 PM [eat] Lunch                | |
| |          Rice & chicken - Ate all    | |
| | 11:45 AM [wc]  Diaper change        | |
| | 10:00 AM [eat] Morning Snack        | |
| |          Apple slices - Ate most     | |
| | 8:00 AM  [eat] Breakfast            | |
| |          Oatmeal - Ate most          | |
| | 7:45 AM  [v]  Checked in            | |
| +--------------------------------------+ |
|                                          |
| QUICK ACTIONS                            |
| [Photos] [Billing] [Attendance] [Chat]   |
|                                          |
| PENDING INVOICES                         |
| +--------------------------------------+ |
| | INV-2026-024  |  $250.00  | Pending  | |
| | Due: Mar 1    | [Pay Now]            | |
| +--------------------------------------+ |
|                                          |
+------------------------------------------+
```

```
+------------------------------------------+
| ATTENDANCE HISTORY (Mobile)              |
+------------------------------------------+
|                                          |
| FEBRUARY 2026                            |
| +--+--+--+--+--+--+--+                  |
| |Su|Mo|Tu|We|Th|Fr|Sa|                  |
| +--+--+--+--+--+--+--+                  |
| |  |  |  |  |  |  | 1|                  |
| | 2| 3| 4| 5| 6| 7| 8|                  |
| |  |gn|gn|gn|gn|gn|  |                  |
| | 9|10|11|12|13|14|15|                  |
| |  |gn|gn|rd|gn|gn|  |                  |
| |16|17|18|19|20|21|22|                  |
| |  |gn|gn|gn|gn|gn|  |                  |
| |23|24|                                  |
| |  |gn|    gn=green(present)             |
| +--+--+    rd=red(absent)                |
|                                          |
| STATS THIS MONTH                         |
| Present: 14/15 (93%)                     |
| Avg Hours: 8.5 hrs/day                   |
| Late Arrivals: 2                         |
|                                          |
| RECENT RECORDS                           |
| +--------------------------------------+ |
| | Feb 24 | In: 7:45 | Out: --  | 8.0h | |
| | Feb 21 | In: 7:30 | Out: 4:15| 8.75h| |
| | Feb 20 | In: 8:00 | Out: 4:00| 8.0h | |
| | Feb 19 | In: 7:45 | Out: 3:30| 7.75h| |
| +--------------------------------------+ |
|                                          |
+------------------------------------------+
```

### 5.6 Dependencies on Existing Code

| Dependency | File/Table | Relationship |
|------------|-----------|--------------|
| Guardian auth | `features/family-portal/services/guardian-auth.service.ts` | Authentication and child scoping |
| Portal layout | `features/family-portal/components/portal-layout.tsx` | Existing layout wrapper |
| Daily activities tables | `meal_records`, `nap_records`, `bathroom_records` (migration 017) | Activity data source |
| Learning milestones | `child_milestones`, `milestone_observations` (migration 018) | Milestone data source |
| Bottle feedings | `bottle_feedings` (migration 022) | Infant feeding data |
| Daily photos | `daily_photos` (migration 022) | Photo gallery data |
| Attendance | `attendance` table (migration 001) | Attendance history |
| Invoices/Payments | `invoices`, `payments` tables (migration 001) | Billing data |
| Messages | `messages` table (migration 001) | Communication data |
| Stripe service | `features/billing/services/stripe.service.ts` | Payment processing |
| Push notifications | `features/notifications/services/push.service.ts` | Real-time notifications |
| i18n system | `shared/lib/i18n/` | English/Spanish translation |
| Supabase client | `shared/lib/supabase/client.ts` | Database access |
| Existing portal pages | `app/family-portal/(portal)/*.tsx` | Pages to enhance |

### 5.7 Effort Breakdown

| Task | Hours |
|------|-------|
| RLS policy migration | 3 |
| Portal API routes (9 endpoints) | 12 |
| Portal services (6 services) | 8 |
| DailySummaryCard component | 4 |
| ActivityFeed + FeedItem components | 6 |
| AttendanceCalendar + history | 4 |
| PhotoGallery with lightbox | 3 |
| InvoiceCard with Stripe integration | 3 |
| MessageThread component | 4 |
| MilestoneProgressCard | 3 |
| BottleFeedingLog | 2 |
| ChildTabSelector | 2 |
| Enhance existing portal pages (7 pages) | 8 |
| Real-time subscription integration | 3 |
| Type definitions | 2 |
| Mobile-responsive testing + polish | 4 |
| Unit + integration tests | 4 |
| **Total** | **75 hours** |

---

## Implementation Priority & Dependency Graph

```
                    SPEC 1: Allergy Alerts (54h)
                         [Independent]
                              |
                              v
     SPEC 2: Training Hours (46h) -----> SPEC 4: DCF Reports (53h)
                                              ^
     SPEC 3: Fire Drills (38h) --------------+
                                              |
                    SPEC 5: Parent Portal (75h)
                         [Independent]
```

### Recommended Implementation Order

| Phase | Spec | Reason | Cumulative Hours |
|-------|------|--------|------------------|
| Phase 1 | SPEC 1: Allergy Alerts | Child safety is the highest priority; no dependencies | 54h |
| Phase 2 | SPEC 3: Fire Drills | Simple scope, unblocks SPEC 4 | 92h |
| Phase 3 | SPEC 2: Training Hours | Partially overlaps existing code, unblocks SPEC 4 | 138h |
| Phase 4 | SPEC 4: DCF Reports | Requires SPEC 2 + SPEC 3 for complete coverage | 191h |
| Phase 5 | SPEC 5: Parent Portal | Largest scope, independent, high value | 266h |

### Total Estimated Effort

| Spec | Low Estimate | High Estimate |
|------|-------------|---------------|
| SPEC 1: Allergy Alerts | 48h | 60h |
| SPEC 2: Training Hours | 40h | 50h |
| SPEC 3: Fire Drills | 32h | 40h |
| SPEC 4: DCF Reports | 44h | 54h |
| SPEC 5: Parent Portal | 56h | 68h |
| **TOTAL** | **220h** | **272h** |

---

## Glossary

| Term | Definition |
|------|-----------|
| CACFP | Child and Adult Care Food Program -- federal nutrition program |
| CDA | Child Development Associate credential |
| DCF | Florida Department of Children and Families |
| ELC | Early Learning Coalition (local School Readiness administrator) |
| FDA Top 9 | Nine major food allergens designated by FDA |
| FCCPC | Florida Child Care Professional Credential |
| ICE Score | Impact x Confidence x Ease scoring method for prioritization |
| RLS | Row Level Security (Supabase/PostgreSQL feature) |
| VPK | Voluntary Prekindergarten program (Florida state-funded) |

---

*This specification document is the authoritative reference for implementing these 5 features. All implementation must align with the architecture patterns defined in the project CLAUDE.md (Feature-First frontend, Clean Architecture backend).*

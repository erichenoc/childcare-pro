-- =====================================================
-- MIGRATION 009: Food Program Module
-- =====================================================
-- Complete food program management with CACFP compliance

-- Drop existing tables with incompatible schemas (no production data)
DROP TABLE IF EXISTS meal_records CASCADE;
DROP TABLE IF EXISTS meal_attendance CASCADE;
DROP TABLE IF EXISTS food_expenses CASCADE;
DROP TABLE IF EXISTS food_budgets CASCADE;
DROP TABLE IF EXISTS milk_inventory CASCADE;
DROP TABLE IF EXISTS food_inventory CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS daily_menus CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_templates CASCADE;
DROP TABLE IF EXISTS meal_categories CASCADE;

-- =====================================================
-- Meal Categories & Menu Templates
-- =====================================================

-- Meal categories (breakfast, lunch, snack, etc.)
CREATE TABLE IF NOT EXISTS meal_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL, -- 'Breakfast', 'AM Snack', 'Lunch', 'PM Snack'
  meal_type TEXT NOT NULL, -- 'breakfast', 'snack', 'lunch', 'dinner'
  serving_time TIME,
  is_active BOOLEAN DEFAULT true,

  -- CACFP requirements
  requires_milk BOOLEAN DEFAULT false,
  requires_fruit BOOLEAN DEFAULT false,
  requires_vegetable BOOLEAN DEFAULT false,
  requires_grain BOOLEAN DEFAULT false,
  requires_protein BOOLEAN DEFAULT false,

  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_categories_org ON meal_categories(organization_id);

-- Daily menu templates
CREATE TABLE IF NOT EXISTS menu_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL, -- 'Week 1 Menu', 'Summer Menu'
  description TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Week rotation
  week_number INTEGER, -- 1, 2, 3, 4 for rotating menus

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items within templates
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  menu_template_id UUID NOT NULL REFERENCES menu_templates(id) ON DELETE CASCADE,
  meal_category_id UUID NOT NULL REFERENCES meal_categories(id),

  day_of_week INTEGER NOT NULL, -- 1=Monday, 5=Friday

  -- Food items
  main_item TEXT NOT NULL,
  side_items TEXT[],
  milk_type TEXT, -- 'whole', '2%', 'skim', 'lactose_free'
  fruit TEXT,
  vegetable TEXT,
  grain TEXT,

  -- Nutritional info (optional)
  calories INTEGER,
  protein_grams DECIMAL(5,2),

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_template ON menu_items(menu_template_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_day ON menu_items(day_of_week);

-- =====================================================
-- Daily Meal Records
-- =====================================================

-- Daily meal plan (what was served)
CREATE TABLE IF NOT EXISTS daily_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  meal_category_id UUID NOT NULL REFERENCES meal_categories(id),

  -- What was served
  main_item TEXT NOT NULL,
  side_items TEXT[],
  milk_type TEXT,
  fruit TEXT,
  vegetable TEXT,
  grain TEXT,

  -- Portions prepared
  portions_prepared INTEGER,
  portions_served INTEGER,
  portions_wasted INTEGER,

  -- Staff
  prepared_by UUID REFERENCES profiles(id),
  served_by UUID REFERENCES profiles(id),

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, date, meal_category_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_menus_org_date ON daily_menus(organization_id, date);

-- Individual child meal records
CREATE TABLE IF NOT EXISTS meal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  daily_menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  meal_category_id UUID NOT NULL REFERENCES meal_categories(id),

  -- Consumption
  served BOOLEAN DEFAULT true,
  amount_eaten TEXT, -- 'all', 'most', 'some', 'none'

  -- Special handling
  dietary_substitution TEXT, -- If child has allergies
  refused_reason TEXT,

  -- Staff who recorded
  recorded_by UUID REFERENCES profiles(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  notes TEXT,

  UNIQUE(daily_menu_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_meal_records_child ON meal_records(child_id);
CREATE INDEX IF NOT EXISTS idx_meal_records_date ON meal_records(date);

-- =====================================================
-- Food Program Budget & Expenses
-- =====================================================

-- Monthly food budget
CREATE TABLE IF NOT EXISTS food_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  year INTEGER NOT NULL,
  month INTEGER NOT NULL, -- 1-12

  budgeted_amount DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (budgeted_amount - spent_amount) STORED,

  -- Per-child metrics
  children_count INTEGER,
  cost_per_child DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN children_count > 0 THEN spent_amount / children_count ELSE 0 END
  ) STORED,

  notes TEXT,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, year, month)
);

-- Food purchases/expenses
CREATE TABLE IF NOT EXISTS food_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  food_budget_id UUID REFERENCES food_budgets(id),

  date DATE NOT NULL,
  vendor TEXT NOT NULL,
  description TEXT,

  -- Categories
  category TEXT NOT NULL, -- 'groceries', 'dairy', 'produce', 'meat', 'supplies'

  -- Amounts
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,

  -- Payment
  payment_method TEXT, -- 'card', 'cash', 'check', 'account'
  receipt_url TEXT,

  -- Tracking
  recorded_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_expenses_org_date ON food_expenses(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_food_expenses_budget ON food_expenses(food_budget_id);

-- =====================================================
-- Milk Inventory
-- =====================================================

-- Milk inventory tracking
CREATE TABLE IF NOT EXISTS milk_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Inventory
  milk_type TEXT NOT NULL, -- 'whole', '2%', 'skim', 'lactose_free'

  -- Quantities (in gallons or specified unit)
  quantity_unit TEXT DEFAULT 'gallons',
  opening_quantity DECIMAL(10,2) NOT NULL,
  received_quantity DECIMAL(10,2) DEFAULT 0,
  used_quantity DECIMAL(10,2) DEFAULT 0,
  spoiled_quantity DECIMAL(10,2) DEFAULT 0,
  closing_quantity DECIMAL(10,2) GENERATED ALWAYS AS (
    opening_quantity + received_quantity - used_quantity - spoiled_quantity
  ) STORED,

  -- Expiration tracking
  expiration_date DATE,

  recorded_by UUID REFERENCES profiles(id),

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, date, milk_type)
);

CREATE INDEX IF NOT EXISTS idx_milk_inventory_org_date ON milk_inventory(organization_id, date);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE meal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_inventory ENABLE ROW LEVEL SECURITY;

-- Policies for meal_categories
CREATE POLICY "Users can view meal categories in their organization"
  ON meal_categories FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Directors can manage meal categories"
  ON meal_categories FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Policies for daily_menus
CREATE POLICY "Users can view daily menus in their organization"
  ON daily_menus FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage daily menus"
  ON daily_menus FOR ALL
  USING (organization_id = get_user_organization_id());

-- Policies for meal_records
CREATE POLICY "Users can view meal records in their organization"
  ON meal_records FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage meal records"
  ON meal_records FOR ALL
  USING (organization_id = get_user_organization_id());

-- Policies for food_budgets
CREATE POLICY "Users can view food budgets in their organization"
  ON food_budgets FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Directors can manage food budgets"
  ON food_budgets FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Policies for food_expenses
CREATE POLICY "Users can view food expenses in their organization"
  ON food_expenses FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can create food expenses"
  ON food_expenses FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Directors can manage food expenses"
  ON food_expenses FOR UPDATE
  USING (
    organization_id = get_user_organization_id() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'director')
  );

-- Policies for milk_inventory
CREATE POLICY "Users can view milk inventory in their organization"
  ON milk_inventory FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage milk inventory"
  ON milk_inventory FOR ALL
  USING (organization_id = get_user_organization_id());

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get daily meal participation count
CREATE OR REPLACE FUNCTION get_daily_meal_participation(
  p_organization_id UUID,
  p_date DATE,
  p_meal_category_id UUID
)
RETURNS TABLE (
  total_children INTEGER,
  children_served INTEGER,
  children_absent INTEGER,
  participation_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM children c
     WHERE c.organization_id = p_organization_id AND c.status = 'active') as total_children,
    (SELECT COUNT(*)::INTEGER FROM meal_records mr
     WHERE mr.organization_id = p_organization_id
       AND mr.date = p_date
       AND mr.meal_category_id = p_meal_category_id
       AND mr.served = true) as children_served,
    (SELECT COUNT(*)::INTEGER FROM children c
     WHERE c.organization_id = p_organization_id
       AND c.status = 'active'
       AND NOT EXISTS (
         SELECT 1 FROM attendance a
         WHERE a.child_id = c.id AND a.date = p_date
       )) as children_absent,
    CASE
      WHEN (SELECT COUNT(*) FROM children c WHERE c.organization_id = p_organization_id AND c.status = 'active') > 0
      THEN (
        (SELECT COUNT(*)::DECIMAL FROM meal_records mr
         WHERE mr.organization_id = p_organization_id
           AND mr.date = p_date
           AND mr.meal_category_id = p_meal_category_id
           AND mr.served = true) /
        (SELECT COUNT(*)::DECIMAL FROM children c
         WHERE c.organization_id = p_organization_id AND c.status = 'active')
      ) * 100
      ELSE 0
    END as participation_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to update food budget spent amount
CREATE OR REPLACE FUNCTION update_food_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.date, OLD.date));
  v_month := EXTRACT(MONTH FROM COALESCE(NEW.date, OLD.date));

  UPDATE food_budgets SET
    spent_amount = (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM food_expenses
      WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
        AND EXTRACT(YEAR FROM date) = v_year
        AND EXTRACT(MONTH FROM date) = v_month
    ),
    updated_at = NOW()
  WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
    AND year = v_year
    AND month = v_month;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for budget update
DROP TRIGGER IF EXISTS update_food_budget_trigger ON food_expenses;
CREATE TRIGGER update_food_budget_trigger
  AFTER INSERT OR UPDATE OR DELETE ON food_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_food_budget_spent();

-- =====================================================
-- Views
-- =====================================================

-- View: Weekly meal summary
CREATE OR REPLACE VIEW weekly_meal_summary AS
SELECT
  dm.organization_id,
  DATE_TRUNC('week', dm.date) as week_start,
  mc.name as meal_name,
  mc.meal_type,
  COUNT(DISTINCT dm.date) as days_served,
  SUM(dm.portions_served) as total_portions,
  SUM(dm.portions_wasted) as total_wasted,
  CASE
    WHEN SUM(dm.portions_prepared) > 0
    THEN (SUM(dm.portions_wasted)::DECIMAL / SUM(dm.portions_prepared)::DECIMAL) * 100
    ELSE 0
  END as waste_percentage
FROM daily_menus dm
JOIN meal_categories mc ON dm.meal_category_id = mc.id
GROUP BY dm.organization_id, DATE_TRUNC('week', dm.date), mc.name, mc.meal_type;

-- View: Monthly food program report
CREATE OR REPLACE VIEW monthly_food_report AS
SELECT
  fb.organization_id,
  fb.year,
  fb.month,
  fb.budgeted_amount,
  fb.spent_amount,
  fb.remaining_amount,
  fb.children_count,
  fb.cost_per_child,
  (
    SELECT COUNT(DISTINCT mr.date)
    FROM meal_records mr
    WHERE mr.organization_id = fb.organization_id
      AND EXTRACT(YEAR FROM mr.date) = fb.year
      AND EXTRACT(MONTH FROM mr.date) = fb.month
  ) as days_served,
  (
    SELECT COUNT(*)
    FROM meal_records mr
    WHERE mr.organization_id = fb.organization_id
      AND EXTRACT(YEAR FROM mr.date) = fb.year
      AND EXTRACT(MONTH FROM mr.date) = fb.month
      AND mr.served = true
  ) as total_meals_served
FROM food_budgets fb;

COMMENT ON TABLE meal_categories IS 'Categories for meals served (breakfast, lunch, snacks)';
COMMENT ON TABLE daily_menus IS 'Daily record of meals served';
COMMENT ON TABLE meal_records IS 'Individual child meal consumption records';
COMMENT ON TABLE food_budgets IS 'Monthly food program budgets';
COMMENT ON TABLE food_expenses IS 'Food purchase and expense tracking';
COMMENT ON TABLE milk_inventory IS 'Milk inventory tracking for CACFP compliance';

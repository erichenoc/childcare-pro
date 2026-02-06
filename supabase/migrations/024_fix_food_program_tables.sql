-- =====================================================
-- MIGRATION 024: Fix Food Program Service Tables
-- =====================================================
-- Creates missing tables that the food-program.service.ts expects
-- These tables were referenced in code but never created in migration 009

-- =====================================================
-- 1. meal_attendance table (service expects this, not meal_records)
-- =====================================================
CREATE TABLE IF NOT EXISTS meal_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  meal_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'am_snack', 'lunch', 'pm_snack', 'supper')),

  served BOOLEAN DEFAULT false,
  served_at TIMESTAMPTZ,
  served_by UUID REFERENCES profiles(id),
  portion_eaten TEXT CHECK (portion_eaten IN ('none', 'partial', 'full')),

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, child_id, meal_date, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_meal_attendance_org_date ON meal_attendance(organization_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_meal_attendance_child ON meal_attendance(child_id);
CREATE INDEX IF NOT EXISTS idx_meal_attendance_meal_type ON meal_attendance(meal_type);

-- RLS
ALTER TABLE meal_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meal attendance in their organization"
  ON meal_attendance FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage meal attendance"
  ON meal_attendance FOR ALL
  USING (organization_id = get_user_organization_id());

-- =====================================================
-- 2. food_inventory table (was DROPped in 009, never recreated)
-- =====================================================
CREATE TABLE IF NOT EXISTS food_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  unit TEXT NOT NULL DEFAULT 'units',

  quantity_on_hand DECIMAL(10,2) DEFAULT 0,
  minimum_quantity DECIMAL(10,2) DEFAULT 0,
  reorder_point DECIMAL(10,2) DEFAULT 0,
  unit_cost DECIMAL(10,2),

  supplier TEXT,
  expiration_date DATE,
  storage_location TEXT,

  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_inventory_org ON food_inventory(organization_id);
CREATE INDEX IF NOT EXISTS idx_food_inventory_category ON food_inventory(category);

-- RLS
ALTER TABLE food_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view food inventory in their organization"
  ON food_inventory FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage food inventory"
  ON food_inventory FOR ALL
  USING (organization_id = get_user_organization_id());

-- =====================================================
-- 3. inventory_transactions table (was DROPped in 009, never recreated)
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES food_inventory(id) ON DELETE CASCADE,

  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('received', 'used', 'wasted', 'adjustment')),
  quantity DECIMAL(10,2) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,

  reference_id TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_txn_org ON inventory_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_item ON inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_date ON inventory_transactions(transaction_date);

-- RLS
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory transactions in their organization"
  ON inventory_transactions FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system_admin());

CREATE POLICY "Staff can manage inventory transactions"
  ON inventory_transactions FOR ALL
  USING (organization_id = get_user_organization_id());

-- =====================================================
-- 4. Fix food_expenses column names to match service
-- =====================================================
-- Service uses 'expense_date' but table has 'date'
-- Add alias column if 'expense_date' doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'food_expenses'
    AND column_name = 'expense_date'
  ) THEN
    ALTER TABLE food_expenses ADD COLUMN expense_date DATE;
    -- Copy existing data
    UPDATE food_expenses SET expense_date = date WHERE expense_date IS NULL;
    -- Make it default to date column for backwards compatibility
    ALTER TABLE food_expenses ALTER COLUMN expense_date SET DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- =====================================================
-- 5. Fix milk_inventory column names to match service
-- =====================================================
-- Service uses 'inventory_date' but table has 'date'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'milk_inventory'
    AND column_name = 'inventory_date'
  ) THEN
    -- Drop the unique constraint that references 'date'
    ALTER TABLE milk_inventory DROP CONSTRAINT IF EXISTS milk_inventory_organization_id_date_milk_type_key;
    -- Rename the column
    ALTER TABLE milk_inventory RENAME COLUMN date TO inventory_date;
    -- Recreate the unique constraint with new name
    ALTER TABLE milk_inventory ADD CONSTRAINT milk_inventory_org_date_type_key
      UNIQUE(organization_id, inventory_date, milk_type);
    -- Recreate index
    DROP INDEX IF EXISTS idx_milk_inventory_org_date;
    CREATE INDEX idx_milk_inventory_org_date ON milk_inventory(organization_id, inventory_date);
  END IF;
END $$;

-- =====================================================
-- 6. Fix daily_menus to support service's simpler schema
-- =====================================================
-- Service uses 'menu_date' (text) and 'meal_type' (text)
-- but table has 'date' (DATE) and 'meal_category_id' (UUID)
-- Add the columns the service expects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'daily_menus'
    AND column_name = 'menu_date'
  ) THEN
    ALTER TABLE daily_menus ADD COLUMN menu_date DATE;
    UPDATE daily_menus SET menu_date = date WHERE menu_date IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'daily_menus'
    AND column_name = 'meal_type'
  ) THEN
    ALTER TABLE daily_menus ADD COLUMN meal_type TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'daily_menus'
    AND column_name = 'menu_items'
  ) THEN
    ALTER TABLE daily_menus ADD COLUMN menu_items TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'daily_menus'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE daily_menus ADD COLUMN created_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Add unique constraint for upsert support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'daily_menus_org_date_meal_type_key'
  ) THEN
    -- Only add if no conflicting data
    ALTER TABLE daily_menus ADD CONSTRAINT daily_menus_org_date_meal_type_key
      UNIQUE(organization_id, menu_date, meal_type);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore if constraint already exists or conflicts
  NULL;
END $$;

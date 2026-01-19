// =====================================================
// Food Program Types - Unified with Service
// =====================================================

// Meal types matching CACFP requirements
export type MealType = 'breakfast' | 'am_snack' | 'lunch' | 'pm_snack' | 'supper'
export type MilkType = 'whole' | '2%' | 'skim' | 'lactose_free' | 'formula'
export type AmountEaten = 'all' | 'most' | 'some' | 'none'
export type PortionEaten = 'none' | 'partial' | 'full'
export type FoodCategory = 'grain' | 'meat_alternate' | 'vegetable' | 'fruit' | 'milk' | 'supplies' | 'other'
export type FoodExpenseCategory = 'groceries' | 'dairy' | 'produce' | 'meat' | 'supplies'
export type PaymentMethod = 'card' | 'cash' | 'check' | 'account'
export type StorageLocation = 'refrigerator' | 'freezer' | 'pantry'
export type TransactionType = 'received' | 'used' | 'wasted' | 'adjusted'

// ==================== Menu Items ====================

export interface MenuItem {
  id: string
  organization_id: string
  name: string
  description: string | null
  meal_type: MealType
  category: FoodCategory
  portion_size: string | null
  calories: number | null
  allergens: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MenuItemFormData {
  name: string
  description?: string
  meal_type: MealType
  category: FoodCategory
  portion_size?: string
  calories?: number
  allergens?: string[]
}

// ==================== Daily Menus ====================

export interface DailyMenu {
  id: string
  organization_id: string
  menu_date: string
  meal_type: MealType
  menu_items: MenuItem[] | string[]
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface DailyMenuFormData {
  menu_date: string
  meal_type: MealType
  menu_items: string[]
  notes?: string
}

// ==================== Meal Attendance ====================

export interface MealAttendance {
  id: string
  organization_id: string
  child_id: string
  meal_date: string
  meal_type: MealType
  served: boolean
  served_at: string | null
  served_by: string | null
  portion_eaten: PortionEaten | null
  notes: string | null
  created_at: string
  child?: {
    id: string
    first_name: string
    last_name: string
    classroom_id: string | null
    dietary_restrictions: string | null
    allergies: string[] | null
  }
}

export interface MealAttendanceFormData {
  child_id: string
  meal_date: string
  meal_type: MealType
  served: boolean
  portion_eaten?: PortionEaten
  notes?: string
}

// ==================== Food Budget ====================

export interface FoodBudget {
  id: string
  organization_id: string
  year: number
  month: number
  budgeted_amount: number
  spent_amount?: number
  remaining_amount?: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface FoodBudgetFormData {
  year: number
  month: number
  budgeted_amount: number
  notes?: string
}

export interface FoodBudgetSummary {
  budget: FoodBudget | null
  total_spent: number
  remaining: number
  expenses_count: number
  categories_breakdown: {
    category: FoodExpenseCategory
    amount: number
    percentage: number
  }[]
}

// ==================== Food Expenses ====================

export interface FoodExpense {
  id: string
  organization_id: string
  food_budget_id: string | null
  expense_date: string
  vendor: string
  description: string | null
  category: FoodExpenseCategory
  amount: number
  tax_amount: number
  total_amount: number
  payment_method: PaymentMethod | null
  receipt_url: string | null
  recorded_by: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

export interface FoodExpenseFormData {
  expense_date: string
  vendor: string
  description?: string
  category: FoodExpenseCategory
  amount: number
  tax_amount?: number
  payment_method?: PaymentMethod
  receipt_url?: string
}

// ==================== Food Inventory ====================

export interface FoodInventoryItem {
  id: string
  organization_id: string
  item_name: string
  category: FoodCategory
  unit: string
  quantity_on_hand: number
  minimum_quantity: number
  reorder_point: number
  unit_cost: number | null
  supplier: string | null
  expiration_date: string | null
  storage_location: StorageLocation | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FoodInventoryFormData {
  item_name: string
  category: FoodCategory
  unit: string
  quantity_on_hand?: number
  minimum_quantity?: number
  reorder_point?: number
  unit_cost?: number
  supplier?: string
  expiration_date?: string
  storage_location?: StorageLocation
  notes?: string
}

export interface InventoryTransaction {
  id: string
  organization_id: string
  inventory_item_id: string
  transaction_type: TransactionType
  quantity: number
  transaction_date: string
  reference_id: string | null
  notes: string | null
  recorded_by: string | null
  created_at: string
  inventory_item?: FoodInventoryItem
}

export interface InventoryTransactionFormData {
  inventory_item_id: string
  transaction_type: TransactionType
  quantity: number
  transaction_date?: string
  reference_id?: string
  notes?: string
}

// ==================== Milk Inventory ====================

export interface MilkInventory {
  id: string
  organization_id: string
  inventory_date: string
  milk_type: MilkType
  quantity_unit: string
  opening_quantity: number
  received_quantity: number
  used_quantity: number
  spoiled_quantity: number
  closing_quantity: number
  expiration_date: string | null
  recorded_by: string | null
  notes: string | null
  created_at: string
}

export interface MilkInventoryFormData {
  inventory_date: string
  milk_type: MilkType
  opening_quantity: number
  received_quantity?: number
  used_quantity?: number
  spoiled_quantity?: number
  expiration_date?: string
  notes?: string
}

// ==================== Reports ====================

export interface CACFPReport {
  report_date: string
  total_children: number
  meals_by_type: {
    meal_type: MealType
    total_served: number
    children_served: string[]
  }[]
  reimbursement_estimate: number
}

export interface CACFPSummary {
  total_meals_served: number
  meals_by_type: { meal_type: MealType; count: number }[]
  total_children_served: number
  estimated_reimbursement: number
  daily_average: number
  operating_days: number
}

export interface DailyMealReport {
  date: string
  meals: {
    meal_type: MealType
    total_served: number
    children: { id: string; name: string; portion: string | null }[]
  }[]
  children_with_allergies: { id: string; name: string; allergies: string[] }[]
}

export interface InventoryReport {
  total_items: number
  total_value: number
  low_stock_items: FoodInventoryItem[]
  expiring_soon: FoodInventoryItem[]
  items_by_category: {
    category: FoodCategory
    count: number
    value: number
  }[]
}

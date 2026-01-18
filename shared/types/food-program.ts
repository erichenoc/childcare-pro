// =====================================================
// Food Program Types
// =====================================================

export type MealType = 'breakfast' | 'snack' | 'lunch' | 'dinner'
export type MilkType = 'whole' | '2%' | 'skim' | 'lactose_free'
export type AmountEaten = 'all' | 'most' | 'some' | 'none'
export type FoodExpenseCategory = 'groceries' | 'dairy' | 'produce' | 'meat' | 'supplies'
export type PaymentMethod = 'card' | 'cash' | 'check' | 'account'

export interface MealCategory {
  id: string
  organization_id: string
  name: string
  meal_type: MealType
  serving_time: string | null
  is_active: boolean
  requires_milk: boolean
  requires_fruit: boolean
  requires_vegetable: boolean
  requires_grain: boolean
  requires_protein: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface MenuTemplate {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_active: boolean
  week_number: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  organization_id: string
  menu_template_id: string
  meal_category_id: string
  day_of_week: number
  main_item: string
  side_items: string[] | null
  milk_type: MilkType | null
  fruit: string | null
  vegetable: string | null
  grain: string | null
  calories: number | null
  protein_grams: number | null
  notes: string | null
  created_at: string
}

export interface DailyMenu {
  id: string
  organization_id: string
  date: string
  meal_category_id: string
  main_item: string
  side_items: string[] | null
  milk_type: MilkType | null
  fruit: string | null
  vegetable: string | null
  grain: string | null
  portions_prepared: number | null
  portions_served: number | null
  portions_wasted: number | null
  prepared_by: string | null
  served_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MealRecord {
  id: string
  organization_id: string
  daily_menu_id: string
  child_id: string
  date: string
  meal_category_id: string
  served: boolean
  amount_eaten: AmountEaten | null
  dietary_substitution: string | null
  refused_reason: string | null
  recorded_by: string | null
  recorded_at: string
  notes: string | null
}

export interface FoodBudget {
  id: string
  organization_id: string
  year: number
  month: number
  budgeted_amount: number
  spent_amount: number
  remaining_amount: number
  children_count: number | null
  cost_per_child: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface FoodExpense {
  id: string
  organization_id: string
  food_budget_id: string | null
  date: string
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

export interface MilkInventory {
  id: string
  organization_id: string
  date: string
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

export interface MealParticipation {
  total_children: number
  children_served: number
  children_absent: number
  participation_rate: number
}

export interface WeeklyMealSummary {
  organization_id: string
  week_start: string
  meal_name: string
  meal_type: MealType
  days_served: number
  total_portions: number
  total_wasted: number
  waste_percentage: number
}

export interface MonthlyFoodReport {
  organization_id: string
  year: number
  month: number
  budgeted_amount: number
  spent_amount: number
  remaining_amount: number
  children_count: number | null
  cost_per_child: number
  days_served: number
  total_meals_served: number
}

export interface DailyMenuFormData {
  date: string
  meal_category_id: string
  main_item: string
  side_items?: string[]
  milk_type?: MilkType
  fruit?: string
  vegetable?: string
  grain?: string
  portions_prepared?: number
}

export interface MealRecordFormData {
  child_id: string
  served: boolean
  amount_eaten?: AmountEaten
  dietary_substitution?: string
  refused_reason?: string
  notes?: string
}

export interface FoodExpenseFormData {
  date: string
  vendor: string
  description?: string
  category: FoodExpenseCategory
  amount: number
  tax_amount?: number
  payment_method?: PaymentMethod
  receipt_url?: string
}

export interface MilkInventoryFormData {
  date: string
  milk_type: MilkType
  opening_quantity: number
  received_quantity?: number
  used_quantity?: number
  spoiled_quantity?: number
  expiration_date?: string
  notes?: string
}

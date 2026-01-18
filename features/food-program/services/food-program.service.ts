import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'

// ================== TYPES ==================

export type MealType = 'breakfast' | 'am_snack' | 'lunch' | 'pm_snack' | 'supper'

export interface MenuItem {
  id: string
  organization_id: string
  name: string
  description: string | null
  meal_type: MealType
  category: 'grain' | 'meat_alternate' | 'vegetable' | 'fruit' | 'milk' | 'other'
  portion_size: string | null
  calories: number | null
  allergens: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

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

export interface MealAttendance {
  id: string
  organization_id: string
  child_id: string
  meal_date: string
  meal_type: MealType
  served: boolean
  served_at: string | null
  served_by: string | null
  portion_eaten: 'none' | 'partial' | 'full' | null
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

export interface MealFormData {
  menu_date: string
  meal_type: MealType
  menu_items: string[]
  notes?: string
}

export interface MealAttendanceFormData {
  child_id: string
  meal_date: string
  meal_type: MealType
  served: boolean
  portion_eaten?: 'none' | 'partial' | 'full'
  notes?: string
}

// ================== CONSTANTS ==================

export const MEAL_TYPES: { value: MealType; label: string; time: string }[] = [
  { value: 'breakfast', label: 'Desayuno', time: '7:00 - 9:00 AM' },
  { value: 'am_snack', label: 'Merienda AM', time: '9:30 - 10:30 AM' },
  { value: 'lunch', label: 'Almuerzo', time: '11:30 AM - 1:00 PM' },
  { value: 'pm_snack', label: 'Merienda PM', time: '3:00 - 4:00 PM' },
  { value: 'supper', label: 'Cena', time: '5:00 - 6:30 PM' },
]

export const FOOD_CATEGORIES = [
  { value: 'grain', label: 'Granos/Pan' },
  { value: 'meat_alternate', label: 'Carne/Alternativa' },
  { value: 'vegetable', label: 'Vegetales' },
  { value: 'fruit', label: 'Frutas' },
  { value: 'milk', label: 'Leche' },
  { value: 'other', label: 'Otro' },
]

export const COMMON_ALLERGENS = [
  { value: 'milk', label: 'Leche' },
  { value: 'eggs', label: 'Huevos' },
  { value: 'peanuts', label: 'Maní' },
  { value: 'tree_nuts', label: 'Nueces' },
  { value: 'wheat', label: 'Trigo' },
  { value: 'soy', label: 'Soya' },
  { value: 'fish', label: 'Pescado' },
  { value: 'shellfish', label: 'Mariscos' },
]

// USDA CACFP Reimbursement rates (2024-2025 estimates)
export const CACFP_RATES = {
  breakfast: { free: 2.04, reduced: 1.74, paid: 0.36 },
  lunch: { free: 4.32, reduced: 3.92, paid: 0.37 },
  supper: { free: 4.32, reduced: 3.92, paid: 0.37 },
  am_snack: { free: 1.07, reduced: 0.53, paid: 0.09 },
  pm_snack: { free: 1.07, reduced: 0.53, paid: 0.09 },
}

// ================== SERVICE ==================

export const foodProgramService = {
  // ==================== MENU ITEMS ====================

  async getMenuItems(): Promise<MenuItem[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('name')

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') return []
      throw error
    }
    return data || []
  },

  async createMenuItem(item: Omit<MenuItem, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        organization_id: orgId,
        ...item,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ==================== DAILY MENUS ====================

  async getDailyMenu(date: string): Promise<DailyMenu[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('daily_menus')
      .select('*')
      .eq('organization_id', orgId)
      .eq('menu_date', date)
      .order('meal_type')

    if (error) {
      if (error.code === '42P01') return []
      throw error
    }
    return data || []
  },

  async setDailyMenu(data: MealFormData): Promise<DailyMenu> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Upsert daily menu
    const { data: menu, error } = await supabase
      .from('daily_menus')
      .upsert({
        organization_id: orgId,
        menu_date: data.menu_date,
        meal_type: data.meal_type,
        menu_items: data.menu_items,
        notes: data.notes,
        created_by: user?.id,
      }, {
        onConflict: 'organization_id,menu_date,meal_type',
      })
      .select()
      .single()

    if (error) throw error
    return menu
  },

  // ==================== MEAL ATTENDANCE ====================

  async getMealAttendance(date: string, mealType?: MealType): Promise<MealAttendance[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    let query = supabase
      .from('meal_attendance')
      .select(`
        *,
        child:children (
          id,
          first_name,
          last_name,
          classroom_id,
          dietary_restrictions,
          allergies
        )
      `)
      .eq('organization_id', orgId)
      .eq('meal_date', date)

    if (mealType) {
      query = query.eq('meal_type', mealType)
    }

    const { data, error } = await query.order('created_at')

    if (error) {
      if (error.code === '42P01') return []
      throw error
    }
    return data || []
  },

  async getChildrenForMeal(date: string): Promise<{
    id: string
    first_name: string
    last_name: string
    classroom_id: string | null
    dietary_restrictions: string | null
    allergies: string[] | null
    attendance_status: 'checked_in' | 'checked_out' | 'absent' | 'unknown'
  }[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get all children with their attendance status for the day
    const { data: children, error: childError } = await supabase
      .from('children')
      .select(`
        id,
        first_name,
        last_name,
        classroom_id,
        dietary_restrictions,
        allergies
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('last_name')

    if (childError) throw childError

    // Get attendance for today
    const { data: attendance } = await supabase
      .from('attendance')
      .select('child_id, check_in_time, check_out_time')
      .eq('organization_id', orgId)
      .eq('date', date)

    const attendanceMap = new Map(attendance?.map(a => [
      a.child_id,
      a.check_out_time ? 'checked_out' : (a.check_in_time ? 'checked_in' : 'absent')
    ]))

    return (children || []).map(child => ({
      ...child,
      attendance_status: attendanceMap.get(child.id) as 'checked_in' | 'checked_out' | 'absent' || 'unknown',
    }))
  },

  async recordMealAttendance(data: MealAttendanceFormData): Promise<MealAttendance> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: record, error } = await supabase
      .from('meal_attendance')
      .upsert({
        organization_id: orgId,
        child_id: data.child_id,
        meal_date: data.meal_date,
        meal_type: data.meal_type,
        served: data.served,
        served_at: data.served ? new Date().toISOString() : null,
        served_by: data.served ? user?.id : null,
        portion_eaten: data.portion_eaten,
        notes: data.notes,
      }, {
        onConflict: 'organization_id,child_id,meal_date,meal_type',
      })
      .select()
      .single()

    if (error) throw error
    return record
  },

  async bulkRecordMealAttendance(
    date: string,
    mealType: MealType,
    childIds: string[],
    served: boolean = true
  ): Promise<void> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const records = childIds.map(childId => ({
      organization_id: orgId,
      child_id: childId,
      meal_date: date,
      meal_type: mealType,
      served,
      served_at: served ? new Date().toISOString() : null,
      served_by: served ? user?.id : null,
    }))

    const { error } = await supabase
      .from('meal_attendance')
      .upsert(records, {
        onConflict: 'organization_id,child_id,meal_date,meal_type',
      })

    if (error) throw error
  },

  // ==================== REPORTS ====================

  async getDailyReport(date: string): Promise<{
    date: string
    meals: {
      meal_type: MealType
      total_served: number
      children: { id: string; name: string; portion: string | null }[]
    }[]
    children_with_allergies: { id: string; name: string; allergies: string[] }[]
  }> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data: attendance, error } = await supabase
      .from('meal_attendance')
      .select(`
        *,
        child:children (
          id,
          first_name,
          last_name,
          allergies
        )
      `)
      .eq('organization_id', orgId)
      .eq('meal_date', date)
      .eq('served', true)

    if (error) {
      if (error.code === '42P01') {
        return { date, meals: [], children_with_allergies: [] }
      }
      throw error
    }

    // Group by meal type
    const mealGroups = new Map<MealType, MealAttendance[]>()
    for (const record of attendance || []) {
      const group = mealGroups.get(record.meal_type) || []
      group.push(record)
      mealGroups.set(record.meal_type, group)
    }

    // Build report
    const meals = MEAL_TYPES.map(({ value }) => {
      const records = mealGroups.get(value) || []
      return {
        meal_type: value,
        total_served: records.length,
        children: records.map(r => ({
          id: r.child?.id || '',
          name: r.child ? `${r.child.first_name} ${r.child.last_name}` : 'Unknown',
          portion: r.portion_eaten,
        })),
      }
    })

    // Children with allergies
    const childrenWithAllergies = new Map<string, { id: string; name: string; allergies: string[] }>()
    for (const record of attendance || []) {
      if (record.child?.allergies && record.child.allergies.length > 0) {
        childrenWithAllergies.set(record.child.id, {
          id: record.child.id,
          name: `${record.child.first_name} ${record.child.last_name}`,
          allergies: record.child.allergies,
        })
      }
    }

    return {
      date,
      meals,
      children_with_allergies: Array.from(childrenWithAllergies.values()),
    }
  },

  async getMonthlyReport(year: number, month: number): Promise<CACFPReport[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: attendance, error } = await supabase
      .from('meal_attendance')
      .select(`
        *,
        child:children (
          id,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', orgId)
      .gte('meal_date', startDate)
      .lte('meal_date', endDate)
      .eq('served', true)

    if (error) {
      if (error.code === '42P01') return []
      throw error
    }

    // Group by date
    const dateGroups = new Map<string, MealAttendance[]>()
    for (const record of attendance || []) {
      const group = dateGroups.get(record.meal_date) || []
      group.push(record)
      dateGroups.set(record.meal_date, group)
    }

    // Build daily reports
    const reports: CACFPReport[] = []
    for (const [date, records] of dateGroups) {
      // Group by meal type
      const mealGroups = new Map<MealType, string[]>()
      const uniqueChildren = new Set<string>()

      for (const record of records) {
        uniqueChildren.add(record.child_id)
        const children = mealGroups.get(record.meal_type) || []
        children.push(record.child_id)
        mealGroups.set(record.meal_type, children)
      }

      // Calculate reimbursement (assuming all free tier for simplicity)
      let reimbursement = 0
      for (const [mealType, children] of mealGroups) {
        const rate = CACFP_RATES[mealType].free
        reimbursement += rate * children.length
      }

      reports.push({
        report_date: date,
        total_children: uniqueChildren.size,
        meals_by_type: Array.from(mealGroups).map(([meal_type, children]) => ({
          meal_type,
          total_served: children.length,
          children_served: children,
        })),
        reimbursement_estimate: reimbursement,
      })
    }

    return reports.sort((a, b) => a.report_date.localeCompare(b.report_date))
  },

  async getCACFPSummary(year: number, month: number): Promise<{
    total_meals_served: number
    meals_by_type: { meal_type: MealType; count: number }[]
    total_children_served: number
    estimated_reimbursement: number
    daily_average: number
    operating_days: number
  }> {
    const reports = await this.getMonthlyReport(year, month)

    const mealCounts = new Map<MealType, number>()
    let totalMeals = 0
    let totalReimbursement = 0
    const uniqueChildren = new Set<string>()

    for (const report of reports) {
      totalReimbursement += report.reimbursement_estimate
      for (const meal of report.meals_by_type) {
        const current = mealCounts.get(meal.meal_type) || 0
        mealCounts.set(meal.meal_type, current + meal.total_served)
        totalMeals += meal.total_served
        meal.children_served.forEach(c => uniqueChildren.add(c))
      }
    }

    const operatingDays = reports.length

    return {
      total_meals_served: totalMeals,
      meals_by_type: Array.from(mealCounts).map(([meal_type, count]) => ({
        meal_type,
        count,
      })),
      total_children_served: uniqueChildren.size,
      estimated_reimbursement: totalReimbursement,
      daily_average: operatingDays > 0 ? totalMeals / operatingDays : 0,
      operating_days: operatingDays,
    }
  },

  // ==================== DIETARY ALERTS ====================

  async getChildrenWithDietaryNeeds(): Promise<{
    id: string
    name: string
    allergies: string[]
    dietary_restrictions: string | null
  }[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('children')
      .select('id, first_name, last_name, allergies, dietary_restrictions')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .or('allergies.neq.{},dietary_restrictions.neq.null')

    if (error) throw error

    return (data || [])
      .filter(c => (c.allergies && c.allergies.length > 0) || c.dietary_restrictions)
      .map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
        allergies: c.allergies || [],
        dietary_restrictions: c.dietary_restrictions,
      }))
  },
}

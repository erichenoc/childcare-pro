import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { MilkType } from '@/shared/types/food-program'

// ================== USDA/CACFP Milk Requirements ==================

// Fluid milk requirements per meal/snack by age group (in oz)
export const MILK_REQUIREMENTS = {
  // Infants 0-5 months: breast milk or iron-fortified formula
  infant_0_5: { oz_per_meal: 4, type: 'formula' as const, notes: 'Breast milk or iron-fortified formula only' },
  // Infants 6-11 months: breast milk or iron-fortified formula
  infant_6_11: { oz_per_meal: 6, type: 'formula' as const, notes: 'Breast milk or iron-fortified formula only' },
  // 1 year old: whole milk
  toddler_1: { oz_per_meal: 4, type: 'whole' as MilkType, notes: 'Whole milk required' },
  // 2-5 years: low-fat or fat-free milk
  preschool_2_5: { oz_per_meal: 6, type: '2%' as MilkType, notes: 'Low-fat (1%) or fat-free preferred' },
  // 6+ years: low-fat or fat-free milk
  school_age: { oz_per_meal: 8, type: 'skim' as MilkType, notes: 'Low-fat (1%) or fat-free required' },
}

// Meals that require milk according to CACFP
export const MEALS_REQUIRING_MILK = ['breakfast', 'lunch', 'dinner', 'supper']
export const SNACKS_WITH_MILK = ['am_snack', 'pm_snack'] // Optional milk component

export interface ChildMilkRequirement {
  child_id: string
  child_name: string
  age_months: number
  age_group: keyof typeof MILK_REQUIREMENTS
  milk_type: MilkType | 'formula'
  oz_per_meal: number
  daily_meals: number
  daily_oz_needed: number
  weekly_oz_needed: number
  notes: string
  has_milk_allergy: boolean
  alternative?: string
}

export interface DailyMilkCalculation {
  date: string
  total_children: number
  children_with_milk_allergy: number
  by_milk_type: {
    milk_type: MilkType | 'formula'
    children_count: number
    oz_per_child: number
    total_oz: number
    gallons: number
  }[]
  total_oz: number
  total_gallons: number
  meals_planned: string[]
}

export interface WeeklyMilkForecast {
  week_start: string
  week_end: string
  operating_days: number
  children_count: number
  by_milk_type: {
    milk_type: MilkType | 'formula'
    total_oz: number
    gallons: number
    estimated_cost: number
  }[]
  total_gallons: number
  estimated_total_cost: number
  notes: string[]
}

// Milk prices estimation (per gallon)
const MILK_PRICES = {
  whole: 4.50,
  '2%': 4.25,
  skim: 4.00,
  lactose_free: 6.50,
  formula: 0, // Provided by parents
}

// ================== UTILITY FUNCTIONS ==================

/**
 * Calculate age in months from date of birth
 */
function calculateAgeInMonths(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth)
  const today = new Date()
  const months = (today.getFullYear() - birth.getFullYear()) * 12 +
                 (today.getMonth() - birth.getMonth())
  return Math.max(0, months)
}

/**
 * Determine age group based on months
 */
function getAgeGroup(months: number): keyof typeof MILK_REQUIREMENTS {
  if (months < 6) return 'infant_0_5'
  if (months < 12) return 'infant_6_11'
  if (months < 24) return 'toddler_1'
  if (months < 72) return 'preschool_2_5' // 2-5 years (24-71 months)
  return 'school_age' // 6+ years
}

/**
 * Convert oz to gallons
 */
function ozToGallons(oz: number): number {
  return Number((oz / 128).toFixed(2))
}

/**
 * Get display name for age group
 */
function getAgeGroupLabel(group: keyof typeof MILK_REQUIREMENTS): string {
  const labels: Record<keyof typeof MILK_REQUIREMENTS, string> = {
    infant_0_5: 'Infante (0-5 meses)',
    infant_6_11: 'Infante (6-11 meses)',
    toddler_1: '1 Año',
    preschool_2_5: 'Preescolar (2-5 años)',
    school_age: 'Escolar (6+ años)',
  }
  return labels[group]
}

// ================== SERVICE ==================

export const milkCalculatorService = {
  /**
   * Calculate milk requirements for all active children
   */
  async calculateChildrenMilkRequirements(): Promise<ChildMilkRequirement[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get all active children with their allergies
    const { data: children, error } = await supabase
      .from('children')
      .select('id, first_name, last_name, date_of_birth, allergies, dietary_restrictions')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('last_name')

    if (error) throw error
    if (!children) return []

    // Default meals per day (can be configured)
    const dailyMeals = 3 // breakfast, lunch, snack

    return children.map(child => {
      const ageMonths = calculateAgeInMonths(child.date_of_birth)
      const ageGroup = getAgeGroup(ageMonths)
      const requirements = MILK_REQUIREMENTS[ageGroup]

      // Check for milk allergy
      const allergies = child.allergies || []
      const hasMilkAllergy = allergies.some((a: string) =>
        a.toLowerCase().includes('milk') ||
        a.toLowerCase().includes('leche') ||
        a.toLowerCase().includes('dairy') ||
        a.toLowerCase().includes('lactose')
      )

      const dietaryRestrictions = (child.dietary_restrictions || '').toLowerCase()
      const isLactoseIntolerant = dietaryRestrictions.includes('lactose') ||
                                   dietaryRestrictions.includes('lactosa')

      let milkType = requirements.type
      let alternative = undefined

      if (hasMilkAllergy) {
        alternative = 'Alternativa sin lácteos requerida'
      } else if (isLactoseIntolerant) {
        milkType = 'lactose_free'
        alternative = 'Leche sin lactosa'
      }

      const dailyOz = requirements.oz_per_meal * dailyMeals
      const weeklyOz = dailyOz * 5 // 5 operating days

      return {
        child_id: child.id,
        child_name: `${child.first_name} ${child.last_name}`,
        age_months: ageMonths,
        age_group: ageGroup,
        milk_type: milkType,
        oz_per_meal: requirements.oz_per_meal,
        daily_meals: dailyMeals,
        daily_oz_needed: hasMilkAllergy ? 0 : dailyOz,
        weekly_oz_needed: hasMilkAllergy ? 0 : weeklyOz,
        notes: requirements.notes,
        has_milk_allergy: hasMilkAllergy,
        alternative,
      }
    })
  },

  /**
   * Calculate total milk needed for a specific date
   */
  async calculateDailyMilk(date: string, mealsPlanned: string[] = ['breakfast', 'lunch', 'pm_snack']): Promise<DailyMilkCalculation> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get children who are expected to attend (checked in or scheduled)
    const { data: attendance } = await supabase
      .from('attendance')
      .select('child_id')
      .eq('organization_id', orgId)
      .eq('date', date)
      .is('check_out_time', null) // Still present

    const presentChildIds = attendance?.map(a => a.child_id) || []

    // Get all active children (fallback if no attendance recorded yet)
    const { data: children, error } = await supabase
      .from('children')
      .select('id, first_name, last_name, date_of_birth, allergies, dietary_restrictions')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('last_name')

    if (error) throw error
    if (!children) {
      return {
        date,
        total_children: 0,
        children_with_milk_allergy: 0,
        by_milk_type: [],
        total_oz: 0,
        total_gallons: 0,
        meals_planned: mealsPlanned,
      }
    }

    // Use attendance if available, otherwise all active children
    const targetChildren = presentChildIds.length > 0
      ? children.filter(c => presentChildIds.includes(c.id))
      : children

    // Count meals requiring milk
    const milkMeals = mealsPlanned.filter(m => MEALS_REQUIRING_MILK.includes(m)).length
    const milkSnacks = mealsPlanned.filter(m => SNACKS_WITH_MILK.includes(m)).length * 0.5 // Half portion for snacks

    // Group by milk type
    const byMilkType = new Map<MilkType | 'formula', { children: number; totalOz: number }>()
    let childrenWithAllergy = 0

    for (const child of targetChildren) {
      const ageMonths = calculateAgeInMonths(child.date_of_birth)
      const ageGroup = getAgeGroup(ageMonths)
      const requirements = MILK_REQUIREMENTS[ageGroup]

      const allergies = child.allergies || []
      const hasMilkAllergy = allergies.some((a: string) =>
        a.toLowerCase().includes('milk') ||
        a.toLowerCase().includes('leche') ||
        a.toLowerCase().includes('dairy')
      )

      if (hasMilkAllergy) {
        childrenWithAllergy++
        continue
      }

      const dietaryRestrictions = (child.dietary_restrictions || '').toLowerCase()
      const isLactoseIntolerant = dietaryRestrictions.includes('lactose')

      let milkType: MilkType | 'formula' = requirements.type
      if (isLactoseIntolerant) milkType = 'lactose_free'

      const dailyOz = requirements.oz_per_meal * (milkMeals + milkSnacks)

      const current = byMilkType.get(milkType) || { children: 0, totalOz: 0 }
      byMilkType.set(milkType, {
        children: current.children + 1,
        totalOz: current.totalOz + dailyOz,
      })
    }

    const results = Array.from(byMilkType.entries()).map(([milk_type, data]) => ({
      milk_type,
      children_count: data.children,
      oz_per_child: data.totalOz / data.children,
      total_oz: data.totalOz,
      gallons: ozToGallons(data.totalOz),
    }))

    const totalOz = results.reduce((sum, r) => sum + r.total_oz, 0)

    return {
      date,
      total_children: targetChildren.length,
      children_with_milk_allergy: childrenWithAllergy,
      by_milk_type: results,
      total_oz: totalOz,
      total_gallons: ozToGallons(totalOz),
      meals_planned: mealsPlanned,
    }
  },

  /**
   * Generate weekly milk purchase forecast
   */
  async generateWeeklyForecast(weekStart: string): Promise<WeeklyMilkForecast> {
    const requirements = await this.calculateChildrenMilkRequirements()

    // Calculate week end
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(end.getDate() + 4) // Monday to Friday

    // Group by milk type
    const byMilkType = new Map<MilkType | 'formula', number>()
    const notes: string[] = []
    let totalChildren = 0

    for (const child of requirements) {
      if (child.has_milk_allergy) {
        notes.push(`${child.child_name}: Alergia a la leche - requiere alternativa`)
        continue
      }

      totalChildren++
      const current = byMilkType.get(child.milk_type) || 0
      byMilkType.set(child.milk_type, current + child.weekly_oz_needed)
    }

    // Count age groups for notes
    const infantCount = requirements.filter(r =>
      r.age_group === 'infant_0_5' || r.age_group === 'infant_6_11'
    ).length
    const toddlerCount = requirements.filter(r => r.age_group === 'toddler_1').length
    const preschoolCount = requirements.filter(r => r.age_group === 'preschool_2_5').length
    const schoolCount = requirements.filter(r => r.age_group === 'school_age').length

    if (infantCount > 0) notes.push(`${infantCount} infantes: Fórmula proporcionada por padres`)
    if (toddlerCount > 0) notes.push(`${toddlerCount} niños de 1 año: Leche entera requerida`)
    if (preschoolCount > 0) notes.push(`${preschoolCount} preescolares (2-5): Leche baja en grasa`)
    if (schoolCount > 0) notes.push(`${schoolCount} escolares (6+): Leche descremada`)

    const results = Array.from(byMilkType.entries())
      .filter(([type]) => type !== 'formula') // Exclude formula (provided by parents)
      .map(([milk_type, total_oz]) => ({
        milk_type,
        total_oz,
        gallons: ozToGallons(total_oz),
        estimated_cost: ozToGallons(total_oz) * (MILK_PRICES[milk_type as MilkType] || 4.25),
      }))

    const totalGallons = results.reduce((sum, r) => sum + r.gallons, 0)
    const totalCost = results.reduce((sum, r) => sum + r.estimated_cost, 0)

    return {
      week_start: weekStart,
      week_end: end.toISOString().split('T')[0],
      operating_days: 5,
      children_count: totalChildren,
      by_milk_type: results,
      total_gallons: totalGallons,
      estimated_total_cost: Math.round(totalCost * 100) / 100,
      notes,
    }
  },

  /**
   * Get milk requirement summary grouped by age
   */
  async getMilkRequirementsByAgeGroup(): Promise<{
    age_group: keyof typeof MILK_REQUIREMENTS
    age_group_label: string
    children_count: number
    milk_type: MilkType | 'formula'
    oz_per_meal: number
    total_daily_oz: number
    notes: string
  }[]> {
    const requirements = await this.calculateChildrenMilkRequirements()

    // Group by age group
    const groups = new Map<keyof typeof MILK_REQUIREMENTS, ChildMilkRequirement[]>()
    for (const child of requirements) {
      if (child.has_milk_allergy) continue
      const group = groups.get(child.age_group) || []
      group.push(child)
      groups.set(child.age_group, group)
    }

    return Array.from(groups.entries()).map(([ageGroup, children]) => {
      const reqs = MILK_REQUIREMENTS[ageGroup]
      return {
        age_group: ageGroup,
        age_group_label: getAgeGroupLabel(ageGroup),
        children_count: children.length,
        milk_type: reqs.type,
        oz_per_meal: reqs.oz_per_meal,
        total_daily_oz: children.reduce((sum, c) => sum + c.daily_oz_needed, 0),
        notes: reqs.notes,
      }
    }).sort((a, b) => {
      const order: (keyof typeof MILK_REQUIREMENTS)[] = [
        'infant_0_5', 'infant_6_11', 'toddler_1', 'preschool_2_5', 'school_age'
      ]
      return order.indexOf(a.age_group) - order.indexOf(b.age_group)
    })
  },

  /**
   * Check if milk inventory is sufficient for the week
   */
  async checkMilkInventoryStatus(): Promise<{
    has_sufficient: boolean
    shortage_gallons: number
    by_type: {
      milk_type: MilkType
      needed_gallons: number
      available_gallons: number
      shortage: number
    }[]
    recommendation: string
  }> {
    const forecast = await this.generateWeeklyForecast(
      new Date().toISOString().split('T')[0]
    )

    // For now, assume no inventory tracking (would integrate with MilkInventory table)
    // This is a placeholder that can be connected to actual inventory
    const availableInventory: Record<MilkType, number> = {
      whole: 0,
      '2%': 0,
      skim: 0,
      lactose_free: 0,
      formula: 0,
    }

    const byType = forecast.by_milk_type
      .filter(t => t.milk_type !== 'formula')
      .map(t => ({
        milk_type: t.milk_type as MilkType,
        needed_gallons: t.gallons,
        available_gallons: availableInventory[t.milk_type as MilkType] || 0,
        shortage: Math.max(0, t.gallons - (availableInventory[t.milk_type as MilkType] || 0)),
      }))

    const totalShortage = byType.reduce((sum, t) => sum + t.shortage, 0)

    let recommendation = ''
    if (totalShortage === 0) {
      recommendation = 'Inventario suficiente para la semana'
    } else if (totalShortage < 2) {
      recommendation = 'Considere comprar leche adicional pronto'
    } else {
      recommendation = `Se necesitan aproximadamente ${totalShortage.toFixed(1)} galones adicionales para la semana`
    }

    return {
      has_sufficient: totalShortage === 0,
      shortage_gallons: totalShortage,
      by_type: byType,
      recommendation,
    }
  },
}

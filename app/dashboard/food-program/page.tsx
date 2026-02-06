'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  UtensilsCrossed,
  Calendar,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Apple,
  Sandwich,
  Cookie,
  Moon,
  AlertCircle,
  Milk,
  Package,
  DollarSign,
  ClipboardList,
  FileBarChart,
} from 'lucide-react'
import {
  foodProgramService,
  MEAL_TYPES,
  type MealType,
  type MealAttendance,
} from '@/features/food-program/services/food-program.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassBadge,
  GlassWorkflowStepper,
  type WorkflowStep,
  GlassContextualHelp,
} from '@/shared/components/ui'
import { useTranslations, useLocale } from '@/shared/lib/i18n'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

const MEAL_ICONS: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  am_snack: Apple,
  lunch: Sandwich,
  pm_snack: Cookie,
  supper: Moon,
}

export default function FoodProgramPage() {
  const t = useTranslations()
  const locale = useLocale()
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()))
  const [mealAttendance, setMealAttendance] = useState<MealAttendance[]>([])
  const [childrenWithNeeds, setChildrenWithNeeds] = useState<{ id: string; name: string; allergies: string[]; dietary_restrictions: string | null }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<{
    total_meals_served: number
    meals_by_type: { meal_type: MealType; count: number }[]
    total_children_served: number
    estimated_reimbursement: number
    daily_average: number
    operating_days: number
  } | null>(null)

  const formatDisplayDate = (dateStr: string): string => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString(
      locale === 'es' ? 'es-ES' : 'en-US',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    )
  }

  useEffect(() => {
    loadData()
  }, [selectedDate])

  async function loadData() {
    try {
      setIsLoading(true)
      const [attendanceData, needsData] = await Promise.all([
        foodProgramService.getMealAttendance(selectedDate),
        foodProgramService.getChildrenWithDietaryNeeds(),
      ])

      setMealAttendance(attendanceData)
      setChildrenWithNeeds(needsData)

      // Get monthly summary
      const date = new Date(selectedDate)
      const summaryData = await foodProgramService.getCACFPSummary(
        date.getFullYear(),
        date.getMonth() + 1
      )
      setSummary(summaryData)
    } catch (error) {
      console.error('Error loading food program data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function navigateDate(days: number) {
    const current = new Date(selectedDate + 'T12:00:00')
    current.setDate(current.getDate() + days)
    setSelectedDate(formatDate(current))
  }

  function goToToday() {
    setSelectedDate(formatDate(new Date()))
  }

  // Count meals by type for selected date
  const mealCounts = MEAL_TYPES.map(({ value, label, time }) => {
    const count = mealAttendance.filter(a => a.meal_type === value && a.served).length
    return { type: value, label, time, count }
  })

  const totalServedToday = mealCounts.reduce((sum, m) => sum + m.count, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-primary-600" />
            {t.foodProgram.title}
          </h1>
          <p className="text-gray-500">
            {t.foodProgram.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/food-program/record">
            <GlassButton variant="primary" leftIcon={<CheckCircle className="w-4 h-4" />}>
              {t.foodProgram.recordMeals}
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Food Program Workflow */}
      <div className="flex items-center gap-2">
        <GlassWorkflowStepper
          steps={[
            {
              key: 'record',
              label: t.workflow.foodRecord,
              icon: <ClipboardList className="w-4 h-4" />,
              status: 'current',
            },
            {
              key: 'inventory',
              label: t.workflow.foodInventory,
              icon: <Package className="w-4 h-4" />,
              status: 'upcoming',
            },
            {
              key: 'report',
              label: t.workflow.foodCacfpReport,
              icon: <FileBarChart className="w-4 h-4" />,
              status: 'upcoming',
            },
            {
              key: 'reimburse',
              label: t.workflow.foodReimbursement,
              icon: <DollarSign className="w-4 h-4" />,
              status: 'upcoming',
            },
          ]}
          className="flex-1"
        />
      </div>

      {/* Date Navigation */}
      <GlassCard>
        <GlassCardContent className="py-4">
          <div className="flex items-center justify-between">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => navigateDate(-1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </GlassButton>

            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-gray-900 capitalize">
                {formatDisplayDate(selectedDate)}
              </span>
              {selectedDate !== formatDate(new Date()) && (
                <GlassButton variant="ghost" size="sm" onClick={goToToday}>
                  {t.foodProgram.today}
                </GlassButton>
              )}
            </div>

            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => navigateDate(1)}
            >
              <ChevronRight className="w-5 h-5" />
            </GlassButton>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalServedToday}</p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.foodProgram.mealsToday}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {summary?.total_children_served || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.foodProgram.childrenThisMonth}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {summary?.total_meals_served || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.foodProgram.totalMonth}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-600 font-bold text-sm">$</span>
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {formatCurrency(summary?.estimated_reimbursement || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate flex items-center gap-1">
                {t.foodProgram.estimatedCACFP}
                <GlassContextualHelp
                  title={t.contextHelp.cacfpTitle}
                  content={t.contextHelp.cacfpContent}
                  position="bottom"
                />
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Meal Status */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t.foodProgram.dailyMeals}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3">
              {mealCounts.map(({ type, label, time, count }) => {
                const Icon = MEAL_ICONS[type]
                const isCurrentMeal = checkIfCurrentMeal(type)

                return (
                  <Link
                    key={type}
                    href={`/dashboard/food-program/record?date=${selectedDate}&meal=${type}`}
                  >
                    <div
                      className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                        isCurrentMeal
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isCurrentMeal ? 'bg-primary-100' : 'bg-white'
                          }`}>
                            <Icon className={`w-5 h-5 ${isCurrentMeal ? 'text-primary-600' : 'text-gray-600'}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{label}</p>
                            <p className="text-sm text-gray-500">{time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">{count}</p>
                            <p className="text-xs text-gray-500">{t.foodProgram.served}</p>
                          </div>
                          {isCurrentMeal && (
                            <GlassBadge variant="primary">{t.foodProgram.now}</GlassBadge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </GlassCardContent>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>{t.foodProgram.quickActions}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/dashboard/food-program/record?date=${selectedDate}`}>
                  <GlassButton variant="secondary" fullWidth leftIcon={<CheckCircle className="w-4 h-4" />}>
                    {t.foodProgram.recordMeals}
                  </GlassButton>
                </Link>
                <Link href="/dashboard/food-program/reports">
                  <GlassButton variant="secondary" fullWidth leftIcon={<FileText className="w-4 h-4" />}>
                    {t.foodProgram.cacfpReports}
                  </GlassButton>
                </Link>
                <Link href="/dashboard/food-program/inventory">
                  <GlassButton variant="secondary" fullWidth leftIcon={<Package className="w-4 h-4" />}>
                    {t.foodProgram.inventory}
                  </GlassButton>
                </Link>
                <Link href="/dashboard/food-program/budget">
                  <GlassButton variant="secondary" fullWidth leftIcon={<DollarSign className="w-4 h-4" />}>
                    {t.foodProgram.budget}
                  </GlassButton>
                </Link>
                <Link href="/dashboard/food-program/milk-calculator" className="col-span-2">
                  <GlassButton variant="secondary" fullWidth leftIcon={<Milk className="w-4 h-4" />}>
                    {t.foodProgram.milkCalculator}
                  </GlassButton>
                </Link>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Dietary Alerts */}
          {childrenWithNeeds.length > 0 && (
            <GlassCard className="border-l-4 border-l-amber-500">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                  {t.foodProgram.dietaryAlerts}
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                {childrenWithNeeds.slice(0, 5).map((child) => (
                  <div
                    key={child.id}
                    className="p-3 rounded-lg bg-amber-50 border border-amber-200"
                  >
                    <p className="font-medium text-amber-900">{child.name}</p>
                    {child.allergies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {child.allergies.map((allergy) => (
                          <span
                            key={allergy}
                            className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    )}
                    {child.dietary_restrictions && (
                      <p className="text-xs text-amber-700 mt-1">
                        {child.dietary_restrictions}
                      </p>
                    )}
                  </div>
                ))}
                {childrenWithNeeds.length > 5 && (
                  <p className="text-sm text-amber-600 text-center">
                    +{childrenWithNeeds.length - 5} {t.foodProgram.more}
                  </p>
                )}
              </GlassCardContent>
            </GlassCard>
          )}

          {/* Monthly Summary */}
          {summary && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t.foodProgram.monthlySummary}
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                <div className="space-y-2">
                  {summary.meals_by_type.map(({ meal_type, count }) => {
                    const mealInfo = MEAL_TYPES.find(m => m.value === meal_type)
                    return (
                      <div key={meal_type} className="flex justify-between text-sm">
                        <span className="text-gray-600">{mealInfo?.label || meal_type}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t.foodProgram.operatingDays}</span>
                    <span className="font-medium text-gray-900">{summary.operating_days}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t.foodProgram.dailyAverage}</span>
                    <span className="font-medium text-gray-900">
                      {summary.daily_average.toFixed(1)} {t.foodProgram.meals}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t.foodProgram.estimatedReimbursement}</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {formatCurrency(summary.estimated_reimbursement)}
                    </span>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper to check if it's currently time for a specific meal
function checkIfCurrentMeal(mealType: MealType): boolean {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const time = hour * 60 + minute

  const mealTimes: Record<MealType, [number, number]> = {
    breakfast: [7 * 60, 9 * 60],           // 7:00 - 9:00
    am_snack: [9 * 60 + 30, 10 * 60 + 30], // 9:30 - 10:30
    lunch: [11 * 60 + 30, 13 * 60],        // 11:30 - 13:00
    pm_snack: [15 * 60, 16 * 60],          // 15:00 - 16:00
    supper: [17 * 60, 18 * 60 + 30],       // 17:00 - 18:30
  }

  const [start, end] = mealTimes[mealType]
  return time >= start && time <= end
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Users,
  Check,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Apple,
  Sandwich,
  Cookie,
  Moon,
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
  GlassSelect,
  GlassBadge,
  GlassAvatar,
} from '@/shared/components/ui'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const MEAL_ICONS: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  am_snack: Apple,
  lunch: Sandwich,
  pm_snack: Cookie,
  supper: Moon,
}

interface ChildWithAttendance {
  id: string
  first_name: string
  last_name: string
  classroom_id: string | null
  dietary_restrictions: string | null
  allergies: string[] | null
  attendance_status: 'checked_in' | 'checked_out' | 'absent' | 'unknown'
  served?: boolean
  portion_eaten?: 'none' | 'partial' | 'full' | null
}

function RecordMealContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialDate = searchParams.get('date') || formatDate(new Date())
  const initialMeal = (searchParams.get('meal') as MealType) || 'lunch'

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMeal)
  const [children, setChildren] = useState<ChildWithAttendance[]>([])
  const [existingAttendance, setExistingAttendance] = useState<MealAttendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Track changes
  const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [selectedDate, selectedMeal])

  async function loadData() {
    try {
      setIsLoading(true)
      setError(null)

      const [childrenData, attendanceData] = await Promise.all([
        foodProgramService.getChildrenForMeal(selectedDate),
        foodProgramService.getMealAttendance(selectedDate, selectedMeal),
      ])

      setChildren(childrenData)
      setExistingAttendance(attendanceData)

      // Pre-select children who are already marked as served
      const servedIds = new Set(
        attendanceData.filter(a => a.served).map(a => a.child_id)
      )
      setSelectedChildren(servedIds)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  function navigateDate(days: number) {
    const current = new Date(selectedDate + 'T12:00:00')
    current.setDate(current.getDate() + days)
    setSelectedDate(formatDate(current))
  }

  function toggleChild(childId: string) {
    setSelectedChildren(prev => {
      const next = new Set(prev)
      if (next.has(childId)) {
        next.delete(childId)
      } else {
        next.add(childId)
      }
      return next
    })
  }

  function selectAll() {
    const presentChildren = children.filter(c => c.attendance_status === 'checked_in')
    setSelectedChildren(new Set(presentChildren.map(c => c.id)))
  }

  function deselectAll() {
    setSelectedChildren(new Set())
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Get all children IDs
      const allChildIds = children.map(c => c.id)

      // Separate into served and not served
      const servedIds = Array.from(selectedChildren)
      const notServedIds = allChildIds.filter(id => !selectedChildren.has(id))

      // Record served children
      if (servedIds.length > 0) {
        await foodProgramService.bulkRecordMealAttendance(
          selectedDate,
          selectedMeal,
          servedIds,
          true
        )
      }

      // Record not served children (to track who was present but didn't eat)
      if (notServedIds.length > 0) {
        await foodProgramService.bulkRecordMealAttendance(
          selectedDate,
          selectedMeal,
          notServedIds,
          false
        )
      }

      setSuccess(`${servedIds.length} comidas registradas`)
      await loadData()
    } catch (err) {
      console.error('Error saving:', err)
      setError('Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const mealOptions = MEAL_TYPES.map(m => ({
    value: m.value,
    label: `${m.label} (${m.time})`,
  }))

  const presentChildren = children.filter(c => c.attendance_status === 'checked_in')
  const absentChildren = children.filter(c => c.attendance_status !== 'checked_in')
  const selectedCount = selectedChildren.size
  const presentCount = presentChildren.length

  const MealIcon = MEAL_ICONS[selectedMeal]

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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/food-program">
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MealIcon className="w-6 h-6 text-primary-600" />
            Registrar Comidas
          </h1>
          <p className="text-gray-500">
            Marca los niños que recibieron la comida
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Date and Meal Selection */}
      <GlassCard>
        <GlassCardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <GlassButton variant="ghost" size="sm" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="w-5 h-5" />
              </GlassButton>
              <span className="font-semibold text-gray-900 min-w-[120px] text-center">
                {formatDisplayDate(selectedDate)}
              </span>
              <GlassButton variant="ghost" size="sm" onClick={() => navigateDate(1)}>
                <ChevronRight className="w-5 h-5" />
              </GlassButton>
            </div>

            {/* Meal Selection */}
            <div className="flex-1">
              <GlassSelect
                options={mealOptions}
                value={selectedMeal}
                onChange={(e) => setSelectedMeal(e.target.value as MealType)}
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Allergy Warning Banner */}
      {(() => {
        const childrenWithAllergies = presentChildren.filter(c =>
          (c.allergies && c.allergies.length > 0) || c.dietary_restrictions
        )
        if (childrenWithAllergies.length === 0) return null

        return (
          <GlassCard className="border-l-4 border-l-orange-500 bg-orange-50">
            <GlassCardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-800">
                    Alerta de Alergias y Restricciones
                  </p>
                  <p className="text-sm text-orange-700 mb-3">
                    {childrenWithAllergies.length} niño{childrenWithAllergies.length > 1 ? 's' : ''} presente{childrenWithAllergies.length > 1 ? 's' : ''} con alergias o restricciones alimentarias:
                  </p>
                  <div className="space-y-2">
                    {childrenWithAllergies.map(child => (
                      <div key={child.id} className="flex flex-wrap items-center gap-2 p-2 bg-white/60 rounded-lg">
                        <span className="font-medium text-gray-900">
                          {child.first_name} {child.last_name}:
                        </span>
                        {child.allergies?.map(allergy => (
                          <span key={allergy} className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full border border-red-200">
                            {allergy}
                          </span>
                        ))}
                        {child.dietary_restrictions && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                            {child.dietary_restrictions}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        )
      })()}

      {/* Summary & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">
              <strong className="text-gray-900">{selectedCount}</strong> de {presentCount} presentes seleccionados
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton variant="ghost" size="sm" onClick={selectAll}>
            Seleccionar Todos
          </GlassButton>
          <GlassButton variant="ghost" size="sm" onClick={deselectAll}>
            Deseleccionar
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Guardar ({selectedCount})
          </GlassButton>
        </div>
      </div>

      {/* Children List - Present */}
      {presentChildren.length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Niños Presentes ({presentChildren.length})
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {presentChildren.map((child) => {
                const isSelected = selectedChildren.has(child.id)
                const hasAllergies = child.allergies && child.allergies.length > 0

                return (
                  <button
                    key={child.id}
                    onClick={() => toggleChild(child.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <GlassAvatar name={`${child.first_name} ${child.last_name}`} size="sm" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {child.first_name} {child.last_name}
                          </p>
                          {hasAllergies && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {child.allergies!.slice(0, 2).map((allergy) => (
                                <span
                                  key={allergy}
                                  className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full"
                                >
                                  {allergy}
                                </span>
                              ))}
                              {child.allergies!.length > 2 && (
                                <span className="text-xs text-red-600">
                                  +{child.allergies!.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : null}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Children List - Absent */}
      {absentChildren.length > 0 && (
        <GlassCard className="opacity-60">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-gray-400" />
              No Presentes ({absentChildren.length})
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {absentChildren.map((child) => (
                <div
                  key={child.id}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <GlassAvatar name={`${child.first_name} ${child.last_name}`} size="sm" />
                    <div>
                      <p className="font-medium text-gray-500">
                        {child.first_name} {child.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {child.attendance_status === 'checked_out' ? 'Ya salió' :
                          child.attendance_status === 'absent' ? 'Ausente' : 'Sin registro'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {children.length === 0 && (
        <GlassCard className="p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay niños registrados para este día</p>
        </GlassCard>
      )}
    </div>
  )
}

export default function RecordMealPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    }>
      <RecordMealContent />
    </Suspense>
  )
}

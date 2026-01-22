'use client'

import { useState, useEffect } from 'react'
import {
  X,
  UtensilsCrossed,
  Moon,
  Baby,
  Smile,
  Loader2,
  Users,
  Check,
  AlertCircle,
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  GlassButton,
  GlassSelect,
  GlassInput,
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from '@/shared/components/ui'
import { dailyActivitiesService } from '../services/daily-activities.service'
import { useTranslations } from '@/shared/lib/i18n'
import type {
  MealType,
  AmountEaten,
  DiaperCondition,
  MoodType,
} from '@/shared/types/daily-activities'
import {
  MEAL_TYPE_LABELS,
  AMOUNT_EATEN_LABELS,
  MOOD_LABELS,
  MOOD_EMOJIS,
} from '@/shared/types/daily-activities'
import type { Child } from '@/shared/types'

type ActivityType = 'meal' | 'nap' | 'diaper' | 'mood'

interface BulkActivityModalProps {
  isOpen: boolean
  onClose: () => void
  children: Child[]
  classroomId?: string
  onSuccess?: () => void
}

export function BulkActivityModal({
  isOpen,
  onClose,
  children,
  classroomId,
  onSuccess,
}: BulkActivityModalProps) {
  const t = useTranslations()
  const [activityType, setActivityType] = useState<ActivityType>('meal')
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null)

  // Activity-specific state
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [amountEaten, setAmountEaten] = useState<AmountEaten>('most')
  const [foodServed, setFoodServed] = useState('')
  const [diaperCondition, setDiaperCondition] = useState<DiaperCondition>('wet')
  const [selectedMood, setSelectedMood] = useState<MoodType>('happy')

  // Filter children by classroom if specified
  const filteredChildren = classroomId
    ? children.filter((c) => c.classroom_id === classroomId)
    : children

  useEffect(() => {
    if (selectAll) {
      setSelectedChildIds(filteredChildren.map((c) => c.id))
    } else {
      setSelectedChildIds([])
    }
  }, [selectAll, filteredChildren])

  const handleToggleChild = (childId: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    )
  }

  const handleSubmit = async () => {
    if (selectedChildIds.length === 0) return

    setIsLoading(true)
    setResults(null)

    let success = 0
    let failed = 0

    for (const childId of selectedChildIds) {
      try {
        switch (activityType) {
          case 'meal':
            await dailyActivitiesService.createMeal({
              child_id: childId,
              meal_type: mealType,
              amount_eaten: amountEaten,
              food_served: foodServed || undefined,
            })
            break
          case 'nap':
            await dailyActivitiesService.quickNapStart(childId)
            break
          case 'diaper':
            await dailyActivitiesService.quickDiaperChange(childId, diaperCondition)
            break
          case 'mood':
            await dailyActivitiesService.quickMoodCheck(childId, selectedMood)
            break
        }
        success++
      } catch (error) {
        console.error(`Failed for child ${childId}:`, error)
        failed++
      }
    }

    setResults({ success, failed })
    setIsLoading(false)

    if (success > 0) {
      onSuccess?.()
    }
  }

  const handleClose = () => {
    setResults(null)
    setSelectedChildIds([])
    setSelectAll(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <GlassCard className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <GlassCardHeader className="flex items-center justify-between">
          <GlassCardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            {t.dailyActivities.bulkRegistration}
          </GlassCardTitle>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </GlassCardHeader>

        <GlassCardContent className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Results message */}
          {results && (
            <div
              className={clsx(
                'p-4 rounded-xl flex items-center gap-3',
                results.failed === 0
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
              )}
            >
              {results.failed === 0 ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>
                {results.success} registros exitosos
                {results.failed > 0 && `, ${results.failed} fallaron`}
              </span>
            </div>
          )}

          {/* Activity Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.dailyActivities.activityType}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'meal' as const, icon: UtensilsCrossed, label: t.dailyActivities.meal },
                { type: 'nap' as const, icon: Moon, label: t.dailyActivities.nap },
                { type: 'diaper' as const, icon: Baby, label: t.dailyActivities.diaper },
                { type: 'mood' as const, icon: Smile, label: t.dailyActivities.mood },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setActivityType(type)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                    activityType === type
                      ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'shadow-neu dark:shadow-neu-dark hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity-specific options */}
          {activityType === 'meal' && (
            <div className="p-4 rounded-xl shadow-neu-inset dark:shadow-neu-dark-inset space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {t.dailyActivities.mealType}
                  </label>
                  <GlassSelect
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                    options={Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {t.dailyActivities.amount}
                  </label>
                  <GlassSelect
                    value={amountEaten}
                    onChange={(e) => setAmountEaten(e.target.value as AmountEaten)}
                    options={Object.entries(AMOUNT_EATEN_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Comida Servida (opcional)
                </label>
                <GlassInput
                  type="text"
                  value={foodServed}
                  onChange={(e) => setFoodServed(e.target.value)}
                  placeholder="Ej: Arroz con pollo, vegetales..."
                />
              </div>
            </div>
          )}

          {activityType === 'diaper' && (
            <div className="p-4 rounded-xl shadow-neu-inset dark:shadow-neu-dark-inset">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                Condición
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['wet', 'dirty', 'both', 'dry'] as DiaperCondition[]).map((condition) => (
                  <button
                    key={condition}
                    onClick={() => setDiaperCondition(condition)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      diaperCondition === condition
                        ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'shadow-neu dark:shadow-neu-dark hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {condition === 'wet' && t.dailyActivities.wet}
                    {condition === 'dirty' && t.dailyActivities.dirty}
                    {condition === 'both' && t.dailyActivities.both}
                    {condition === 'dry' && t.dailyActivities.dry}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activityType === 'mood' && (
            <div className="p-4 rounded-xl shadow-neu-inset dark:shadow-neu-dark-inset">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                Estado de Ánimo
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(MOOD_LABELS) as MoodType[]).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    title={MOOD_LABELS[mood]}
                    className={clsx(
                      'p-2 rounded-lg text-2xl transition-all',
                      selectedMood === mood
                        ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-100 dark:bg-primary-900/30'
                        : 'shadow-neu dark:shadow-neu-dark hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset'
                    )}
                  >
                    {MOOD_EMOJIS[mood]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activityType === 'nap' && (
            <div className="p-4 rounded-xl shadow-neu-inset dark:shadow-neu-dark-inset">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Se iniciará una siesta para todos los niños seleccionados con la hora actual.
              </p>
            </div>
          )}

          {/* Children Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.dailyActivities.selectChildren} ({selectedChildIds.length} / {filteredChildren.length})
              </label>
              <button
                onClick={() => setSelectAll(!selectAll)}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {selectAll ? t.dailyActivities.deselectAll : t.dailyActivities.selectAll}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {filteredChildren.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleToggleChild(child.id)}
                  className={clsx(
                    'flex items-center gap-2 p-2 rounded-lg text-left transition-all text-sm',
                    selectedChildIds.includes(child.id)
                      ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-primary-50 dark:bg-primary-900/20'
                      : 'shadow-neu dark:shadow-neu-dark hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset'
                  )}
                >
                  <div
                    className={clsx(
                      'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors',
                      selectedChildIds.includes(child.id)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    {selectedChildIds.includes(child.id) && <Check className="w-3 h-3" />}
                  </div>
                  <span className="truncate">
                    {child.first_name} {child.last_name.charAt(0)}.
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <GlassButton variant="secondary" onClick={handleClose} className="flex-1">
              {t.common.cancel}
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleSubmit}
              disabled={selectedChildIds.length === 0 || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.common.loading}
                </>
              ) : (
                `${t.dailyActivities.registerActivities} (${selectedChildIds.length})`
              )}
            </GlassButton>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  UtensilsCrossed,
  Moon,
  Baby,
  Smile,
  Loader2,
  Milk,
} from 'lucide-react'
import { clsx } from 'clsx'
import { GlassButton, GlassSelect } from '@/shared/components/ui'
import { dailyActivitiesService } from '../services/daily-activities.service'
import type {
  MealType,
  AmountEaten,
  DiaperCondition,
  MoodType,
  MilkType,
} from '@/shared/types/daily-activities'
import { MEAL_TYPE_LABELS, AMOUNT_EATEN_LABELS, MOOD_LABELS, MOOD_EMOJIS, MILK_TYPE_LABELS } from '@/shared/types/daily-activities'

interface QuickActionButtonsProps {
  childId: string
  childName: string
  onSuccess?: () => void
}

export function QuickActionButtons({ childId, childName, onSuccess }: QuickActionButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<'meal' | 'nap' | 'diaper' | 'mood' | 'bottle' | null>(null)
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [amountEaten, setAmountEaten] = useState<AmountEaten>('most')
  const [diaperCondition, setDiaperCondition] = useState<DiaperCondition>('wet')
  const [selectedMood, setSelectedMood] = useState<MoodType>('happy')
  const [bottleAmount, setBottleAmount] = useState<number>(4)
  const [milkType, setMilkType] = useState<MilkType>('formula')

  const handleQuickMeal = async () => {
    setIsLoading('meal')
    try {
      await dailyActivitiesService.quickMealRecord(childId, mealType, amountEaten)
      setActiveAction(null)
      onSuccess?.()
    } catch (error) {
      console.error('Error recording meal:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleQuickNapStart = async () => {
    setIsLoading('nap')
    try {
      await dailyActivitiesService.quickNapStart(childId)
      onSuccess?.()
    } catch (error) {
      console.error('Error starting nap:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleQuickDiaper = async () => {
    setIsLoading('diaper')
    try {
      await dailyActivitiesService.quickDiaperChange(childId, diaperCondition)
      setActiveAction(null)
      onSuccess?.()
    } catch (error) {
      console.error('Error recording diaper:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleQuickMood = async () => {
    setIsLoading('mood')
    try {
      await dailyActivitiesService.quickMoodCheck(childId, selectedMood)
      setActiveAction(null)
      onSuccess?.()
    } catch (error) {
      console.error('Error recording mood:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleQuickBottle = async () => {
    setIsLoading('bottle')
    try {
      await dailyActivitiesService.quickBottleFeeding(childId, bottleAmount, milkType)
      setActiveAction(null)
      onSuccess?.()
    } catch (error) {
      console.error('Error recording bottle:', error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Quick actions for <span className="font-medium text-gray-900 dark:text-gray-100">{childName}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={() => setActiveAction(activeAction === 'meal' ? null : 'meal')}
          className={clsx(
            'flex items-center gap-2',
            activeAction === 'meal' && 'shadow-neu-inset dark:shadow-neu-dark-inset'
          )}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Meal
        </GlassButton>

        <GlassButton
          variant="secondary"
          size="sm"
          onClick={handleQuickNapStart}
          disabled={isLoading === 'nap'}
          className="flex items-center gap-2"
        >
          {isLoading === 'nap' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          Start Nap
        </GlassButton>

        <GlassButton
          variant="secondary"
          size="sm"
          onClick={() => setActiveAction(activeAction === 'diaper' ? null : 'diaper')}
          className={clsx(
            'flex items-center gap-2',
            activeAction === 'diaper' && 'shadow-neu-inset dark:shadow-neu-dark-inset'
          )}
        >
          <Baby className="w-4 h-4" />
          Diaper
        </GlassButton>

        <GlassButton
          variant="secondary"
          size="sm"
          onClick={() => setActiveAction(activeAction === 'mood' ? null : 'mood')}
          className={clsx(
            'flex items-center gap-2',
            activeAction === 'mood' && 'shadow-neu-inset dark:shadow-neu-dark-inset'
          )}
        >
          <Smile className="w-4 h-4" />
          Mood
        </GlassButton>

        <GlassButton
          variant="secondary"
          size="sm"
          onClick={() => setActiveAction(activeAction === 'bottle' ? null : 'bottle')}
          className={clsx(
            'flex items-center gap-2',
            activeAction === 'bottle' && 'shadow-neu-inset dark:shadow-neu-dark-inset'
          )}
        >
          <Milk className="w-4 h-4" />
          Biberon
        </GlassButton>
      </div>

      {/* Meal Options */}
      {activeAction === 'meal' && (
        <div className="p-3 rounded-xl shadow-neu-inset dark:shadow-neu-dark-inset space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Meal Type
              </label>
              <GlassSelect
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                options={Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Amount Eaten
              </label>
              <GlassSelect
                value={amountEaten}
                onChange={(e) => setAmountEaten(e.target.value as AmountEaten)}
                options={Object.entries(AMOUNT_EATEN_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
          </div>
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleQuickMeal}
            disabled={isLoading === 'meal'}
            className="w-full"
          >
            {isLoading === 'meal' ? 'Recording...' : 'Record Meal'}
          </GlassButton>
        </div>
      )}

      {/* Diaper Options */}
      {activeAction === 'diaper' && (
        <div className="p-3 rounded-xl shadow-neu-inset dark:shadow-neu-dark-inset space-y-3">
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
                {condition.charAt(0).toUpperCase() + condition.slice(1)}
              </button>
            ))}
          </div>
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleQuickDiaper}
            disabled={isLoading === 'diaper'}
            className="w-full"
          >
            {isLoading === 'diaper' ? 'Recording...' : 'Record Diaper Change'}
          </GlassButton>
        </div>
      )}

      {/* Mood Options */}
      {activeAction === 'mood' && (
        <div className="p-3 rounded-xl shadow-neu-inset dark:shadow-neu-dark-inset space-y-3">
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
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleQuickMood}
            disabled={isLoading === 'mood'}
            className="w-full"
          >
            {isLoading === 'mood' ? 'Recording...' : `Record ${MOOD_LABELS[selectedMood]} Mood`}
          </GlassButton>
        </div>
      )}

      {/* Bottle Options */}
      {activeAction === 'bottle' && (
        <div className="p-3 rounded-xl shadow-neu-inset dark:shadow-neu-dark-inset space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Cantidad (oz)
              </label>
              <div className="flex gap-1 flex-wrap">
                {[2, 3, 4, 5, 6, 8].map((oz) => (
                  <button
                    key={oz}
                    onClick={() => setBottleAmount(oz)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      bottleAmount === oz
                        ? 'shadow-neu-inset dark:shadow-neu-dark-inset bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                        : 'shadow-neu dark:shadow-neu-dark hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {oz}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Tipo de Leche
              </label>
              <GlassSelect
                value={milkType}
                onChange={(e) => setMilkType(e.target.value as MilkType)}
                options={Object.entries(MILK_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
          </div>
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleQuickBottle}
            disabled={isLoading === 'bottle'}
            className="w-full"
          >
            {isLoading === 'bottle' ? 'Registrando...' : `Registrar ${bottleAmount} oz de ${MILK_TYPE_LABELS[milkType]}`}
          </GlassButton>
        </div>
      )}
    </div>
  )
}

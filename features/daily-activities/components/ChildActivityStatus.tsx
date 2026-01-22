'use client'

import {
  Check,
  AlertCircle,
  Clock,
  UtensilsCrossed,
  Moon,
  Baby,
  Smile,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslations } from '@/shared/lib/i18n'

interface ActivityCounts {
  meals: number
  naps: number
  bathroom: number
  moods: number
}

interface ChildActivityStatusProps {
  counts: ActivityCounts
  showDetails?: boolean
  size?: 'sm' | 'md'
}

// Expected minimum activities for a full day
const EXPECTED = {
  meals: 2, // At least breakfast and lunch
  naps: 1, // At least one nap for younger children
  bathroom: 2, // At least 2 diaper changes
  moods: 1, // At least one mood check
}

export function ChildActivityStatus({
  counts,
  showDetails = false,
  size = 'sm',
}: ChildActivityStatusProps) {
  const t = useTranslations()
  const totalExpected = EXPECTED.meals + EXPECTED.naps + EXPECTED.bathroom + EXPECTED.moods
  const totalRecorded = counts.meals + counts.naps + counts.bathroom + counts.moods

  // Calculate completion percentage
  const mealsComplete = Math.min(counts.meals / EXPECTED.meals, 1)
  const napsComplete = Math.min(counts.naps / EXPECTED.naps, 1)
  const bathroomComplete = Math.min(counts.bathroom / EXPECTED.bathroom, 1)
  const moodsComplete = Math.min(counts.moods / EXPECTED.moods, 1)
  const overallCompletion = (mealsComplete + napsComplete + bathroomComplete + moodsComplete) / 4

  // Determine status
  const status: 'complete' | 'partial' | 'empty' =
    overallCompletion >= 0.75 ? 'complete' : overallCompletion > 0 ? 'partial' : 'empty'

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'

  if (showDetails) {
    return (
      <div className="flex items-center gap-1">
        {/* Meals */}
        <div
          className={clsx(
            'flex items-center justify-center rounded',
            size === 'sm' ? 'w-5 h-5' : 'w-6 h-6',
            counts.meals >= EXPECTED.meals
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
              : counts.meals > 0
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          )}
          title={`${t.communication.meals}: ${counts.meals}`}
        >
          <UtensilsCrossed className={iconSize} />
        </div>

        {/* Naps */}
        <div
          className={clsx(
            'flex items-center justify-center rounded',
            size === 'sm' ? 'w-5 h-5' : 'w-6 h-6',
            counts.naps >= EXPECTED.naps
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
              : counts.naps > 0
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          )}
          title={`${t.communication.naps}: ${counts.naps}`}
        >
          <Moon className={iconSize} />
        </div>

        {/* Bathroom */}
        <div
          className={clsx(
            'flex items-center justify-center rounded',
            size === 'sm' ? 'w-5 h-5' : 'w-6 h-6',
            counts.bathroom >= EXPECTED.bathroom
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
              : counts.bathroom > 0
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          )}
          title={`${t.dailyActivities.diaper}: ${counts.bathroom}`}
        >
          <Baby className={iconSize} />
        </div>

        {/* Mood */}
        <div
          className={clsx(
            'flex items-center justify-center rounded',
            size === 'sm' ? 'w-5 h-5' : 'w-6 h-6',
            counts.moods >= EXPECTED.moods
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
              : counts.moods > 0
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          )}
          title={`${t.dailyActivities.mood}: ${counts.moods}`}
        >
          <Smile className={iconSize} />
        </div>
      </div>
    )
  }

  // Simple status indicator
  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full',
        size === 'sm' ? 'w-5 h-5' : 'w-6 h-6',
        status === 'complete' && 'bg-green-100 dark:bg-green-900/30',
        status === 'partial' && 'bg-yellow-100 dark:bg-yellow-900/30',
        status === 'empty' && 'bg-gray-100 dark:bg-gray-800'
      )}
      title={`${totalRecorded} actividades registradas`}
    >
      {status === 'complete' && (
        <Check className={clsx(iconSize, 'text-green-600')} />
      )}
      {status === 'partial' && (
        <Clock className={clsx(iconSize, 'text-yellow-600')} />
      )}
      {status === 'empty' && (
        <div className={clsx(dotSize, 'rounded-full bg-gray-300 dark:bg-gray-600')} />
      )}
    </div>
  )
}

// Badge component showing what's missing
export function MissingActivitiesBadge({ counts }: { counts: ActivityCounts }) {
  const t = useTranslations()
  const missing: string[] = []

  if (counts.meals < EXPECTED.meals) {
    missing.push(`${EXPECTED.meals - counts.meals} ${t.dailyActivities.meal.toLowerCase()}`)
  }
  if (counts.naps < EXPECTED.naps) {
    missing.push(`${EXPECTED.naps - counts.naps} ${t.dailyActivities.nap.toLowerCase()}`)
  }
  if (counts.bathroom < EXPECTED.bathroom) {
    missing.push(`${EXPECTED.bathroom - counts.bathroom} ${t.dailyActivities.diaper.toLowerCase()}`)
  }
  if (counts.moods < EXPECTED.moods) {
    missing.push(t.dailyActivities.mood.toLowerCase())
  }

  if (missing.length === 0) return null

  return (
    <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
      <AlertCircle className="w-3 h-3" />
      <span>{t.dailyActivities.missingActivities}: {missing.join(', ')}</span>
    </div>
  )
}

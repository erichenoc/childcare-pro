'use client'

import { clsx } from 'clsx'
import type { MoodType, EnergyLevel } from '@/shared/types/daily-activities'
import { MOOD_LABELS, MOOD_EMOJIS } from '@/shared/types/daily-activities'

interface MoodBadgeProps {
  mood: MoodType
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const moodColors: Record<MoodType, string> = {
  happy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  content: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  excited: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  calm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tired: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  fussy: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  sad: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  frustrated: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  anxious: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  unwell: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
}

export function MoodBadge({ mood, size = 'md', showLabel = true, className }: MoodBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        moodColors[mood],
        sizeClasses[size],
        className
      )}
    >
      <span>{MOOD_EMOJIS[mood]}</span>
      {showLabel && <span>{MOOD_LABELS[mood]}</span>}
    </span>
  )
}

interface EnergyBadgeProps {
  level: EnergyLevel
  size?: 'sm' | 'md'
  className?: string
}

const energyColors: Record<EnergyLevel, string> = {
  high: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  low: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  very_low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const energyLabels: Record<EnergyLevel, string> = {
  high: 'High Energy',
  normal: 'Normal',
  low: 'Low Energy',
  very_low: 'Very Low',
}

export function EnergyBadge({ level, size = 'md', className }: EnergyBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        energyColors[level],
        sizeClasses[size],
        className
      )}
    >
      {energyLabels[level]}
    </span>
  )
}

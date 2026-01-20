'use client'

import { clsx } from 'clsx'
import type { AmountEaten, NapQuality, EngagementLevel } from '@/shared/types/daily-activities'
import {
  AMOUNT_EATEN_LABELS,
  NAP_QUALITY_LABELS,
  ENGAGEMENT_LEVEL_LABELS,
} from '@/shared/types/daily-activities'

interface AmountBadgeProps {
  amount: AmountEaten
  size?: 'sm' | 'md'
  className?: string
}

const amountColors: Record<AmountEaten, string> = {
  all: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  most: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  some: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  little: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  none: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refused: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
}

export function AmountBadge({ amount, size = 'md', className }: AmountBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        amountColors[amount],
        sizeClasses[size],
        className
      )}
    >
      {AMOUNT_EATEN_LABELS[amount]}
    </span>
  )
}

interface NapQualityBadgeProps {
  quality: NapQuality
  size?: 'sm' | 'md'
  className?: string
}

const napQualityColors: Record<NapQuality, string> = {
  restful: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  light: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  restless: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  did_not_sleep: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function NapQualityBadge({ quality, size = 'md', className }: NapQualityBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        napQualityColors[quality],
        sizeClasses[size],
        className
      )}
    >
      {NAP_QUALITY_LABELS[quality]}
    </span>
  )
}

interface EngagementBadgeProps {
  level: EngagementLevel
  size?: 'sm' | 'md'
  className?: string
}

const engagementColors: Record<EngagementLevel, string> = {
  highly_engaged: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  engaged: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  somewhat_engaged: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  not_interested: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

export function EngagementBadge({ level, size = 'md', className }: EngagementBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        engagementColors[level],
        sizeClasses[size],
        className
      )}
    >
      {ENGAGEMENT_LEVEL_LABELS[level]}
    </span>
  )
}

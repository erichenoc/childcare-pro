'use client'

import { type ReactNode } from 'react'
import { clsx } from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// Stat card variants
type StatVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface GlassStatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    label?: string
  }
  variant?: StatVariant
  className?: string
}

const variantClasses: Record<StatVariant, string> = {
  default: 'stat-card-glass',
  primary: 'stat-card-glass bg-primary-500/10 border-primary-500/30',
  success: 'stat-card-glass bg-success/10 border-success/30',
  warning: 'stat-card-glass bg-warning/10 border-warning/30',
  error: 'stat-card-glass bg-error/10 border-error/30',
}

const iconBgClasses: Record<StatVariant, string> = {
  default: 'bg-gray-500/20 text-gray-600 dark:text-gray-300',
  primary: 'bg-primary-500/20 text-primary-600 dark:text-primary-400',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  error: 'bg-error/20 text-error',
}

export function GlassStatCard({
  label,
  value,
  icon,
  trend,
  variant = 'default',
  className,
}: GlassStatCardProps) {
  const trendIsPositive = trend && trend.value > 0
  const trendIsNegative = trend && trend.value < 0
  const trendIsNeutral = trend && trend.value === 0

  return (
    <div className={clsx(variantClasses[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>

          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trendIsPositive && (
                <TrendingUp className="w-4 h-4 text-success" />
              )}
              {trendIsNegative && (
                <TrendingDown className="w-4 h-4 text-error" />
              )}
              {trendIsNeutral && (
                <Minus className="w-4 h-4 text-gray-500" />
              )}
              <span
                className={clsx(
                  'text-sm font-medium',
                  trendIsPositive && 'text-success',
                  trendIsNegative && 'text-error',
                  trendIsNeutral && 'text-gray-500'
                )}
              >
                {trendIsPositive && '+'}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div
            className={clsx(
              'p-3 rounded-xl',
              iconBgClasses[variant]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// Compact stat card for smaller displays
interface GlassStatCardCompactProps {
  label: string
  value: string | number
  icon?: ReactNode
  variant?: StatVariant
  className?: string
}

export function GlassStatCardCompact({
  label,
  value,
  icon,
  variant = 'default',
  className,
}: GlassStatCardCompactProps) {
  return (
    <div
      className={clsx(
        'glass p-3 rounded-glass-sm flex items-center gap-3',
        className
      )}
    >
      {icon && (
        <div
          className={clsx(
            'p-2 rounded-lg',
            iconBgClasses[variant]
          )}
        >
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}

export default GlassStatCard

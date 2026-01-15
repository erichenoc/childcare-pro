'use client'

import { type ReactNode } from 'react'
import { clsx } from 'clsx'
import { AlertCircle, CheckCircle, AlertTriangle, Users } from 'lucide-react'

// Ratio status - Neumorphism style
type RatioStatus = 'compliant' | 'warning' | 'non-compliant'

interface GlassRatioIndicatorProps {
  currentRatio: string
  requiredRatio: string
  status: RatioStatus
  ageGroup: string
  childrenCount: number
  staffCount: number
  className?: string
}

const statusClasses: Record<RatioStatus, string> = {
  compliant: 'ratio-neu-indicator compliant',
  warning: 'ratio-neu-indicator warning',
  'non-compliant': 'ratio-neu-indicator non-compliant',
}

const statusIcons: Record<RatioStatus, ReactNode> = {
  compliant: <CheckCircle className="w-5 h-5 text-success" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
  'non-compliant': <AlertCircle className="w-5 h-5 text-error" />,
}

const statusTextClasses: Record<RatioStatus, string> = {
  compliant: 'text-success',
  warning: 'text-warning',
  'non-compliant': 'text-error',
}

export function GlassRatioIndicator({
  currentRatio,
  requiredRatio,
  status,
  ageGroup,
  childrenCount,
  staffCount,
  className,
}: GlassRatioIndicatorProps) {
  return (
    <div className={clsx(statusClasses[status], className)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {ageGroup}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ratio requerido: {requiredRatio}
          </p>
        </div>
        {statusIcons[status]}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              <span className="font-semibold text-gray-900 dark:text-white">
                {childrenCount}
              </span>
              <span className="text-gray-500"> niños</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary-500" />
            <span className="text-sm">
              <span className="font-semibold text-gray-900 dark:text-white">
                {staffCount}
              </span>
              <span className="text-gray-500"> personal</span>
            </span>
          </div>
        </div>

        <div className={clsx('text-lg font-bold', statusTextClasses[status])}>
          {currentRatio}
        </div>
      </div>
    </div>
  )
}

// Mini ratio indicator for compact views
interface GlassRatioIndicatorMiniProps {
  currentRatio: string
  status: RatioStatus
  className?: string
}

export function GlassRatioIndicatorMini({
  currentRatio,
  status,
  className,
}: GlassRatioIndicatorMiniProps) {
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-neu-sm shadow-neu-xs dark:shadow-neu-dark-sm',
        status === 'compliant' && 'bg-success/10 text-success',
        status === 'warning' && 'bg-warning/10 text-warning',
        status === 'non-compliant' && 'bg-error/10 text-error',
        className
      )}
    >
      {status === 'compliant' && <CheckCircle className="w-3.5 h-3.5" />}
      {status === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
      {status === 'non-compliant' && <AlertCircle className="w-3.5 h-3.5" />}
      <span className="text-sm font-semibold">{currentRatio}</span>
    </div>
  )
}

export default GlassRatioIndicator

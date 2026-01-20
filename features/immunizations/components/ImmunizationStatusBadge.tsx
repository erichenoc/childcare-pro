'use client'

import { clsx } from 'clsx'
import { CheckCircle, AlertTriangle, AlertCircle, Shield, Clock } from 'lucide-react'
import type { ComplianceStatus } from '@/shared/types/immunizations'

interface ImmunizationStatusBadgeProps {
  status: ComplianceStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const statusConfig: Record<ComplianceStatus, {
  label: string
  icon: typeof CheckCircle
  colors: string
}> = {
  compliant: {
    label: 'Compliant',
    icon: CheckCircle,
    colors: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  incomplete: {
    label: 'Incomplete',
    icon: Clock,
    colors: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  overdue: {
    label: 'Overdue',
    icon: AlertCircle,
    colors: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  exempt: {
    label: 'Exempt',
    icon: Shield,
    colors: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function ImmunizationStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: ImmunizationStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        sizeClasses[size],
        config.colors,
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  )
}

interface ProvisionalBadgeProps {
  endDate?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProvisionalBadge({
  endDate,
  size = 'md',
  className,
}: ProvisionalBadgeProps) {
  const isExpiringSoon = endDate && new Date(endDate) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        sizeClasses[size],
        isExpiringSoon
          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        className
      )}
    >
      <AlertTriangle className={iconSizes[size]} />
      Provisional
      {endDate && (
        <span className="opacity-75">
          (until {new Date(endDate).toLocaleDateString()})
        </span>
      )}
    </span>
  )
}

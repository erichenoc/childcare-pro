'use client'

import { type HTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'

// Badge variants - Neumorphism style
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
type BadgeSize = 'sm' | 'md' | 'lg'

interface GlassBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  icon?: ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'badge-neu',
  success: 'badge-neu-success',
  warning: 'badge-neu-warning',
  error: 'badge-neu-error',
  info: 'badge-neu-info',
  primary: 'badge-neu bg-primary-500/20 text-primary-700 dark:text-primary-300',
  secondary: 'badge-neu bg-secondary-500/20 text-secondary-700 dark:text-secondary-300',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs rounded-md',
  md: 'px-2.5 py-1 text-xs rounded-lg',
  lg: 'px-3 py-1.5 text-sm rounded-lg',
}

const dotSizeClasses: Record<BadgeSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
}

const dotColorClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
}

export function GlassBadge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className,
  ...props
}: GlassBadgeProps) {
  return (
    <span
      className={clsx(
        variantClasses[variant],
        sizeClasses[size],
        'inline-flex items-center gap-1.5 font-medium',
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx(
            'rounded-full flex-shrink-0',
            dotSizeClasses[size],
            dotColorClasses[variant]
          )}
        />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

// Status Badge - specifically for status indicators
type StatusType = 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning'

interface GlassStatusBadgeProps extends Omit<GlassBadgeProps, 'variant'> {
  status: StatusType
}

const statusToVariant: Record<StatusType, BadgeVariant> = {
  active: 'success',
  inactive: 'default',
  pending: 'warning',
  success: 'success',
  error: 'error',
  warning: 'warning',
}

export function GlassStatusBadge({ status, ...props }: GlassStatusBadgeProps) {
  return (
    <GlassBadge
      variant={statusToVariant[status]}
      dot
      {...props}
    />
  )
}

export default GlassBadge

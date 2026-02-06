'use client'

import { type ReactNode } from 'react'
import { clsx } from 'clsx'
import Link from 'next/link'
import { GlassButton } from './glass-button'

interface EmptyStateStep {
  label: string
  icon: ReactNode
}

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
  icon?: ReactNode
}

interface GlassSmartEmptyStateProps {
  icon: ReactNode
  title: string
  steps?: EmptyStateStep[]
  primaryAction?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  variant?: 'card' | 'inline' | 'table'
  className?: string
}

export function GlassSmartEmptyState({
  icon,
  title,
  steps,
  primaryAction,
  secondaryAction,
  variant = 'card',
  className,
}: GlassSmartEmptyStateProps) {
  const content = (
    <div className={clsx(
      'flex flex-col items-center text-center',
      variant === 'card' && 'neu rounded-neu p-8 sm:p-12',
      variant === 'inline' && 'py-8',
      className
    )}>
      {/* Icon */}
      <div className="w-16 h-16 rounded-neu-sm neu-inset flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
        <span className="[&>svg]:w-8 [&>svg]:h-8">{icon}</span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
        {title}
      </h3>

      {/* Visual Steps */}
      {steps && steps.length > 0 && (
        <div className="flex items-center gap-2 sm:gap-3 mb-6 flex-wrap justify-center">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-primary-500/10 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">{index + 1}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  <span className="[&>svg]:w-3.5 [&>svg]:h-3.5 text-gray-400">{step.icon}</span>
                  <span>{step.label}</span>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="w-4 h-0.5 bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {primaryAction && (
          primaryAction.href ? (
            <Link href={primaryAction.href}>
              <GlassButton variant="primary" leftIcon={primaryAction.icon}>
                {primaryAction.label}
              </GlassButton>
            </Link>
          ) : (
            <GlassButton
              variant="primary"
              leftIcon={primaryAction.icon}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </GlassButton>
          )
        )}
        {secondaryAction && (
          secondaryAction.href ? (
            <Link href={secondaryAction.href}>
              <GlassButton variant="ghost">
                {secondaryAction.label}
              </GlassButton>
            </Link>
          ) : (
            <GlassButton variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </GlassButton>
          )
        )}
      </div>
    </div>
  )

  if (variant === 'table') {
    return (
      <tr>
        <td colSpan={100} className="p-0">
          {content}
        </td>
      </tr>
    )
  }

  return content
}

export default GlassSmartEmptyState

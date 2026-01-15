'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'

// Card variants
type CardVariant = 'default' | 'clear' | 'frosted' | 'mist' | 'primary' | 'success' | 'warning' | 'error'
type CardSize = 'sm' | 'md' | 'lg'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: CardVariant
  size?: CardSize
  interactive?: boolean
  hoverable?: boolean
  noPadding?: boolean
  className?: string
}

const variantClasses: Record<CardVariant, string> = {
  default: 'glass',
  clear: 'glass-clear',
  frosted: 'glass-frosted',
  mist: 'glass-mist',
  primary: 'glass bg-primary-500/10 border-primary-500/30',
  success: 'glass bg-success/10 border-success/30',
  warning: 'glass bg-warning/10 border-warning/30',
  error: 'glass bg-error/10 border-error/30',
}

const sizeClasses: Record<CardSize, string> = {
  sm: 'p-3 rounded-glass-sm',
  md: 'p-5 rounded-glass',
  lg: 'p-7 rounded-glass-lg',
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      interactive = false,
      hoverable = false,
      noPadding = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          variantClasses[variant],
          !noPadding && sizeClasses[size],
          noPadding && (size === 'sm' ? 'rounded-glass-sm' : size === 'lg' ? 'rounded-glass-lg' : 'rounded-glass'),
          interactive && 'card-glass-interactive cursor-pointer',
          hoverable && 'glass-hover',
          'transition-all duration-300',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

// Card Header
interface GlassCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function GlassCardHeader({ children, className, ...props }: GlassCardHeaderProps) {
  return (
    <div
      className={clsx('mb-4 pb-4 border-b border-white/10', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Card Title
interface GlassCardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function GlassCardTitle({
  children,
  className,
  as: Tag = 'h3',
  ...props
}: GlassCardTitleProps) {
  return (
    <Tag
      className={clsx('text-lg font-semibold text-gray-900 dark:text-white', className)}
      {...props}
    >
      {children}
    </Tag>
  )
}

// Card Description
interface GlassCardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
  className?: string
}

export function GlassCardDescription({ children, className, ...props }: GlassCardDescriptionProps) {
  return (
    <p
      className={clsx('text-sm text-gray-600 dark:text-gray-300 mt-1', className)}
      {...props}
    >
      {children}
    </p>
  )
}

// Card Content
interface GlassCardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function GlassCardContent({ children, className, ...props }: GlassCardContentProps) {
  return (
    <div className={clsx(className)} {...props}>
      {children}
    </div>
  )
}

// Card Footer
interface GlassCardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function GlassCardFooter({ children, className, ...props }: GlassCardFooterProps) {
  return (
    <div
      className={clsx('mt-4 pt-4 border-t border-white/10 flex items-center gap-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export default GlassCard

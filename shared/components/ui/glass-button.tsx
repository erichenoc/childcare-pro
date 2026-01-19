'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'

// Button variants - Neumorphism style
type ButtonVariant = 'default' | 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost' | 'outline'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  className?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'btn-neu',
  primary: 'btn-neu-primary',
  secondary: 'btn-neu-secondary',
  danger: 'btn-neu-danger',
  warning: 'btn-neu bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700',
  ghost: 'btn-neu-ghost',
  outline: 'btn-neu bg-transparent border-2 border-neu-dark/30 dark:border-neu-light-dark/30',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs rounded-neu-sm min-h-[28px]',
  sm: 'px-3 py-1.5 text-sm rounded-neu-sm min-h-[32px]',
  md: 'px-4 py-2 text-sm rounded-neu-sm min-h-[40px]',
  lg: 'px-6 py-3 text-base rounded-neu min-h-[48px]',
  xl: 'px-8 py-4 text-lg rounded-neu min-h-[56px]',
  icon: 'p-2 rounded-neu-sm aspect-square min-h-[40px] min-w-[40px]',
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          isDisabled && 'opacity-50 cursor-not-allowed',
          'inline-flex items-center justify-center gap-2 font-medium',
          'transition-shadow duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-neu-bg dark:focus:ring-offset-neu-bg-dark',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {size !== 'icon' && <span>{children}</span>}
            {size === 'icon' && children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

GlassButton.displayName = 'GlassButton'

// Loading Spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <svg
      className={clsx('animate-spin', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// Icon Button variant
interface GlassIconButtonProps extends Omit<GlassButtonProps, 'children' | 'size'> {
  icon: ReactNode
  size?: 'sm' | 'md' | 'lg'
  'aria-label': string
}

export const GlassIconButton = forwardRef<HTMLButtonElement, GlassIconButtonProps>(
  ({ icon, size = 'md', className, ...props }, ref) => {
    const sizeMap: Record<string, ButtonSize> = {
      sm: 'xs',
      md: 'icon',
      lg: 'lg',
    }

    return (
      <GlassButton
        ref={ref}
        size={sizeMap[size]}
        className={clsx('btn-neu-icon', className)}
        {...props}
      >
        {icon}
      </GlassButton>
    )
  }
)

GlassIconButton.displayName = 'GlassIconButton'

export default GlassButton

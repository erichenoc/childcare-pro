'use client'

import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react'
import { clsx } from 'clsx'

// Input variants
type InputVariant = 'default' | 'filled' | 'outline'
type InputSize = 'sm' | 'md' | 'lg'

interface GlassInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  variant?: InputVariant
  inputSize?: InputSize
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  containerClassName?: string
}

const variantClasses: Record<InputVariant, string> = {
  default: 'input-glass',
  filled: 'input-glass bg-white/20 dark:bg-black/20',
  outline: 'input-glass bg-transparent border-2',
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg min-h-[36px]',
  md: 'px-4 py-2.5 text-sm rounded-xl min-h-[44px]',
  lg: 'px-5 py-3 text-base rounded-xl min-h-[52px]',
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      label,
      error,
      hint,
      variant = 'default',
      inputSize = 'md',
      leftIcon,
      rightIcon,
      fullWidth = true,
      containerClassName,
      className,
      id: providedId,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = providedId || generatedId
    const hasError = Boolean(error)

    return (
      <div className={clsx(fullWidth && 'w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="input-glass-label block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            className={clsx(
              variantClasses[variant],
              sizeClasses[inputSize],
              fullWidth && 'w-full',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              hasError && 'border-error/50 focus:border-error focus:ring-error/30',
              disabled && 'opacity-50 cursor-not-allowed bg-gray-100/50 dark:bg-gray-800/50',
              'transition-all duration-200',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${id}-error`} className="input-glass-error mt-1.5 text-sm text-error">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${id}-hint`} className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

GlassInput.displayName = 'GlassInput'

// Textarea variant
interface GlassTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  variant?: InputVariant
  inputSize?: InputSize
  fullWidth?: boolean
  containerClassName?: string
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  (
    {
      label,
      error,
      hint,
      variant = 'default',
      inputSize = 'md',
      fullWidth = true,
      containerClassName,
      className,
      id: providedId,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = providedId || generatedId
    const hasError = Boolean(error)

    const paddingClasses: Record<InputSize, string> = {
      sm: 'px-3 py-2 text-sm rounded-lg',
      md: 'px-4 py-3 text-sm rounded-xl',
      lg: 'px-5 py-4 text-base rounded-xl',
    }

    return (
      <div className={clsx(fullWidth && 'w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="input-glass-label block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          rows={rows}
          disabled={disabled}
          className={clsx(
            variantClasses[variant],
            paddingClasses[inputSize],
            fullWidth && 'w-full',
            hasError && 'border-error/50 focus:border-error focus:ring-error/30',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-100/50 dark:bg-gray-800/50',
            'transition-all duration-200 resize-none',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />

        {error && (
          <p id={`${id}-error`} className="input-glass-error mt-1.5 text-sm text-error">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${id}-hint`} className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

GlassTextarea.displayName = 'GlassTextarea'

export default GlassInput

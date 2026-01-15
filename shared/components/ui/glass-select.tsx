'use client'

import { forwardRef, type SelectHTMLAttributes, useId } from 'react'
import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'

// Select size - Neumorphism style
type SelectSize = 'sm' | 'md' | 'lg'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface GlassSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  options: SelectOption[]
  selectSize?: SelectSize
  fullWidth?: boolean
  containerClassName?: string
}

const sizeClasses: Record<SelectSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-neu-sm min-h-[36px] pr-8',
  md: 'px-4 py-2.5 text-sm rounded-neu-sm min-h-[44px] pr-10',
  lg: 'px-5 py-3 text-base rounded-neu min-h-[52px] pr-12',
}

const iconSizeClasses: Record<SelectSize, string> = {
  sm: 'right-2 w-4 h-4',
  md: 'right-3 w-4 h-4',
  lg: 'right-4 w-5 h-5',
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  (
    {
      label,
      error,
      hint,
      placeholder,
      options,
      selectSize = 'md',
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
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            className={clsx(
              'select-neu appearance-none cursor-pointer',
              sizeClasses[selectSize],
              fullWidth && 'w-full',
              hasError && 'input-neu-error',
              disabled && 'opacity-50 cursor-not-allowed',
              'transition-shadow duration-200',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className={clsx(
              'absolute top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none',
              iconSizeClasses[selectSize]
            )}
          />
        </div>

        {error && (
          <p id={`${id}-error`} className="mt-1.5 text-sm text-error">
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

GlassSelect.displayName = 'GlassSelect'

export default GlassSelect

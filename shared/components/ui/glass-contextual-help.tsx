'use client'

import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { HelpCircle, X } from 'lucide-react'

interface GlassContextualHelpProps {
  title: string
  content: string
  learnMoreHref?: string
  learnMoreLabel?: string
  variant?: 'tooltip' | 'popover'
  position?: 'top' | 'bottom' | 'left' | 'right'
  iconSize?: 'sm' | 'md'
  className?: string
}

const iconSizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

export function GlassContextualHelp({
  title,
  content,
  learnMoreHref,
  learnMoreLabel,
  variant = 'tooltip',
  position = 'top',
  iconSize = 'sm',
  className,
}: GlassContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close popover on outside click
  useEffect(() => {
    if (variant !== 'popover' || !isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, variant])

  return (
    <div
      ref={ref}
      className={clsx('relative inline-flex', className)}
      onMouseEnter={variant === 'tooltip' ? () => setIsOpen(true) : undefined}
      onMouseLeave={variant === 'tooltip' ? () => setIsOpen(false) : undefined}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={variant === 'popover' ? () => setIsOpen(!isOpen) : undefined}
        className={clsx(
          'p-1 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
          'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/30'
        )}
        aria-label={`${title} info`}
      >
        <HelpCircle className={iconSizeClasses[iconSize]} />
      </button>

      {/* Popup */}
      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 w-60 sm:w-72',
            'neu rounded-neu-sm p-3 shadow-lg',
            'bg-white dark:bg-gray-800',
            'animate-fade-in',
            positionClasses[position]
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-gray-900 dark:text-white">
              {title}
            </p>
            {variant === 'popover' && (
              <button
                onClick={() => setIsOpen(false)}
                className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
            {content}
          </p>
          {learnMoreHref && (
            <a
              href={learnMoreHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block font-medium"
            >
              {learnMoreLabel || 'Learn more'} →
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default GlassContextualHelp

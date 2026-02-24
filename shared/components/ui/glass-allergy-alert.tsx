'use client'

import { AlertTriangle, ShieldAlert, X } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

interface AllergyAlertProps {
  childName: string
  allergies: string | string[] | null
  variant?: 'banner' | 'badge' | 'compact'
  dismissible?: boolean
  className?: string
}

export function GlassAllergyAlert({
  childName,
  allergies,
  variant = 'banner',
  dismissible = false,
  className,
}: AllergyAlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Normalize allergies to array
  const allergyList: string[] = !allergies
    ? []
    : typeof allergies === 'string'
      ? allergies.split(',').map((a) => a.trim()).filter(Boolean)
      : allergies.filter(Boolean)

  if (allergyList.length === 0) return null

  if (variant === 'badge') {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          className,
        )}
      >
        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
        Allergies
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        role="alert"
        aria-label={`Allergy alert for ${childName}: ${allergyList.join(', ')}`}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'bg-red-50 border border-red-200 text-red-700',
          'dark:bg-red-900/20 dark:border-red-700 dark:text-red-400',
          className,
        )}
      >
        <ShieldAlert className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span className="text-xs font-medium truncate">
          {allergyList.join(', ')}
        </span>
      </div>
    )
  }

  // Default: banner
  return (
    <div
      role="alert"
      aria-label={`Allergy alert for ${childName}`}
      className={clsx(
        'relative p-4 rounded-xl border-2 border-red-300 bg-red-50',
        'dark:bg-red-900/20 dark:border-red-700',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-red-800 dark:text-red-300 uppercase tracking-wide">
            Allergy Alert — {childName}
          </h4>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {allergyList.map((allergy, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200"
              >
                {allergy}
              </span>
            ))}
          </div>
        </div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="text-red-400 hover:text-red-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            aria-label="Dismiss allergy alert"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

export default GlassAllergyAlert

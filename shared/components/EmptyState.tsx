'use client'

import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-neu-bg dark:bg-neu-bg-dark shadow-neu-inset dark:shadow-neu-dark-inset flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" strokeWidth={2} />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="btn-neu px-6 py-3 text-gray-700 dark:text-gray-300 font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

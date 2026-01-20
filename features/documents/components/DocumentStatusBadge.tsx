'use client'

import { clsx } from 'clsx'
import type { DocumentStatus, ComplianceStatus } from '@/shared/types/documents'

interface DocumentStatusBadgeProps {
  status: DocumentStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  expired: {
    label: 'Expired',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
}

export function DocumentStatusBadge({ status, size = 'md' }: DocumentStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  )
}

interface ComplianceStatusBadgeProps {
  status: ComplianceStatus
  size?: 'sm' | 'md'
}

const complianceConfig: Record<ComplianceStatus, { label: string; className: string }> = {
  compliant: {
    label: 'Compliant',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  incomplete: {
    label: 'Incomplete',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  pending_review: {
    label: 'Pending Review',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
}

export function ComplianceStatusBadge({ status, size = 'md' }: ComplianceStatusBadgeProps) {
  const config = complianceConfig[status]

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  )
}

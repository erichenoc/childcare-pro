'use client'

import { FileText, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/shared/components/ui'
import type { OrganizationDocumentSummary } from '@/shared/types/documents'

interface DocumentSummaryCardProps {
  summary: OrganizationDocumentSummary | null
  isLoading?: boolean
}

export function DocumentSummaryCard({ summary, isLoading }: DocumentSummaryCardProps) {
  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            Document Compliance Overview
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    )
  }

  if (!summary) {
    return (
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            Document Compliance Overview
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No compliance data available
          </p>
        </GlassCardContent>
      </GlassCard>
    )
  }

  const stats = [
    {
      label: 'Fully Compliant',
      value: summary.fully_compliant,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Pending Review',
      value: summary.pending_review,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Incomplete',
      value: summary.incomplete,
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      label: 'Overdue',
      value: summary.overdue,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
  ]

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-500" />
          Document Compliance Overview
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>
        {/* Compliance Rate */}
        <div className="mb-6 p-4 rounded-xl shadow-neu-inset dark:shadow-neu-dark-inset">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Overall Compliance Rate
            </span>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {summary.compliance_rate}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${summary.compliance_rate}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {summary.fully_compliant} of {summary.total_entities} entities fully compliant
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="p-4 rounded-xl shadow-neu dark:shadow-neu-dark text-center"
              >
                <div className={`inline-flex p-2 rounded-lg ${stat.bgColor} mb-2`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </GlassCardContent>
    </GlassCard>
  )
}

'use client'

import { Syringe, CheckCircle, AlertCircle, AlertTriangle, Shield, Clock } from 'lucide-react'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from '@/shared/components/ui'
import type { OrganizationImmunizationSummary } from '@/shared/types/immunizations'

interface ImmunizationSummaryCardProps {
  summary: OrganizationImmunizationSummary
  isLoading?: boolean
}

export function ImmunizationSummaryCard({ summary, isLoading }: ImmunizationSummaryCardProps) {
  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Immunization Overview</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    )
  }

  const stats = [
    {
      label: 'Fully Compliant',
      value: summary.fully_compliant,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Incomplete',
      value: summary.incomplete,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      label: 'Overdue',
      value: summary.overdue,
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Exempt',
      value: summary.exempt,
      icon: Shield,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Provisional',
      value: summary.provisional,
      icon: AlertTriangle,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ]

  return (
    <GlassCard>
      <GlassCardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <Syringe className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <GlassCardTitle>Immunization Overview</GlassCardTitle>
        </div>
      </GlassCardHeader>
      <GlassCardContent>
        {/* Main Compliance Rate */}
        <div className="mb-6 p-4 neu rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Overall Compliance Rate
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.compliance_rate}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
              style={{ width: `${summary.compliance_rate}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {summary.fully_compliant + summary.exempt} of {summary.total_children} children are compliant or exempt
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="p-3 rounded-xl neu-sm hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset transition-all duration-200"
              >
                <div className={`p-2 rounded-lg ${stat.bg} w-fit mb-2`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>
      </GlassCardContent>
    </GlassCard>
  )
}

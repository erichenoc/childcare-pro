'use client'

import { clsx } from 'clsx'
import {
  Activity,
  Brain,
  MessageCircle,
  Heart,
  Palette,
  Calculator,
  Target,
} from 'lucide-react'
import type { MilestoneSummary, MilestoneStatus } from '@/shared/types/learning-milestones'

interface MilestoneProgressCardProps {
  summary: MilestoneSummary
  onClick?: () => void
  className?: string
}

const categoryIcons: Record<string, React.ElementType> = {
  'Physical Development': Activity,
  'Cognitive Development': Brain,
  'Language & Literacy': MessageCircle,
  'Social-Emotional': Heart,
  'Creative Arts': Palette,
  'Mathematical Thinking': Calculator,
}

const categoryColors: Record<string, string> = {
  'Physical Development': 'text-orange-500',
  'Cognitive Development': 'text-blue-500',
  'Language & Literacy': 'text-green-500',
  'Social-Emotional': 'text-pink-500',
  'Creative Arts': 'text-purple-500',
  'Mathematical Thinking': 'text-cyan-500',
}

export function MilestoneProgressCard({ summary, onClick, className }: MilestoneProgressCardProps) {
  const Icon = categoryIcons[summary.category_name] || Target
  const colorClass = categoryColors[summary.category_name] || 'text-gray-500'

  const achievedPercent = summary.total_milestones > 0
    ? Math.round(((summary.achieved + summary.exceeding) / summary.total_milestones) * 100)
    : 0

  const inProgressPercent = summary.total_milestones > 0
    ? Math.round(((summary.emerging + summary.developing) / summary.total_milestones) * 100)
    : 0

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-4',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-neu-inset dark:hover:shadow-neu-dark-inset',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={clsx('p-2 rounded-lg bg-white dark:bg-gray-800', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            {summary.category_name}
          </h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {summary.total_milestones} total
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div className="h-full flex">
          {summary.exceeding > 0 && (
            <div
              className="bg-purple-500 transition-all duration-300"
              style={{ width: `${(summary.exceeding / summary.total_milestones) * 100}%` }}
            />
          )}
          {summary.achieved > 0 && (
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${(summary.achieved / summary.total_milestones) * 100}%` }}
            />
          )}
          {summary.developing > 0 && (
            <div
              className="bg-blue-500 transition-all duration-300"
              style={{ width: `${(summary.developing / summary.total_milestones) * 100}%` }}
            />
          )}
          {summary.emerging > 0 && (
            <div
              className="bg-yellow-500 transition-all duration-300"
              style={{ width: `${(summary.emerging / summary.total_milestones) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-1 text-center text-xs">
        <StatusCount label="Not Started" count={summary.not_started} color="gray" />
        <StatusCount label="Emerging" count={summary.emerging} color="yellow" />
        <StatusCount label="Developing" count={summary.developing} color="blue" />
        <StatusCount label="Achieved" count={summary.achieved} color="green" />
        <StatusCount label="Exceeding" count={summary.exceeding} color="purple" />
      </div>

      {/* Summary text */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">Mastered</span>
          <span className="font-medium text-green-600 dark:text-green-400">{achievedPercent}%</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-500 dark:text-gray-400">In Progress</span>
          <span className="font-medium text-blue-600 dark:text-blue-400">{inProgressPercent}%</span>
        </div>
      </div>
    </div>
  )
}

interface StatusCountProps {
  label: string
  count: number
  color: 'gray' | 'yellow' | 'blue' | 'green' | 'purple'
}

function StatusCount({ label, count, color }: StatusCountProps) {
  const colorClasses = {
    gray: 'text-gray-500',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
  }

  return (
    <div>
      <div className={clsx('font-semibold', colorClasses[color])}>{count}</div>
      <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate" title={label}>
        {label.split(' ')[0]}
      </div>
    </div>
  )
}

// ==================== Summary Stats Grid ====================

interface MilestoneSummaryGridProps {
  summaries: MilestoneSummary[]
  onCategoryClick?: (categoryName: string) => void
  className?: string
}

export function MilestoneSummaryGrid({ summaries, onCategoryClick, className }: MilestoneSummaryGridProps) {
  if (summaries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No milestone data available</p>
      </div>
    )
  }

  return (
    <div className={clsx('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {summaries.map((summary) => (
        <MilestoneProgressCard
          key={summary.category_name}
          summary={summary}
          onClick={onCategoryClick ? () => onCategoryClick(summary.category_name) : undefined}
        />
      ))}
    </div>
  )
}

// ==================== Overall Progress Summary ====================

interface OverallMilestoneProgressProps {
  summaries: MilestoneSummary[]
  className?: string
}

export function OverallMilestoneProgress({ summaries, className }: OverallMilestoneProgressProps) {
  const totals = summaries.reduce(
    (acc, s) => ({
      total: acc.total + s.total_milestones,
      not_started: acc.not_started + s.not_started,
      emerging: acc.emerging + s.emerging,
      developing: acc.developing + s.developing,
      achieved: acc.achieved + s.achieved,
      exceeding: acc.exceeding + s.exceeding,
    }),
    { total: 0, not_started: 0, emerging: 0, developing: 0, achieved: 0, exceeding: 0 }
  )

  const achievedPercent = totals.total > 0
    ? Math.round(((totals.achieved + totals.exceeding) / totals.total) * 100)
    : 0

  return (
    <div
      className={clsx(
        'bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-6',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Overall Development Progress
      </h3>

      <div className="flex items-center gap-6 mb-4">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${achievedPercent * 2.51} 251`}
              className="text-green-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {achievedPercent}%
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <ProgressRow label="Achieved/Exceeding" count={totals.achieved + totals.exceeding} total={totals.total} color="green" />
          <ProgressRow label="Developing" count={totals.developing} total={totals.total} color="blue" />
          <ProgressRow label="Emerging" count={totals.emerging} total={totals.total} color="yellow" />
          <ProgressRow label="Not Started" count={totals.not_started} total={totals.total} color="gray" />
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {totals.achieved + totals.exceeding} of {totals.total} milestones mastered across {summaries.length} developmental areas.
      </p>
    </div>
  )
}

interface ProgressRowProps {
  label: string
  count: number
  total: number
  color: 'gray' | 'yellow' | 'blue' | 'green'
}

function ProgressRow({ label, count, total, color }: ProgressRowProps) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0
  const barColors = {
    gray: 'bg-gray-400',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-36 text-gray-600 dark:text-gray-400 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={clsx('h-full transition-all duration-300', barColors[color])}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-12 text-right text-gray-600 dark:text-gray-400">{count}</span>
    </div>
  )
}

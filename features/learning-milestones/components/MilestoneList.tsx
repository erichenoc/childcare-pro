'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Eye,
  Plus,
  Star,
} from 'lucide-react'
import type { ChildMilestone, MilestoneStatus, MilestoneTemplate } from '@/shared/types/learning-milestones'
import { MilestoneStatusBadge } from './MilestoneStatusBadge'
import { useTranslations, useLocale } from '@/shared/lib/i18n'

// Helper to get localized milestone name
function getLocalizedMilestoneName(
  template: MilestoneTemplate | undefined,
  customName: string | null,
  locale: string
): string {
  // Custom name takes priority
  if (customName) return customName

  // If no template, return fallback
  if (!template) return 'Unnamed Milestone'

  // Use Spanish name if locale is 'es' and name_es exists
  if (locale === 'es' && template.name_es) {
    return template.name_es
  }

  // Default to English name
  return template.name
}

// Helper function to get translated category name
function useCategoryTranslation() {
  const t = useTranslations()

  const categoryTranslations: Record<string, string> = {
    'Physical Development': t.learning.physicalDevelopment,
    'Cognitive Development': t.learning.cognitiveDevelopment,
    'Language & Literacy': t.learning.languageLiteracy,
    'Social-Emotional': t.learning.socialEmotional,
    'Creative Arts': t.learning.creativeArts,
    'Mathematical Thinking': t.learning.mathematicalThinking,
    'Uncategorized': t.learning.uncategorized,
  }

  return (categoryName: string) => categoryTranslations[categoryName] || categoryName
}

interface MilestoneListProps {
  milestones: ChildMilestone[]
  onMilestoneClick?: (milestone: ChildMilestone) => void
  onUpdateStatus?: (milestoneId: string, status: MilestoneStatus) => void
  onAddObservation?: (milestoneId: string) => void
  className?: string
}

export function MilestoneList({
  milestones,
  onMilestoneClick,
  onUpdateStatus,
  onAddObservation,
  className,
}: MilestoneListProps) {
  const t = useTranslations()
  const getCategoryName = useCategoryTranslation()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Group milestones by category
  const grouped = milestones.reduce((acc, milestone) => {
    const categoryName = milestone.category?.name || milestone.template?.category?.name || 'Uncategorized'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(milestone)
    return acc
  }, {} as Record<string, ChildMilestone[]>)

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  if (milestones.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>{t.learning.noMilestonesTracked}</p>
      </div>
    )
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {Object.entries(grouped).map(([categoryName, categoryMilestones]) => {
        const isExpanded = expandedCategories.has(categoryName)
        const achievedCount = categoryMilestones.filter(
          (m) => m.status === 'achieved' || m.status === 'exceeding'
        ).length

        return (
          <div
            key={categoryName}
            className="bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl overflow-hidden"
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(categoryName)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {getCategoryName(categoryName)}
                </h3>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {achievedCount}/{categoryMilestones.length} {t.learning.completed}
              </span>
            </button>

            {/* Milestones */}
            {isExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {categoryMilestones.map((milestone) => (
                  <MilestoneItem
                    key={milestone.id}
                    milestone={milestone}
                    onClick={() => onMilestoneClick?.(milestone)}
                    onUpdateStatus={onUpdateStatus}
                    onAddObservation={onAddObservation}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface MilestoneItemProps {
  milestone: ChildMilestone
  onClick?: () => void
  onUpdateStatus?: (milestoneId: string, status: MilestoneStatus) => void
  onAddObservation?: (milestoneId: string) => void
}

function MilestoneItem({ milestone, onClick, onUpdateStatus, onAddObservation }: MilestoneItemProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const milestoneName = getLocalizedMilestoneName(
    milestone.template,
    milestone.custom_milestone_name,
    locale
  )

  const statusOptions: MilestoneStatus[] = ['not_started', 'emerging', 'developing', 'achieved', 'exceeding']

  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-colors">
      {/* Status indicator */}
      <StatusIndicator status={milestone.status} />

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {milestoneName}
        </p>
        {milestone.template?.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {milestone.template.description}
          </p>
        )}
        {milestone.observed_date && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{t.learning.observed} {new Date(milestone.observed_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Badge */}
      <MilestoneStatusBadge status={milestone.status} size="sm" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Quick status update */}
        {onUpdateStatus && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowStatusMenu(!showStatusMenu)
              }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t.learning.updateStatus}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-32">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdateStatus(milestone.id, status)
                      setShowStatusMenu(false)
                    }}
                    className={clsx(
                      'w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                      milestone.status === status && 'bg-gray-50 dark:bg-gray-750'
                    )}
                  >
                    <MilestoneStatusBadge status={status} size="sm" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add observation */}
        {onAddObservation && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddObservation(milestone.id)
            }}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={t.learning.addObservation}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* View details */}
        <button
          onClick={onClick}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={t.learning.viewDetails}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface StatusIndicatorProps {
  status: MilestoneStatus
}

function StatusIndicator({ status }: StatusIndicatorProps) {
  const colors: Record<MilestoneStatus, string> = {
    not_started: 'bg-gray-300 dark:bg-gray-600',
    emerging: 'bg-yellow-400',
    developing: 'bg-blue-400',
    achieved: 'bg-green-400',
    exceeding: 'bg-purple-400',
  }

  return (
    <div className={clsx('w-3 h-3 rounded-full flex-shrink-0', colors[status])} />
  )
}

// ==================== Recent Achievements ====================

interface RecentAchievementsProps {
  milestones: ChildMilestone[]
  className?: string
}

export function RecentAchievements({ milestones, className }: RecentAchievementsProps) {
  const t = useTranslations()
  const locale = useLocale()
  const recentAchieved = milestones
    .filter((m) => m.status === 'achieved' || m.status === 'exceeding')
    .sort((a, b) => new Date(b.observed_date || b.updated_at).getTime() - new Date(a.observed_date || a.updated_at).getTime())
    .slice(0, 5)

  if (recentAchieved.length === 0) {
    return null
  }

  return (
    <div className={clsx('bg-neu-bg dark:bg-neu-bg-dark shadow-neu dark:shadow-neu-dark rounded-2xl p-4', className)}>
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500" />
        {t.learning.recentAchievements}
      </h3>
      <div className="space-y-2">
        {recentAchieved.map((milestone) => (
          <div key={milestone.id} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 truncate">
              {getLocalizedMilestoneName(
                milestone.template,
                milestone.custom_milestone_name,
                locale
              )}
            </span>
            {milestone.observed_date && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                {new Date(milestone.observed_date).toLocaleDateString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

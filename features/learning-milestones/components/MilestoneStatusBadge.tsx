'use client'

import { clsx } from 'clsx'
import type {
  MilestoneStatus,
  SkillLevel,
  LearningPlanStatus,
  GoalStatus,
  OverallProgress,
} from '@/shared/types/learning-milestones'
import {
  MILESTONE_STATUS_LABELS,
  SKILL_LEVEL_LABELS,
  LEARNING_PLAN_STATUS_LABELS,
  GOAL_STATUS_LABELS,
  OVERALL_PROGRESS_LABELS,
} from '@/shared/types/learning-milestones'

// ==================== Milestone Status Badge ====================

const milestoneStatusColors: Record<MilestoneStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  emerging: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  developing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  achieved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  exceeding: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

interface MilestoneStatusBadgeProps {
  status: MilestoneStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MilestoneStatusBadge({ status, size = 'md', className }: MilestoneStatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        milestoneStatusColors[status],
        sizeClasses[size],
        className
      )}
    >
      {MILESTONE_STATUS_LABELS[status]}
    </span>
  )
}

// ==================== Skill Level Badge ====================

const skillLevelColors: Record<SkillLevel, string> = {
  not_observed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  emerging: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  developing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  proficient: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

interface SkillLevelBadgeProps {
  level: SkillLevel
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SkillLevelBadge({ level, size = 'md', className }: SkillLevelBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        skillLevelColors[level],
        sizeClasses[size],
        className
      )}
    >
      {SKILL_LEVEL_LABELS[level]}
    </span>
  )
}

// ==================== Learning Plan Status Badge ====================

const planStatusColors: Record<LearningPlanStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  archived: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

interface PlanStatusBadgeProps {
  status: LearningPlanStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PlanStatusBadge({ status, size = 'md', className }: PlanStatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        planStatusColors[status],
        sizeClasses[size],
        className
      )}
    >
      {LEARNING_PLAN_STATUS_LABELS[status]}
    </span>
  )
}

// ==================== Goal Status Badge ====================

const goalStatusColors: Record<GoalStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  achieved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  modified: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
}

interface GoalStatusBadgeProps {
  status: GoalStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function GoalStatusBadge({ status, size = 'md', className }: GoalStatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        goalStatusColors[status],
        sizeClasses[size],
        className
      )}
    >
      {GOAL_STATUS_LABELS[status]}
    </span>
  )
}

// ==================== Overall Progress Badge ====================

const progressColors: Record<OverallProgress, string> = {
  below_expectations: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  meeting_expectations: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  exceeding_expectations: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

interface OverallProgressBadgeProps {
  progress: OverallProgress
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function OverallProgressBadge({ progress, size = 'md', className }: OverallProgressBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        progressColors[progress],
        sizeClasses[size],
        className
      )}
    >
      {OVERALL_PROGRESS_LABELS[progress]}
    </span>
  )
}

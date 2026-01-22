// =====================================================
// Learning & Milestones Types - Child Development Tracking
// =====================================================

// ==================== Enums ====================

export type MilestoneStatus = 'not_started' | 'emerging' | 'developing' | 'achieved' | 'exceeding'
export type SkillLevel = 'not_observed' | 'emerging' | 'developing' | 'proficient'
export type LearningPlanStatus = 'draft' | 'active' | 'completed' | 'archived'
export type GoalStatus = 'not_started' | 'in_progress' | 'achieved' | 'modified'
export type AssessmentType = 'quarterly' | 'semester' | 'annual' | 'custom'
export type OverallProgress = 'below_expectations' | 'meeting_expectations' | 'exceeding_expectations'
export type AssessmentStatus = 'draft' | 'completed' | 'shared_with_family'
export type MediaType = 'photo' | 'video' | 'document' | 'artwork' | 'audio'

// ==================== Milestone Categories ====================

export interface MilestoneCategory {
  id: string
  name: string
  description: string | null
  age_range_start_months: number
  age_range_end_months: number
  display_order: number
  icon: string | null
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ==================== Milestone Templates ====================

export interface MilestoneTemplate {
  id: string
  category_id: string
  name: string
  name_es: string | null // Spanish translation
  description: string | null
  age_range_start_months: number
  age_range_end_months: number
  is_dcf_required: boolean
  display_order: number
  assessment_criteria: string[] | null
  created_at: string
  updated_at: string
  // Joined relations
  category?: MilestoneCategory
}

// ==================== Child Milestones ====================

export interface ChildMilestone {
  id: string
  organization_id: string
  child_id: string
  template_id: string | null
  category_id: string | null
  custom_milestone_name: string | null
  status: MilestoneStatus
  observed_date: string | null
  target_date: string | null
  notes: string | null
  evidence_photos: string[] | null
  observed_by: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
  template?: MilestoneTemplate
  category?: MilestoneCategory
  observer?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface ChildMilestoneFormData {
  child_id: string
  template_id?: string
  category_id?: string
  custom_milestone_name?: string
  status?: MilestoneStatus
  observed_date?: string
  target_date?: string
  notes?: string
  evidence_photos?: string[]
}

// ==================== Milestone Observations ====================

export interface MilestoneObservation {
  id: string
  organization_id: string
  child_milestone_id: string
  observation_date: string
  observation_notes: string
  skill_level: SkillLevel | null
  context: string | null
  photos: string[] | null
  recorded_by: string | null
  created_at: string
  // Joined relations
  recorder?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface MilestoneObservationFormData {
  child_milestone_id: string
  observation_date?: string
  observation_notes: string
  skill_level?: SkillLevel
  context?: string
  photos?: string[]
}

// ==================== Learning Plans ====================

export interface LearningPlan {
  id: string
  organization_id: string
  child_id: string
  plan_period_start: string
  plan_period_end: string
  goals: string
  strategies: string | null
  accommodations: string | null
  family_involvement: string | null
  status: LearningPlanStatus
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
  creator?: {
    id: string
    first_name: string
    last_name: string
  }
  approver?: {
    id: string
    first_name: string
    last_name: string
  }
  plan_goals?: LearningPlanGoal[]
}

export interface LearningPlanFormData {
  child_id: string
  plan_period_start: string
  plan_period_end: string
  goals: string
  strategies?: string
  accommodations?: string
  family_involvement?: string
  status?: LearningPlanStatus
}

// ==================== Learning Plan Goals ====================

export interface LearningPlanGoal {
  id: string
  learning_plan_id: string
  category_id: string | null
  goal_description: string
  success_criteria: string | null
  target_date: string | null
  status: GoalStatus
  progress_notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  category?: MilestoneCategory
}

export interface LearningPlanGoalFormData {
  learning_plan_id: string
  category_id?: string
  goal_description: string
  success_criteria?: string
  target_date?: string
  status?: GoalStatus
  progress_notes?: string
}

// ==================== Portfolio Entries ====================

export interface PortfolioEntry {
  id: string
  organization_id: string
  child_id: string
  category_id: string | null
  child_milestone_id: string | null
  entry_date: string
  title: string
  description: string | null
  media_type: MediaType
  media_url: string
  thumbnail_url: string | null
  tags: string[] | null
  is_shared_with_family: boolean
  shared_at: string | null
  recorded_by: string | null
  created_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
  category?: MilestoneCategory
  milestone?: ChildMilestone
}

export interface PortfolioEntryFormData {
  child_id: string
  category_id?: string
  child_milestone_id?: string
  entry_date?: string
  title: string
  description?: string
  media_type: MediaType
  media_url: string
  thumbnail_url?: string
  tags?: string[]
  is_shared_with_family?: boolean
}

// ==================== Assessment Periods ====================

export interface AssessmentPeriod {
  id: string
  organization_id: string
  name: string
  period_start: string
  period_end: string
  assessment_type: AssessmentType
  is_active: boolean
  created_at: string
}

export interface AssessmentPeriodFormData {
  name: string
  period_start: string
  period_end: string
  assessment_type: AssessmentType
  is_active?: boolean
}

// ==================== Child Assessments ====================

export interface ChildAssessment {
  id: string
  organization_id: string
  child_id: string
  assessment_period_id: string
  assessed_by: string | null
  assessment_date: string
  overall_progress: OverallProgress | null
  strengths: string | null
  areas_for_growth: string | null
  recommendations: string | null
  family_conference_date: string | null
  family_conference_notes: string | null
  status: AssessmentStatus
  shared_at: string | null
  created_at: string
  updated_at: string
  // Joined relations
  child?: {
    id: string
    first_name: string
    last_name: string
  }
  assessor?: {
    id: string
    first_name: string
    last_name: string
  }
  period?: AssessmentPeriod
}

export interface ChildAssessmentFormData {
  child_id: string
  assessment_period_id: string
  assessment_date?: string
  overall_progress?: OverallProgress
  strengths?: string
  areas_for_growth?: string
  recommendations?: string
  family_conference_date?: string
  family_conference_notes?: string
  status?: AssessmentStatus
}

// ==================== Summary Types ====================

export interface MilestoneSummary {
  category_name: string
  total_milestones: number
  not_started: number
  emerging: number
  developing: number
  achieved: number
  exceeding: number
}

export interface ChildDevelopmentOverview {
  child_id: string
  total_milestones: number
  progress_by_category: MilestoneSummary[]
  recent_achievements: ChildMilestone[]
  active_learning_plan: LearningPlan | null
  latest_assessment: ChildAssessment | null
}

// ==================== Filters ====================

export interface MilestoneFilters {
  child_id?: string
  category_id?: string
  status?: MilestoneStatus
  age_months?: number
  is_dcf_required?: boolean
}

// ==================== UI Labels ====================

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  not_started: 'Not Started',
  emerging: 'Emerging',
  developing: 'Developing',
  achieved: 'Achieved',
  exceeding: 'Exceeding',
}

export const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  not_started: 'gray',
  emerging: 'yellow',
  developing: 'blue',
  achieved: 'green',
  exceeding: 'purple',
}

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  not_observed: 'Not Observed',
  emerging: 'Emerging',
  developing: 'Developing',
  proficient: 'Proficient',
}

export const LEARNING_PLAN_STATUS_LABELS: Record<LearningPlanStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  achieved: 'Achieved',
  modified: 'Modified',
}

export const OVERALL_PROGRESS_LABELS: Record<OverallProgress, string> = {
  below_expectations: 'Below Expectations',
  meeting_expectations: 'Meeting Expectations',
  exceeding_expectations: 'Exceeding Expectations',
}

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  quarterly: 'Quarterly',
  semester: 'Semester',
  annual: 'Annual',
  custom: 'Custom',
}

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  photo: 'Photo',
  video: 'Video',
  document: 'Document',
  artwork: 'Artwork',
  audio: 'Audio',
}

// Development area icons (for UI)
export const CATEGORY_ICONS: Record<string, string> = {
  'Physical Development': 'activity',
  'Cognitive Development': 'brain',
  'Language & Literacy': 'message-circle',
  'Social-Emotional': 'heart',
  'Creative Arts': 'palette',
  'Mathematical Thinking': 'calculator',
}

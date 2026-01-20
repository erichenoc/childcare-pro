import { createClient } from '@/shared/lib/supabase/client'
import type {
  MilestoneCategory,
  MilestoneTemplate,
  ChildMilestone,
  ChildMilestoneFormData,
  MilestoneObservation,
  MilestoneObservationFormData,
  LearningPlan,
  LearningPlanFormData,
  LearningPlanGoal,
  LearningPlanGoalFormData,
  PortfolioEntry,
  PortfolioEntryFormData,
  AssessmentPeriod,
  AssessmentPeriodFormData,
  ChildAssessment,
  ChildAssessmentFormData,
  MilestoneFilters,
  MilestoneSummary,
} from '@/shared/types/learning-milestones'

// ==================== Categories ====================

export async function getMilestoneCategories(): Promise<MilestoneCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('milestone_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  if (error) throw error
  return data || []
}

// ==================== Templates ====================

export async function getMilestoneTemplates(ageMonths?: number): Promise<MilestoneTemplate[]> {
  const supabase = createClient()
  let query = supabase
    .from('milestone_templates')
    .select(`
      *,
      category:milestone_categories(*)
    `)
    .order('display_order')

  if (ageMonths !== undefined) {
    query = query
      .lte('age_range_start_months', ageMonths)
      .gte('age_range_end_months', ageMonths)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getMilestoneTemplatesByCategory(categoryId: string): Promise<MilestoneTemplate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('milestone_templates')
    .select(`
      *,
      category:milestone_categories(*)
    `)
    .eq('category_id', categoryId)
    .order('display_order')

  if (error) throw error
  return data || []
}

// ==================== Child Milestones ====================

export async function getChildMilestones(filters: MilestoneFilters = {}): Promise<ChildMilestone[]> {
  const supabase = createClient()
  let query = supabase
    .from('child_milestones')
    .select(`
      *,
      child:children(id, first_name, last_name),
      template:milestone_templates(*,
        category:milestone_categories(*)
      ),
      category:milestone_categories(*),
      observer:staff(id, first_name, last_name)
    `)
    .order('updated_at', { ascending: false })

  if (filters.child_id) {
    query = query.eq('child_id', filters.child_id)
  }
  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getChildMilestoneById(id: string): Promise<ChildMilestone | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('child_milestones')
    .select(`
      *,
      child:children(id, first_name, last_name),
      template:milestone_templates(*,
        category:milestone_categories(*)
      ),
      category:milestone_categories(*),
      observer:staff(id, first_name, last_name)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createChildMilestone(formData: ChildMilestoneFormData): Promise<ChildMilestone> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('id, organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('child_milestones')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
      observed_by: formData.observed_date ? staff.id : null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateChildMilestone(id: string, formData: Partial<ChildMilestoneFormData>): Promise<ChildMilestone> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = { ...formData }

  if (formData.status === 'achieved' && !formData.observed_date) {
    updateData.observed_date = new Date().toISOString().split('T')[0]

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user.email)
        .single()
      if (staff) {
        updateData.observed_by = staff.id
      }
    }
  }

  const { data, error } = await supabase
    .from('child_milestones')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteChildMilestone(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('child_milestones')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== Milestone Observations ====================

export async function getMilestoneObservations(childMilestoneId: string): Promise<MilestoneObservation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('milestone_observations')
    .select(`
      *,
      recorder:staff(id, first_name, last_name)
    `)
    .eq('child_milestone_id', childMilestoneId)
    .order('observation_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createMilestoneObservation(formData: MilestoneObservationFormData): Promise<MilestoneObservation> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('id, organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('milestone_observations')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
      recorded_by: staff.id,
      observation_date: formData.observation_date || new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ==================== Learning Plans ====================

export async function getLearningPlans(childId?: string): Promise<LearningPlan[]> {
  const supabase = createClient()
  let query = supabase
    .from('learning_plans')
    .select(`
      *,
      child:children(id, first_name, last_name),
      creator:staff!learning_plans_created_by_fkey(id, first_name, last_name),
      approver:staff!learning_plans_approved_by_fkey(id, first_name, last_name),
      plan_goals:learning_plan_goals(
        *,
        category:milestone_categories(*)
      )
    `)
    .order('created_at', { ascending: false })

  if (childId) {
    query = query.eq('child_id', childId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getActiveLearningPlan(childId: string): Promise<LearningPlan | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('learning_plans')
    .select(`
      *,
      child:children(id, first_name, last_name),
      plan_goals:learning_plan_goals(
        *,
        category:milestone_categories(*)
      )
    `)
    .eq('child_id', childId)
    .eq('status', 'active')
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createLearningPlan(formData: LearningPlanFormData): Promise<LearningPlan> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('id, organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('learning_plans')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
      created_by: staff.id,
      status: formData.status || 'draft',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLearningPlan(id: string, formData: Partial<LearningPlanFormData>): Promise<LearningPlan> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('learning_plans')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function approveLearningPlan(id: string): Promise<LearningPlan> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('learning_plans')
    .update({
      status: 'active',
      approved_by: staff.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ==================== Learning Plan Goals ====================

export async function createLearningPlanGoal(formData: LearningPlanGoalFormData): Promise<LearningPlanGoal> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('learning_plan_goals')
    .insert({
      ...formData,
      status: formData.status || 'not_started',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLearningPlanGoal(id: string, formData: Partial<LearningPlanGoalFormData>): Promise<LearningPlanGoal> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('learning_plan_goals')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLearningPlanGoal(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('learning_plan_goals')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== Portfolio Entries ====================

export async function getPortfolioEntries(childId: string, categoryId?: string): Promise<PortfolioEntry[]> {
  const supabase = createClient()
  let query = supabase
    .from('portfolio_entries')
    .select(`
      *,
      child:children(id, first_name, last_name),
      category:milestone_categories(*),
      milestone:child_milestones(*)
    `)
    .eq('child_id', childId)
    .order('entry_date', { ascending: false })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createPortfolioEntry(formData: PortfolioEntryFormData): Promise<PortfolioEntry> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('id, organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('portfolio_entries')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
      recorded_by: staff.id,
      entry_date: formData.entry_date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePortfolioEntry(id: string, formData: Partial<PortfolioEntryFormData>): Promise<PortfolioEntry> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('portfolio_entries')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function sharePortfolioWithFamily(id: string): Promise<PortfolioEntry> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('portfolio_entries')
    .update({
      is_shared_with_family: true,
      shared_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePortfolioEntry(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('portfolio_entries')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== Assessment Periods ====================

export async function getAssessmentPeriods(): Promise<AssessmentPeriod[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('assessment_periods')
    .select('*')
    .order('period_start', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getActiveAssessmentPeriod(): Promise<AssessmentPeriod | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('assessment_periods')
    .select('*')
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createAssessmentPeriod(formData: AssessmentPeriodFormData): Promise<AssessmentPeriod> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('assessment_periods')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ==================== Child Assessments ====================

export async function getChildAssessments(childId?: string, periodId?: string): Promise<ChildAssessment[]> {
  const supabase = createClient()
  let query = supabase
    .from('child_assessments')
    .select(`
      *,
      child:children(id, first_name, last_name),
      assessor:staff(id, first_name, last_name),
      period:assessment_periods(*)
    `)
    .order('assessment_date', { ascending: false })

  if (childId) {
    query = query.eq('child_id', childId)
  }
  if (periodId) {
    query = query.eq('assessment_period_id', periodId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getChildAssessmentById(id: string): Promise<ChildAssessment | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('child_assessments')
    .select(`
      *,
      child:children(id, first_name, last_name),
      assessor:staff(id, first_name, last_name),
      period:assessment_periods(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createChildAssessment(formData: ChildAssessmentFormData): Promise<ChildAssessment> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staff } = await supabase
    .from('staff')
    .select('id, organization_id')
    .eq('email', user.email)
    .single()

  if (!staff) throw new Error('Staff not found')

  const { data, error } = await supabase
    .from('child_assessments')
    .insert({
      ...formData,
      organization_id: staff.organization_id,
      assessed_by: staff.id,
      assessment_date: formData.assessment_date || new Date().toISOString().split('T')[0],
      status: formData.status || 'draft',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateChildAssessment(id: string, formData: Partial<ChildAssessmentFormData>): Promise<ChildAssessment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('child_assessments')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function shareAssessmentWithFamily(id: string): Promise<ChildAssessment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('child_assessments')
    .update({
      status: 'shared_with_family',
      shared_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ==================== Summary & Analytics ====================

export async function getChildMilestoneSummary(childId: string): Promise<MilestoneSummary[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('get_child_milestone_summary', { p_child_id: childId })

  if (error) throw error
  return data || []
}

export async function initializeChildMilestones(childId: string, ageMonths: number): Promise<void> {
  const templates = await getMilestoneTemplates(ageMonths)

  for (const template of templates) {
    await createChildMilestone({
      child_id: childId,
      template_id: template.id,
      category_id: template.category_id,
      status: 'not_started',
    })
  }
}

// Export service object
export const learningMilestonesService = {
  // Categories
  getMilestoneCategories,
  // Templates
  getMilestoneTemplates,
  getMilestoneTemplatesByCategory,
  // Child Milestones
  getChildMilestones,
  getChildMilestoneById,
  createChildMilestone,
  updateChildMilestone,
  deleteChildMilestone,
  // Observations
  getMilestoneObservations,
  createMilestoneObservation,
  // Learning Plans
  getLearningPlans,
  getActiveLearningPlan,
  createLearningPlan,
  updateLearningPlan,
  approveLearningPlan,
  // Learning Plan Goals
  createLearningPlanGoal,
  updateLearningPlanGoal,
  deleteLearningPlanGoal,
  // Portfolio
  getPortfolioEntries,
  createPortfolioEntry,
  updatePortfolioEntry,
  sharePortfolioWithFamily,
  deletePortfolioEntry,
  // Assessment Periods
  getAssessmentPeriods,
  getActiveAssessmentPeriod,
  createAssessmentPeriod,
  // Child Assessments
  getChildAssessments,
  getChildAssessmentById,
  createChildAssessment,
  updateChildAssessment,
  shareAssessmentWithFamily,
  // Summary
  getChildMilestoneSummary,
  initializeChildMilestones,
}

import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type {
  MealRecord,
  MealRecordFormData,
  NapRecord,
  NapRecordFormData,
  BathroomRecord,
  BathroomRecordFormData,
  ActivityRecord,
  ActivityRecordFormData,
  MoodRecord,
  MoodRecordFormData,
  HealthObservation,
  HealthObservationFormData,
  DailyReport,
  DailyReportFormData,
  ChildDailySummary,
  DailyActivityFilters,
} from '@/shared/types/daily-activities'

export const dailyActivitiesService = {
  // ==================== Meal Records ====================

  async getMeals(filters?: DailyActivityFilters): Promise<MealRecord[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    let query = supabase
      .from('meal_records')
      .select(`
        *,
        child:children(id, first_name, last_name),
        recorder:profiles!recorded_by(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .order('meal_time', { ascending: false })

    if (filters?.child_id) {
      query = query.eq('child_id', filters.child_id)
    }
    if (filters?.date) {
      query = query.gte('meal_time', `${filters.date}T00:00:00`)
        .lt('meal_time', `${filters.date}T23:59:59`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as MealRecord[]
  },

  async createMeal(meal: MealRecordFormData): Promise<MealRecord> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('meal_records')
      .insert({
        ...meal,
        organization_id: orgId,
        recorded_by: user?.id,
        meal_time: meal.meal_time || new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) throw error
    return data as MealRecord
  },

  async updateMeal(id: string, updates: Partial<MealRecordFormData>): Promise<MealRecord> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('meal_records')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as MealRecord
  },

  async deleteMeal(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('meal_records').delete().eq('id', id)
    if (error) throw error
  },

  // ==================== Nap Records ====================

  async getNaps(filters?: DailyActivityFilters): Promise<NapRecord[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    let query = supabase
      .from('nap_records')
      .select(`
        *,
        child:children(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .order('start_time', { ascending: false })

    if (filters?.child_id) {
      query = query.eq('child_id', filters.child_id)
    }
    if (filters?.date) {
      query = query.gte('start_time', `${filters.date}T00:00:00`)
        .lt('start_time', `${filters.date}T23:59:59`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as NapRecord[]
  },

  async createNap(nap: NapRecordFormData): Promise<NapRecord> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('nap_records')
      .insert({
        ...nap,
        organization_id: orgId,
        recorded_by: user?.id,
      })
      .select('*')
      .single()

    if (error) throw error
    return data as NapRecord
  },

  async endNap(id: string): Promise<NapRecord> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('nap_records')
      .update({ end_time: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as NapRecord
  },

  async deleteNap(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('nap_records').delete().eq('id', id)
    if (error) throw error
  },

  // ==================== Bathroom Records ====================

  async getBathroomRecords(filters?: DailyActivityFilters): Promise<BathroomRecord[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    let query = supabase
      .from('bathroom_records')
      .select(`
        *,
        child:children(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .order('record_time', { ascending: false })

    if (filters?.child_id) {
      query = query.eq('child_id', filters.child_id)
    }
    if (filters?.date) {
      query = query.gte('record_time', `${filters.date}T00:00:00`)
        .lt('record_time', `${filters.date}T23:59:59`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as BathroomRecord[]
  },

  async createBathroomRecord(record: BathroomRecordFormData): Promise<BathroomRecord> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('bathroom_records')
      .insert({
        ...record,
        organization_id: orgId,
        recorded_by: user?.id,
        record_time: record.record_time || new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) throw error
    return data as BathroomRecord
  },

  async deleteBathroomRecord(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('bathroom_records').delete().eq('id', id)
    if (error) throw error
  },

  // ==================== Activity Records ====================

  async getActivities(filters?: DailyActivityFilters): Promise<ActivityRecord[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    let query = supabase
      .from('activity_records')
      .select(`
        *,
        child:children(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .order('activity_time', { ascending: false })

    if (filters?.child_id) {
      query = query.eq('child_id', filters.child_id)
    }
    if (filters?.date) {
      query = query.gte('activity_time', `${filters.date}T00:00:00`)
        .lt('activity_time', `${filters.date}T23:59:59`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as ActivityRecord[]
  },

  async createActivity(activity: ActivityRecordFormData): Promise<ActivityRecord> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('activity_records')
      .insert({
        ...activity,
        organization_id: orgId,
        recorded_by: user?.id,
        activity_time: activity.activity_time || new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) throw error
    return data as ActivityRecord
  },

  async deleteActivity(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('activity_records').delete().eq('id', id)
    if (error) throw error
  },

  // ==================== Mood Records ====================

  async getMoods(filters?: DailyActivityFilters): Promise<MoodRecord[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    let query = supabase
      .from('mood_records')
      .select(`
        *,
        child:children(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .order('record_time', { ascending: false })

    if (filters?.child_id) {
      query = query.eq('child_id', filters.child_id)
    }
    if (filters?.date) {
      query = query.gte('record_time', `${filters.date}T00:00:00`)
        .lt('record_time', `${filters.date}T23:59:59`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as MoodRecord[]
  },

  async createMood(mood: MoodRecordFormData): Promise<MoodRecord> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('mood_records')
      .insert({
        ...mood,
        organization_id: orgId,
        recorded_by: user?.id,
        record_time: mood.record_time || new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) throw error
    return data as MoodRecord
  },

  async deleteMood(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('mood_records').delete().eq('id', id)
    if (error) throw error
  },

  // ==================== Health Observations ====================

  async getHealthObservations(filters?: DailyActivityFilters): Promise<HealthObservation[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    let query = supabase
      .from('health_observations')
      .select(`
        *,
        child:children(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .order('observation_time', { ascending: false })

    if (filters?.child_id) {
      query = query.eq('child_id', filters.child_id)
    }
    if (filters?.date) {
      query = query.gte('observation_time', `${filters.date}T00:00:00`)
        .lt('observation_time', `${filters.date}T23:59:59`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as HealthObservation[]
  },

  async createHealthObservation(observation: HealthObservationFormData): Promise<HealthObservation> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('health_observations')
      .insert({
        ...observation,
        organization_id: orgId,
        recorded_by: user?.id,
        observation_time: observation.observation_time || new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) throw error
    return data as HealthObservation
  },

  async markParentNotified(id: string): Promise<HealthObservation> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('health_observations')
      .update({
        parent_notified: true,
        parent_notified_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as HealthObservation
  },

  // ==================== Daily Reports ====================

  async getDailyReports(filters?: DailyActivityFilters): Promise<DailyReport[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    let query = supabase
      .from('daily_reports')
      .select(`
        *,
        child:children(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .order('report_date', { ascending: false })

    if (filters?.child_id) {
      query = query.eq('child_id', filters.child_id)
    }
    if (filters?.date) {
      query = query.eq('report_date', filters.date)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as DailyReport[]
  },

  async getDailyReport(childId: string, date: string): Promise<DailyReport | null> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('organization_id', orgId)
      .eq('child_id', childId)
      .eq('report_date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as DailyReport
  },

  async createOrUpdateDailyReport(report: DailyReportFormData): Promise<DailyReport> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    // Try to find existing report
    const existing = await this.getDailyReport(report.child_id, report.report_date)

    if (existing) {
      const { data, error } = await supabase
        .from('daily_reports')
        .update({
          ...report,
          status: report.status || existing.status,
        })
        .eq('id', existing.id)
        .select('*')
        .single()

      if (error) throw error
      return data as DailyReport
    }

    const { data, error } = await supabase
      .from('daily_reports')
      .insert({
        ...report,
        organization_id: orgId,
        created_by: user?.id,
        status: report.status || 'draft',
      })
      .select('*')
      .single()

    if (error) throw error
    return data as DailyReport
  },

  async sendDailyReport(id: string, sendVia: 'email' | 'app' | 'both'): Promise<DailyReport> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('daily_reports')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by: user?.id,
        sent_via: sendVia,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as DailyReport
  },

  // ==================== Aggregated Summary ====================

  async getChildDailySummary(childId: string, date: string): Promise<ChildDailySummary> {
    const [meals, naps, bathroom, activities, moods, healthObs] = await Promise.all([
      this.getMeals({ child_id: childId, date }),
      this.getNaps({ child_id: childId, date }),
      this.getBathroomRecords({ child_id: childId, date }),
      this.getActivities({ child_id: childId, date }),
      this.getMoods({ child_id: childId, date }),
      this.getHealthObservations({ child_id: childId, date }),
    ])

    return {
      date,
      meals,
      naps,
      bathroom,
      activities,
      moods,
      health_observations: healthObs,
    }
  },

  // ==================== Quick Actions ====================

  async quickMealRecord(childId: string, mealType: MealRecordFormData['meal_type'], amountEaten: MealRecordFormData['amount_eaten']): Promise<MealRecord> {
    return this.createMeal({
      child_id: childId,
      meal_type: mealType,
      amount_eaten: amountEaten,
    })
  },

  async quickNapStart(childId: string): Promise<NapRecord> {
    return this.createNap({
      child_id: childId,
      start_time: new Date().toISOString(),
    })
  },

  async quickDiaperChange(childId: string, condition: BathroomRecordFormData['diaper_condition']): Promise<BathroomRecord> {
    return this.createBathroomRecord({
      child_id: childId,
      record_type: 'diaper',
      diaper_condition: condition,
    })
  },

  async quickMoodCheck(childId: string, mood: MoodRecordFormData['mood']): Promise<MoodRecord> {
    return this.createMood({
      child_id: childId,
      mood,
    })
  },
}

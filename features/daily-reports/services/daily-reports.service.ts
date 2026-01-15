import { createClient } from '@/shared/lib/supabase/client'
import type { DailyReport, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

export interface DailyReportWithRelations extends DailyReport {
  child?: {
    id: string
    first_name: string
    last_name: string
  } | null
  classroom?: {
    id: string
    name: string
  } | null
  creator?: {
    id: string
    first_name: string
    last_name: string
  } | null
}

export interface MealEntry {
  type: 'breakfast' | 'lunch' | 'snack'
  amount: 'none' | 'some' | 'most' | 'all'
  notes?: string
}

export interface NapEntry {
  start_time: string
  end_time: string
  quality?: 'restless' | 'good' | 'excellent'
}

export interface ActivityEntry {
  name: string
  description?: string
  time?: string
}

export interface DiaperEntry {
  time: string
  type: 'wet' | 'dirty' | 'both' | 'dry'
}

export const dailyReportsService = {
  async getAll(): Promise<DailyReportWithRelations[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('daily_reports')
      .select(`
        *,
        child:children(id, first_name, last_name),
        classroom:classrooms(id, name),
        creator:staff!daily_reports_created_by_fkey(id, first_name, last_name)
      `)
      .eq('organization_id', DEMO_ORG_ID)
      .order('date', { ascending: false })

    if (error) throw error
    return (data || []) as DailyReportWithRelations[]
  },

  async getById(id: string): Promise<DailyReportWithRelations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('daily_reports')
      .select(`
        *,
        child:children(id, first_name, last_name),
        classroom:classrooms(id, name),
        creator:staff!daily_reports_created_by_fkey(id, first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as DailyReportWithRelations
  },

  async getByChild(childId: string, limit?: number): Promise<DailyReportWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('daily_reports')
      .select(`
        *,
        child:children(id, first_name, last_name),
        classroom:classrooms(id, name),
        creator:staff!daily_reports_created_by_fkey(id, first_name, last_name)
      `)
      .eq('child_id', childId)
      .order('date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as DailyReportWithRelations[]
  },

  async getByDate(date: string): Promise<DailyReportWithRelations[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('daily_reports')
      .select(`
        *,
        child:children(id, first_name, last_name),
        classroom:classrooms(id, name),
        creator:staff!daily_reports_created_by_fkey(id, first_name, last_name)
      `)
      .eq('organization_id', DEMO_ORG_ID)
      .eq('date', date)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as DailyReportWithRelations[]
  },

  async getOrCreateForChildToday(childId: string): Promise<DailyReport> {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Try to get existing report
    const { data: existing } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('child_id', childId)
      .eq('date', today)
      .single()

    if (existing) return existing

    // Create new report
    const { data, error } = await supabase
      .from('daily_reports')
      .insert({
        child_id: childId,
        date: today,
        organization_id: DEMO_ORG_ID,
        meals: [],
        naps: [],
        activities: [],
        diaper_changes: [],
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async create(report: Omit<TablesInsert<'daily_reports'>, 'organization_id'>): Promise<DailyReport> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('daily_reports')
      .insert({
        ...report,
        organization_id: DEMO_ORG_ID,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, report: TablesUpdate<'daily_reports'>): Promise<DailyReport> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('daily_reports')
      .update({
        ...report,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async addMeal(reportId: string, meal: MealEntry): Promise<DailyReport> {
    const supabase = createClient()
    const { data: report } = await supabase
      .from('daily_reports')
      .select('meals')
      .eq('id', reportId)
      .single()

    const meals = Array.isArray(report?.meals) ? report.meals : []
    meals.push(meal)

    return this.update(reportId, { meals })
  },

  async addNap(reportId: string, nap: NapEntry): Promise<DailyReport> {
    const supabase = createClient()
    const { data: report } = await supabase
      .from('daily_reports')
      .select('naps')
      .eq('id', reportId)
      .single()

    const naps = Array.isArray(report?.naps) ? report.naps : []
    naps.push(nap)

    return this.update(reportId, { naps })
  },

  async addActivity(reportId: string, activity: ActivityEntry): Promise<DailyReport> {
    const supabase = createClient()
    const { data: report } = await supabase
      .from('daily_reports')
      .select('activities')
      .eq('id', reportId)
      .single()

    const activities = Array.isArray(report?.activities) ? report.activities : []
    activities.push(activity)

    return this.update(reportId, { activities })
  },

  async addDiaperChange(reportId: string, diaper: DiaperEntry): Promise<DailyReport> {
    const supabase = createClient()
    const { data: report } = await supabase
      .from('daily_reports')
      .select('diaper_changes')
      .eq('id', reportId)
      .single()

    const diaperChanges = Array.isArray(report?.diaper_changes) ? report.diaper_changes : []
    diaperChanges.push(diaper)

    return this.update(reportId, { diaper_changes: diaperChanges })
  },

  async sendToParents(reportId: string): Promise<DailyReport> {
    return this.update(reportId, {
      sent_to_parents: true,
      sent_at: new Date().toISOString(),
    })
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('daily_reports')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getStats(date?: string) {
    const supabase = createClient()
    const targetDate = date || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('daily_reports')
      .select('id, sent_to_parents')
      .eq('organization_id', DEMO_ORG_ID)
      .eq('date', targetDate)

    if (error) throw error

    const reports = data || []
    return {
      total: reports.length,
      sent: reports.filter(r => r.sent_to_parents).length,
      pending: reports.filter(r => !r.sent_to_parents).length,
    }
  },
}

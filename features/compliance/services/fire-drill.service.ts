import { createClient } from '@/shared/lib/supabase/client'

export interface FireDrill {
  id: string
  organization_id: string
  drill_date: string
  drill_time: string
  drill_type: 'fire' | 'tornado' | 'lockdown' | 'evacuation'
  duration_seconds: number | null
  weather_conditions: string | null
  total_children: number
  total_staff: number
  evacuation_successful: boolean
  issues_noted: string | null
  corrective_actions: string | null
  all_exits_used: boolean
  assembly_point_reached: boolean
  headcount_verified: boolean
  conducted_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  // Joined fields
  conductor?: { first_name: string; last_name: string } | null
}

export interface FireDrillFormData {
  drill_date: string
  drill_time: string
  drill_type: 'fire' | 'tornado' | 'lockdown' | 'evacuation'
  duration_seconds: number | null
  weather_conditions: string
  total_children: number
  total_staff: number
  evacuation_successful: boolean
  issues_noted: string
  corrective_actions: string
  all_exits_used: boolean
  assembly_point_reached: boolean
  headcount_verified: boolean
  conducted_by: string
  notes: string
}

export interface FireDrillComplianceStatus {
  isCompliant: boolean
  lastDrillDate: string | null
  drillsThisMonth: number
  drillsThisYear: number
  monthsMissed: string[]
}

export const DRILL_TYPE_LABELS: Record<string, string> = {
  fire: 'Simulacro de Incendio',
  tornado: 'Simulacro de Tornado',
  lockdown: 'Simulacro de Confinamiento',
  evacuation: 'Simulacro de Evacuacion',
}

class FireDrillService {
  private getClient() {
    return createClient()
  }

  async getAll(organizationId: string): Promise<FireDrill[]> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('fire_drills')
      .select(`
        *,
        conductor:profiles!conducted_by(first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order('drill_date', { ascending: false })

    if (error) throw error
    return (data || []).map(d => ({
      ...d,
      conductor: Array.isArray(d.conductor) ? d.conductor[0] : d.conductor,
    })) as FireDrill[]
  }

  async getById(id: string): Promise<FireDrill | null> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('fire_drills')
      .select(`
        *,
        conductor:profiles!conducted_by(first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) return null
    return {
      ...data,
      conductor: Array.isArray(data.conductor) ? data.conductor[0] : data.conductor,
    } as FireDrill
  }

  async create(
    organizationId: string,
    data: FireDrillFormData,
    userId: string
  ): Promise<FireDrill> {
    const supabase = this.getClient()
    const { data: drill, error } = await supabase
      .from('fire_drills')
      .insert({
        organization_id: organizationId,
        drill_date: data.drill_date,
        drill_time: data.drill_time,
        drill_type: data.drill_type,
        duration_seconds: data.duration_seconds || null,
        weather_conditions: data.weather_conditions || null,
        total_children: data.total_children,
        total_staff: data.total_staff,
        evacuation_successful: data.evacuation_successful,
        issues_noted: data.issues_noted || null,
        corrective_actions: data.corrective_actions || null,
        all_exits_used: data.all_exits_used,
        assembly_point_reached: data.assembly_point_reached,
        headcount_verified: data.headcount_verified,
        conducted_by: data.conducted_by || null,
        notes: data.notes || null,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error
    return drill as FireDrill
  }

  async update(id: string, data: Partial<FireDrillFormData>): Promise<FireDrill> {
    const supabase = this.getClient()
    const { data: drill, error } = await supabase
      .from('fire_drills')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return drill as FireDrill
  }

  async delete(id: string): Promise<void> {
    const supabase = this.getClient()
    const { error } = await supabase
      .from('fire_drills')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getComplianceStatus(organizationId: string): Promise<FireDrillComplianceStatus> {
    const supabase = this.getClient()
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    // Get all drills this year
    const { data: yearDrills } = await supabase
      .from('fire_drills')
      .select('drill_date')
      .eq('organization_id', organizationId)
      .gte('drill_date', yearStart)
      .order('drill_date', { ascending: true })

    // Get drills this month
    const { data: monthDrills } = await supabase
      .from('fire_drills')
      .select('drill_date')
      .eq('organization_id', organizationId)
      .gte('drill_date', monthStart)

    // Find months without drills
    const drillMonths = new Set(
      (yearDrills || []).map(d => d.drill_date.substring(0, 7))
    )
    const monthsMissed: string[] = []
    for (let m = 0; m <= now.getMonth(); m++) {
      const monthKey = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`
      if (!drillMonths.has(monthKey)) {
        monthsMissed.push(monthKey)
      }
    }

    const lastDrill =
      yearDrills && yearDrills.length > 0
        ? yearDrills[yearDrills.length - 1].drill_date
        : null

    return {
      isCompliant: monthsMissed.length === 0,
      lastDrillDate: lastDrill,
      drillsThisMonth: (monthDrills || []).length,
      drillsThisYear: (yearDrills || []).length,
      monthsMissed,
    }
  }

  getTypeLabel(type: string): string {
    return DRILL_TYPE_LABELS[type] || type
  }
}

export const fireDrillService = new FireDrillService()

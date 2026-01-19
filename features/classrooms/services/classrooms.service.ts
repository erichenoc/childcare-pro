import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { Classroom, TablesInsert, TablesUpdate } from '@/shared/types/database.types'

// Capacity status types for alerts
export type CapacityStatus = 'available' | 'warning' | 'at_capacity' | 'exceeded'

export interface CapacityAlert {
  status: CapacityStatus
  message: string
  isError: boolean
  isWarning: boolean
  available_spots: number
  percentage_full: number
}

export type ClassroomWithStats = Classroom & {
  children_count: number
  staff_count: number
  current_ratio: number
  capacity_status: CapacityAlert
}

/**
 * Calculate capacity status for a classroom
 * - ALERTA cuando llega al 90% o máximo de capacidad
 * - ERROR cuando excede la capacidad
 */
function calculateCapacityStatus(children_count: number, capacity: number | null): CapacityAlert {
  if (!capacity || capacity <= 0) {
    return {
      status: 'available',
      message: 'Sin capacidad configurada',
      isError: false,
      isWarning: true,
      available_spots: 0,
      percentage_full: 0,
    }
  }

  const percentage = Math.round((children_count / capacity) * 100)
  const available = capacity - children_count

  // ERROR: Excede capacidad
  if (children_count > capacity) {
    return {
      status: 'exceeded',
      message: `⛔ ERROR: Capacidad excedida (${children_count}/${capacity})`,
      isError: true,
      isWarning: false,
      available_spots: available,
      percentage_full: percentage,
    }
  }

  // ALERTA: En capacidad máxima
  if (children_count === capacity) {
    return {
      status: 'at_capacity',
      message: `⚠️ ALERTA: Capacidad máxima alcanzada (${children_count}/${capacity})`,
      isError: false,
      isWarning: true,
      available_spots: 0,
      percentage_full: 100,
    }
  }

  // WARNING: Cerca del límite (90% o más)
  if (percentage >= 90) {
    return {
      status: 'warning',
      message: `Cerca del límite (${children_count}/${capacity}) - ${available} lugares disponibles`,
      isError: false,
      isWarning: true,
      available_spots: available,
      percentage_full: percentage,
    }
  }

  // OK: Capacidad disponible
  return {
    status: 'available',
    message: `${available} lugares disponibles`,
    isError: false,
    isWarning: false,
    available_spots: available,
    percentage_full: percentage,
  }
}

export const classroomsService = {
  async getAll(): Promise<Classroom[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('organization_id', orgId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Classroom | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  async getWithStats(): Promise<ClassroomWithStats[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Get classrooms
    const { data: classrooms, error: classroomsError } = await supabase
      .from('classrooms')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (classroomsError) throw classroomsError

    // Get children count per classroom (present today)
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('classroom_id')
      .eq('organization_id', orgId)
      .eq('date', today)
      .eq('status', 'present')

    if (attendanceError) throw attendanceError

    // Get staff assignments
    const { data: staffAssignments, error: staffError } = await supabase
      .from('staff_assignments')
      .select('classroom_id')
      .eq('organization_id', orgId)
      .eq('status', 'active')

    if (staffError) throw staffError

    // Calculate stats for each classroom including capacity alerts
    return (classrooms || []).map(classroom => {
      const children_count = attendance?.filter(a => a.classroom_id === classroom.id).length || 0
      const staff_count = staffAssignments?.filter(s => s.classroom_id === classroom.id).length || 0
      const current_ratio = staff_count > 0 ? Math.round((children_count / staff_count) * 10) / 10 : 0
      const capacity_status = calculateCapacityStatus(children_count, classroom.capacity)

      return {
        ...classroom,
        children_count,
        staff_count,
        current_ratio,
        capacity_status,
      }
    })
  },

  // Get classrooms with capacity alerts (only those with warnings or errors)
  async getCapacityAlerts(): Promise<ClassroomWithStats[]> {
    const allClassrooms = await this.getWithStats()
    return allClassrooms.filter(c => c.capacity_status.isWarning || c.capacity_status.isError)
  },

  // Validate if a child can be added to a classroom (checks capacity)
  async canAddChild(classroomId: string): Promise<{ allowed: boolean; message: string }> {
    const classrooms = await this.getWithStats()
    const classroom = classrooms.find(c => c.id === classroomId)

    if (!classroom) {
      return { allowed: false, message: 'Salón no encontrado' }
    }

    if (classroom.capacity_status.status === 'exceeded') {
      return {
        allowed: false,
        message: classroom.capacity_status.message
      }
    }

    if (classroom.capacity_status.status === 'at_capacity') {
      return {
        allowed: false,
        message: 'El salón está en capacidad máxima. No se pueden agregar más niños.'
      }
    }

    return {
      allowed: true,
      message: `Capacidad disponible: ${classroom.capacity_status.available_spots} lugares`
    }
  },

  async create(classroom: Omit<TablesInsert<'classrooms'>, 'organization_id'>): Promise<Classroom> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('classrooms')
      .insert({
        ...classroom,
        organization_id: orgId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, classroom: TablesUpdate<'classrooms'>): Promise<Classroom> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('classrooms')
      .update(classroom)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('classrooms')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

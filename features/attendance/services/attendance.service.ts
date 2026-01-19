import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { Attendance, AttendanceWithChild, TablesInsert, TablesUpdate } from '@/shared/types/database.types'
import type {
  CheckInData,
  CheckOutData,
  AuthorizedPickupPerson,
  PickupValidationResult,
  AttendanceWithPickup,
} from '@/shared/types/attendance-extended'
import { programHoursService, type ProgramHoursResult } from '@/features/programs/services/program-hours.service'

export const attendanceService = {
  async getByDate(date: string): Promise<AttendanceWithChild[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        child:children(*),
        classroom:classrooms(*)
      `)
      .eq('organization_id', orgId)
      .eq('date', date)
      .order('check_in_time', { ascending: true })

    if (error) throw error
    return (data || []) as AttendanceWithChild[]
  },

  async getByChild(childId: string, startDate?: string, endDate?: string): Promise<Attendance[]> {
    const supabase = createClient()
    let query = supabase
      .from('attendance')
      .select('*')
      .eq('child_id', childId)
      .order('date', { ascending: false })

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  /**
   * Get all authorized pickup people for a child
   * Includes guardians, authorized pickups, and authorized emergency contacts
   */
  async getAuthorizedPickups(childId: string): Promise<AuthorizedPickupPerson[]> {
    const supabase = createClient()

    // Call the database function that aggregates all authorized pickups
    const { data, error } = await supabase
      .rpc('get_authorized_pickups_for_child', { p_child_id: childId })

    if (error) {
      console.error('Error getting authorized pickups:', error)
      // Fallback: try to get guardians directly
      const { data: guardians } = await supabase
        .from('guardians')
        .select(`
          id,
          first_name,
          last_name,
          relationship_type,
          phone,
          photo_url,
          id_document_url
        `)
        .eq('family_id', (
          await supabase
            .from('children')
            .select('family_id')
            .eq('id', childId)
            .single()
        ).data?.family_id)
        .eq('status', 'active')

      if (guardians) {
        return guardians.map(g => ({
          person_id: g.id,
          person_type: 'guardian' as const,
          name: `${g.first_name} ${g.last_name}`,
          relationship: g.relationship_type,
          phone: g.phone,
          photo_url: g.photo_url,
          has_photo: !!g.photo_url,
          has_id: !!g.id_document_url,
          restrictions: null,
        }))
      }
      return []
    }

    return (data || []) as AuthorizedPickupPerson[]
  },

  /**
   * Validate if a person is authorized to pick up a child
   */
  async validatePickupPerson(
    childId: string,
    personType: string,
    personId: string
  ): Promise<PickupValidationResult> {
    const supabase = createClient()

    const { data, error } = await supabase
      .rpc('validate_pickup_person', {
        p_child_id: childId,
        p_person_type: personType,
        p_person_id: personId,
      })

    if (error) {
      console.error('Error validating pickup person:', error)
      return {
        is_valid: false,
        person_name: null,
        relationship: null,
        photo_url: null,
        restrictions: null,
        message: 'Error al validar persona autorizada',
      }
    }

    // The function returns a single row
    const result = data?.[0]
    return {
      is_valid: result?.is_valid ?? false,
      person_name: result?.person_name ?? null,
      relationship: result?.relationship ?? null,
      photo_url: result?.photo_url ?? null,
      restrictions: result?.restrictions ?? null,
      message: result?.message ?? 'Persona no encontrada',
    }
  },

  /**
   * Check in a child with drop-off person information
   */
  async checkIn(
    childId: string,
    classroomId: string,
    checkedInBy?: string,
    dropOffInfo?: {
      person_name?: string
      person_relationship?: string
      guardian_id?: string
    }
  ): Promise<Attendance> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // Check if already has attendance record for today
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('child_id', childId)
      .eq('date', today)
      .single()

    const checkInData: TablesUpdate<'attendance'> = {
      check_in_time: now,
      status: 'present',
      checked_in_by: checkedInBy,
      classroom_id: classroomId,
      // Drop-off person info
      check_in_person_name: dropOffInfo?.person_name || null,
      check_in_person_relationship: dropOffInfo?.person_relationship || null,
      check_in_guardian_id: dropOffInfo?.guardian_id || null,
    }

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('attendance')
        .update(checkInData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          organization_id: orgId,
          child_id: childId,
          date: today,
          ...checkInData,
        } as TablesInsert<'attendance'>)
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  /**
   * Check in with full data object
   */
  async checkInWithData(data: CheckInData): Promise<Attendance> {
    return this.checkIn(
      data.child_id,
      data.classroom_id,
      undefined,
      {
        person_name: data.drop_off_person_name,
        person_relationship: data.drop_off_person_relationship,
        guardian_id: data.drop_off_person_id,
      }
    )
  },

  /**
   * Check out a child with pickup person verification
   * Also records program hours (VPK/SR) automatically
   */
  async checkOut(
    childId: string,
    checkedOutBy?: string,
    pickupInfo?: {
      person_name?: string
      person_relationship?: string
      guardian_id?: string
      verified?: boolean
      verification_method?: string
    }
  ): Promise<{ attendance: Attendance; programHours?: ProgramHoursResult }> {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // First, get the existing attendance record to get check_in_time
    const { data: existingAttendance, error: fetchError } = await supabase
      .from('attendance')
      .select('id, check_in_time')
      .eq('child_id', childId)
      .eq('date', today)
      .single()

    if (fetchError) throw fetchError
    if (!existingAttendance?.check_in_time) {
      throw new Error('No se encontró registro de entrada para hoy')
    }

    const checkOutData: TablesUpdate<'attendance'> = {
      check_out_time: now,
      checked_out_by: checkedOutBy,
      // Pickup person info
      check_out_person_name: pickupInfo?.person_name || null,
      check_out_person_relationship: pickupInfo?.person_relationship || null,
      check_out_guardian_id: pickupInfo?.guardian_id || null,
      check_out_verified: pickupInfo?.verified ?? false,
      check_out_verification_method: pickupInfo?.verification_method || null,
    }

    const { data, error } = await supabase
      .from('attendance')
      .update(checkOutData)
      .eq('child_id', childId)
      .eq('date', today)
      .select()
      .single()

    if (error) throw error

    // Record program hours (VPK/SR) after successful checkout
    let programHours: ProgramHoursResult | undefined
    try {
      programHours = await programHoursService.recordProgramHours(
        childId,
        data.id,
        existingAttendance.check_in_time,
        now,
        today
      )

      if (programHours.errors.length > 0) {
        console.warn('Program hours recorded with warnings:', programHours.errors)
      }
    } catch (hoursError) {
      // Don't fail checkout if hours recording fails, just log
      console.error('Error recording program hours:', hoursError)
    }

    return { attendance: data, programHours }
  },

  /**
   * Check out with full data object and validation
   * Returns attendance record and program hours (VPK/SR) if applicable
   */
  async checkOutWithData(data: CheckOutData): Promise<{
    success: boolean
    attendance?: Attendance
    programHours?: ProgramHoursResult
    error?: string
  }> {
    // If a specific person is selected, validate them
    if (data.pickup_person_id && data.pickup_person_type) {
      const validation = await this.validatePickupPerson(
        data.child_id,
        data.pickup_person_type,
        data.pickup_person_id
      )

      if (!validation.is_valid) {
        return {
          success: false,
          error: validation.message || 'Persona no autorizada para recoger al niño',
        }
      }

      // Use validated person info
      data.pickup_person_name = validation.person_name || data.pickup_person_name
      data.pickup_person_relationship = validation.relationship || data.pickup_person_relationship
    }

    try {
      const { attendance, programHours } = await this.checkOut(
        data.child_id,
        undefined,
        {
          person_name: data.pickup_person_name,
          person_relationship: data.pickup_person_relationship,
          guardian_id: data.pickup_person_id,
          verified: data.verified,
          verification_method: data.verification_method,
        }
      )

      return { success: true, attendance, programHours }
    } catch (error) {
      console.error('Error during check-out:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al registrar salida',
      }
    }
  },

  async markAbsent(childId: string, date: string, notes?: string): Promise<Attendance> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get child's classroom
    const { data: child } = await supabase
      .from('children')
      .select('classroom_id')
      .eq('id', childId)
      .single()

    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        organization_id: orgId,
        child_id: childId,
        classroom_id: child?.classroom_id,
        date,
        status: 'absent',
        notes,
      }, {
        onConflict: 'child_id,date',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getDailyStats(date: string) {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get all active children
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, classroom_id')
      .eq('organization_id', orgId)
      .eq('status', 'active')

    if (childrenError) throw childrenError

    // Get attendance for the date
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('child_id, status, classroom_id, check_out_time, check_out_verified')
      .eq('organization_id', orgId)
      .eq('date', date)

    if (attendanceError) throw attendanceError

    const total = children?.length || 0
    const present = attendance?.filter(a => a.status === 'present').length || 0
    const absent = total - present
    const late = attendance?.filter(a => a.status === 'late').length || 0
    const sick = attendance?.filter(a => a.status === 'sick').length || 0

    // Pickup stats
    const checkedOut = attendance?.filter(a => a.check_out_time).length || 0
    const pendingCheckout = present - checkedOut
    const verifiedPickups = attendance?.filter(a => a.check_out_verified === true).length || 0

    // Group by classroom
    const byClassroom = new Map<string, { present: number; total: number }>()
    children?.forEach(child => {
      if (child.classroom_id) {
        const existing = byClassroom.get(child.classroom_id) || { present: 0, total: 0 }
        existing.total++
        byClassroom.set(child.classroom_id, existing)
      }
    })
    attendance?.forEach(record => {
      if (record.classroom_id && record.status === 'present') {
        const existing = byClassroom.get(record.classroom_id) || { present: 0, total: 0 }
        existing.present++
        byClassroom.set(record.classroom_id, existing)
      }
    })

    return {
      total,
      present,
      absent,
      late,
      sick,
      checked_out: checkedOut,
      pending_checkout: pendingCheckout,
      verified_pickups: verifiedPickups,
      byClassroom: Object.fromEntries(byClassroom),
    }
  },

  async getStats() {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('organization_id', orgId)
      .eq('date', today)

    if (error) throw error

    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      total: data?.length || 0,
    }

    data?.forEach(record => {
      if (record.status === 'present') stats.present++
      else if (record.status === 'absent') stats.absent++
      else if (record.status === 'late') stats.late++
    })

    return stats
  }
}

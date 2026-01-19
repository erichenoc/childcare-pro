import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type {
  CheckInFormData,
  CheckOutFormData,
  CheckInResult,
  CheckOutResult,
  AttendanceExpanded,
  TodayAttendanceByClassroom,
} from '@/shared/types/attendance-expanded'

export interface PickupPerson {
  id: string
  name: string
  relationship: string
  type: 'guardian' | 'authorized' | 'emergency_contact'
  photo_url: string | null
  can_pickup: boolean
  requires_verification: boolean
}

export interface ChildWithPickupInfo {
  id: string
  first_name: string
  last_name: string
  classroom_id: string
  classroom_name: string
  family_id: string
  photo_url: string | null
  today_status: 'not_checked_in' | 'present' | 'checked_out' | 'absent'
  check_in_time: string | null
  authorized_pickups: PickupPerson[]
}

export const attendanceEnhancedService = {
  /**
   * Get all children with their authorized pickup people for kiosk mode
   */
  async getChildrenForKiosk(): Promise<ChildWithPickupInfo[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Get active children with their classrooms
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select(`
        id,
        first_name,
        last_name,
        classroom_id,
        family_id,
        photo_url,
        classroom:classrooms(name)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('first_name')

    if (childrenError) throw childrenError

    // Get today's attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('child_id, status, check_in_time, check_out_time')
      .eq('organization_id', orgId)
      .eq('date', today)

    // Get guardians for all families
    const familyIds = [...new Set(children?.map(c => c.family_id).filter(Boolean))]
    const { data: guardians } = await supabase
      .from('guardians')
      .select(`
        id,
        first_name,
        last_name,
        relationship,
        family_id,
        photo_url,
        can_pickup,
        guardian_children(child_id)
      `)
      .in('family_id', familyIds)
      .eq('status', 'active')

    // Get authorized pickups for all children
    const childIds = children?.map(c => c.id) || []
    const { data: authorizedPickups } = await supabase
      .from('authorized_pickups')
      .select('*')
      .in('child_id', childIds)
      .eq('is_active', true)

    // Get emergency contacts
    const { data: emergencyContacts } = await supabase
      .from('emergency_contacts')
      .select('*')
      .in('child_id', childIds)
      .eq('authorized_pickup', true)

    // Build the response
    const result: ChildWithPickupInfo[] = (children || []).map(child => {
      const childAttendance = attendance?.find(a => a.child_id === child.id)
      let todayStatus: ChildWithPickupInfo['today_status'] = 'not_checked_in'

      if (childAttendance) {
        if (childAttendance.status === 'absent') {
          todayStatus = 'absent'
        } else if (childAttendance.check_out_time) {
          todayStatus = 'checked_out'
        } else if (childAttendance.check_in_time) {
          todayStatus = 'present'
        }
      }

      // Collect all authorized pickup people
      const pickupPeople: PickupPerson[] = []

      // Add guardians who can pickup
      const childGuardians = guardians?.filter(g =>
        g.family_id === child.family_id &&
        g.guardian_children?.some((gc: { child_id: string }) => gc.child_id === child.id)
      ) || []

      childGuardians.forEach(guardian => {
        if (guardian.can_pickup !== false) {
          pickupPeople.push({
            id: guardian.id,
            name: `${guardian.first_name} ${guardian.last_name}`,
            relationship: guardian.relationship || 'Guardian',
            type: 'guardian',
            photo_url: guardian.photo_url,
            can_pickup: true,
            requires_verification: false,
          })
        }
      })

      // Add authorized pickups
      const childAuthorized = authorizedPickups?.filter(ap => ap.child_id === child.id) || []
      childAuthorized.forEach(auth => {
        pickupPeople.push({
          id: auth.id,
          name: auth.person_name,
          relationship: auth.relationship,
          type: 'authorized',
          photo_url: auth.photo_url,
          can_pickup: true,
          requires_verification: auth.requires_id_verification || false,
        })
      })

      // Add emergency contacts authorized for pickup
      const childEmergency = emergencyContacts?.filter(ec =>
        ec.child_id === child.id && ec.authorized_pickup
      ) || []
      childEmergency.forEach(ec => {
        pickupPeople.push({
          id: ec.id,
          name: ec.name,
          relationship: ec.relationship,
          type: 'emergency_contact',
          photo_url: null,
          can_pickup: true,
          requires_verification: true, // Always verify emergency contacts
        })
      })

      return {
        id: child.id,
        first_name: child.first_name,
        last_name: child.last_name,
        classroom_id: child.classroom_id || '',
        classroom_name: (Array.isArray(child.classroom) ? child.classroom[0]?.name : (child.classroom as { name: string } | null)?.name) || 'Sin Asignar',
        family_id: child.family_id || '',
        photo_url: child.photo_url,
        today_status: todayStatus,
        check_in_time: childAttendance?.check_in_time || null,
        authorized_pickups: pickupPeople,
      }
    })

    return result
  },

  /**
   * Check in a child with full tracking
   */
  async checkInEnhanced(data: CheckInFormData): Promise<CheckInResult> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    try {
      // Get the person who is checking in the child
      let personName = ''
      let personRelationship = ''
      let guardianId: string | null = null
      let authorizedPickupId: string | null = null

      if (data.brought_by_type === 'guardian') {
        const { data: guardian } = await supabase
          .from('guardians')
          .select('first_name, last_name, relationship')
          .eq('id', data.brought_by_id)
          .single()

        if (guardian) {
          personName = `${guardian.first_name} ${guardian.last_name}`
          personRelationship = guardian.relationship || 'Guardian'
          guardianId = data.brought_by_id
        }
      } else if (data.brought_by_type === 'authorized') {
        const { data: auth } = await supabase
          .from('authorized_pickups')
          .select('person_name, relationship')
          .eq('id', data.brought_by_id)
          .single()

        if (auth) {
          personName = auth.person_name
          personRelationship = auth.relationship
          authorizedPickupId = data.brought_by_id
        }
      } else {
        const { data: emergency } = await supabase
          .from('emergency_contacts')
          .select('name, relationship')
          .eq('id', data.brought_by_id)
          .single()

        if (emergency) {
          personName = emergency.name
          personRelationship = emergency.relationship
        }
      }

      // Check for existing attendance record
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('child_id', data.child_id)
        .eq('date', today)
        .single()

      const attendanceData = {
        organization_id: orgId,
        child_id: data.child_id,
        classroom_id: data.classroom_id,
        date: today,
        check_in_time: now,
        check_in_guardian_id: guardianId,
        check_in_authorized_pickup_id: authorizedPickupId,
        check_in_person_name: personName,
        check_in_person_relationship: personRelationship,
        check_in_method: data.method || 'manual',
        check_in_temperature: data.temperature || null,
        temperature_unit: 'F' as const,
        health_screening_passed: !data.temperature || data.temperature < 100.4,
        parent_drop_off_notes: data.notes || null,
        status: 'present' as const,
      }

      let result
      if (existing) {
        const { data: updated, error } = await supabase
          .from('attendance')
          .update(attendanceData)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        result = updated
      } else {
        const { data: created, error } = await supabase
          .from('attendance')
          .insert(attendanceData)
          .select()
          .single()

        if (error) throw error
        result = created
      }

      return {
        success: true,
        attendance_id: result.id,
        message: `${personName} registró la entrada exitosamente`,
      }
    } catch (error) {
      console.error('Check-in error:', error)
      return {
        success: false,
        attendance_id: null,
        message: 'Error al registrar la entrada',
      }
    }
  },

  /**
   * Check out a child with pickup validation
   */
  async checkOutEnhanced(data: CheckOutFormData): Promise<CheckOutResult> {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    try {
      // First validate that the person is authorized to pick up
      const isAuthorized = await this.validatePickup(data.child_id, data.picked_up_by_type, data.picked_up_by_id)

      if (!isAuthorized) {
        return {
          success: false,
          attendance_id: null,
          message: 'Esta persona NO está autorizada para recoger a este niño',
          blocked: true,
        }
      }

      // Get the person's details
      let personName = ''
      let personRelationship = ''
      let guardianId: string | null = null
      let authorizedPickupId: string | null = null

      if (data.picked_up_by_type === 'guardian') {
        const { data: guardian } = await supabase
          .from('guardians')
          .select('first_name, last_name, relationship')
          .eq('id', data.picked_up_by_id)
          .single()

        if (guardian) {
          personName = `${guardian.first_name} ${guardian.last_name}`
          personRelationship = guardian.relationship || 'Guardian'
          guardianId = data.picked_up_by_id
        }
      } else if (data.picked_up_by_type === 'authorized') {
        const { data: auth } = await supabase
          .from('authorized_pickups')
          .select('person_name, relationship')
          .eq('id', data.picked_up_by_id)
          .single()

        if (auth) {
          personName = auth.person_name
          personRelationship = auth.relationship
          authorizedPickupId = data.picked_up_by_id
        }
      } else {
        const { data: emergency } = await supabase
          .from('emergency_contacts')
          .select('name, relationship')
          .eq('id', data.picked_up_by_id)
          .single()

        if (emergency) {
          personName = emergency.name
          personRelationship = emergency.relationship
        }
      }

      // Update attendance record
      const { data: updated, error } = await supabase
        .from('attendance')
        .update({
          check_out_time: now,
          check_out_guardian_id: guardianId,
          check_out_authorized_pickup_id: authorizedPickupId,
          check_out_person_name: personName,
          check_out_person_relationship: personRelationship,
          check_out_verified: data.verified,
          check_out_verification_method: data.verification_method || null,
          check_out_method: data.method || 'manual',
          parent_pickup_notes: data.notes || null,
        })
        .eq('child_id', data.child_id)
        .eq('date', today)
        .select()
        .single()

      if (error) throw error

      // Calculate total hours
      if (updated.check_in_time) {
        const checkIn = new Date(updated.check_in_time)
        const checkOut = new Date(now)
        const totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)

        await supabase
          .from('attendance')
          .update({ total_hours: Math.round(totalHours * 100) / 100 })
          .eq('id', updated.id)
      }

      // Record pickup in authorized_pickups if applicable
      if (data.picked_up_by_type === 'authorized' && data.picked_up_by_id) {
        await supabase
          .from('authorized_pickups')
          .update({ last_pickup_date: today })
          .eq('id', data.picked_up_by_id)
      }

      return {
        success: true,
        attendance_id: updated.id,
        message: `${personName} recogió al niño exitosamente`,
        blocked: false,
      }
    } catch (error) {
      console.error('Check-out error:', error)
      return {
        success: false,
        attendance_id: null,
        message: 'Error al registrar la salida',
        blocked: false,
      }
    }
  },

  /**
   * Validate if a person can pick up a child
   */
  async validatePickup(
    childId: string,
    personType: 'guardian' | 'authorized' | 'emergency_contact',
    personId: string
  ): Promise<boolean> {
    const supabase = createClient()

    try {
      if (personType === 'guardian') {
        // Check if guardian is linked to this child and can pickup
        const { data } = await supabase
          .from('guardian_children')
          .select(`
            guardian_id,
            guardian:guardians(can_pickup, status)
          `)
          .eq('child_id', childId)
          .eq('guardian_id', personId)
          .single()

        if (!data) return false
        const guardianData = data.guardian
        const guardian = Array.isArray(guardianData) ? guardianData[0] : guardianData
        return guardian?.can_pickup !== false && guardian?.status === 'active'
      }

      if (personType === 'authorized') {
        // Check if authorized pickup is valid for this child
        const { data } = await supabase
          .from('authorized_pickups')
          .select('id, is_active, valid_from, valid_until, allowed_days')
          .eq('child_id', childId)
          .eq('id', personId)
          .single()

        if (!data || !data.is_active) return false

        // Check date validity
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        if (data.valid_from && todayStr < data.valid_from) return false
        if (data.valid_until && todayStr > data.valid_until) return false

        // Check allowed days
        if (data.allowed_days && data.allowed_days.length > 0) {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          const currentDay = dayNames[today.getDay()]
          if (!data.allowed_days.includes(currentDay)) return false
        }

        return true
      }

      if (personType === 'emergency_contact') {
        // Check if emergency contact is authorized for pickup
        const { data } = await supabase
          .from('emergency_contacts')
          .select('id, authorized_pickup')
          .eq('child_id', childId)
          .eq('id', personId)
          .single()

        return data?.authorized_pickup === true
      }

      return false
    } catch {
      return false
    }
  },

  /**
   * Get attendance by classroom with DCF ratios
   */
  async getTodayByClassroom(): Promise<TodayAttendanceByClassroom[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Get classrooms
    const { data: classrooms } = await supabase
      .from('classrooms')
      .select('id, name, capacity')
      .eq('organization_id', orgId)
      .eq('status', 'active')

    // Get children per classroom
    const { data: children } = await supabase
      .from('children')
      .select('id, classroom_id')
      .eq('organization_id', orgId)
      .eq('status', 'active')

    // Get today's attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('child_id, classroom_id, check_out_time, status')
      .eq('organization_id', orgId)
      .eq('date', today)

    const result: TodayAttendanceByClassroom[] = (classrooms || []).map(classroom => {
      const enrolledChildren = children?.filter(c => c.classroom_id === classroom.id) || []
      const classroomAttendance = attendance?.filter(a => a.classroom_id === classroom.id) || []

      const present = classroomAttendance.filter(a =>
        a.status === 'present' && !a.check_out_time
      ).length

      const checkedOut = classroomAttendance.filter(a => a.check_out_time).length

      return {
        classroom_id: classroom.id,
        classroom_name: classroom.name,
        classroom_capacity: classroom.capacity || 0,
        children_present: present,
        children_checked_out: checkedOut,
        total_enrolled: enrolledChildren.length,
        organization_id: orgId,
      }
    })

    return result
  },

  /**
   * Get expanded attendance record with all details
   */
  async getExpandedByDate(date: string): Promise<(AttendanceExpanded & {
    child: { first_name: string; last_name: string; photo_url: string | null };
    classroom: { name: string } | null;
  })[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        child:children(first_name, last_name, photo_url),
        classroom:classrooms(name)
      `)
      .eq('organization_id', orgId)
      .eq('date', date)
      .order('check_in_time', { ascending: true })

    if (error) throw error
    return (data || []) as (AttendanceExpanded & {
      child: { first_name: string; last_name: string; photo_url: string | null };
      classroom: { name: string } | null;
    })[]
  },
}

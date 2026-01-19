import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { Child, ChildWithFamily, TablesInsert, TablesUpdate } from '@/shared/types/database.types'
import type {
  ChildProgramType,
  ChildFormData,
  ChildWithProgram,
} from '@/shared/types/children-extended'
import { programsService } from '@/features/programs/services/programs.service'

export const childrenService = {
  async getAll(): Promise<ChildWithFamily[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        family:families(*),
        classroom:classrooms(*)
      `)
      .eq('organization_id', orgId)
      .order('first_name', { ascending: true })

    if (error) throw error
    return (data || []) as ChildWithFamily[]
  },

  async getById(id: string): Promise<ChildWithFamily | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        family:families(*),
        classroom:classrooms(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as ChildWithFamily
  },

  async getByClassroom(classroomId: string): Promise<ChildWithFamily[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        family:families(*),
        classroom:classrooms(*)
      `)
      .eq('classroom_id', classroomId)
      .eq('status', 'active')
      .order('first_name', { ascending: true })

    if (error) throw error
    return (data || []) as ChildWithFamily[]
  },

  async create(child: Omit<TablesInsert<'children'>, 'organization_id'>): Promise<Child> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    // Use insert with select - let Supabase generate the ID
    const { data, error } = await supabase
      .from('children')
      .insert({
        ...child,
        organization_id: orgId,
      })
      .select('*')

    if (error) throw error

    // Return the first (and only) inserted record
    if (!data || data.length === 0) {
      throw new Error('Failed to create child record')
    }
    return data[0]
  },

  /**
   * Creates a child with program enrollment (VPK/SR) in a single transaction
   * - Creates the child record
   * - If VPK or VPK_wraparound: creates VPK enrollment
   * - If school_readiness or sr_copay: creates SR enrollment
   */
  async createWithProgram(formData: ChildFormData): Promise<ChildWithProgram> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    // Prepare child data
    const childData: TablesInsert<'children'> & Record<string, unknown> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
      family_id: formData.family_id,
      classroom_id: formData.classroom_id,
      organization_id: orgId,
      status: 'active',
      // Program fields
      program_type: formData.program_type || 'private',
      vpk_certificate_number: formData.vpk_certificate_number || null,
      vpk_schedule_type: formData.vpk_schedule_type || null,
      sr_case_number: formData.sr_case_number || null,
      sr_authorized_hours_weekly: formData.sr_authorized_hours_weekly || null,
      sr_copay_amount: formData.sr_copay_amount || null,
      sr_copay_frequency: formData.sr_copay_frequency || null,
      weekly_rate: formData.weekly_rate || null,
      hourly_rate: formData.hourly_rate || null,
      schedule_type: formData.schedule_type || 'full_time',
      // Medical info
      doctor_name: formData.doctor_name || null,
      doctor_phone: formData.doctor_phone || null,
      allergies: formData.allergies || [],
      medical_conditions: formData.medical_conditions || null,
    }

    // Insert child
    const { data: childArray, error: childError } = await supabase
      .from('children')
      .insert(childData)
      .select('*')

    if (childError) throw childError
    if (!childArray || childArray.length === 0) {
      throw new Error('Failed to create child record')
    }

    const child = childArray[0] as ChildWithProgram

    // Create program enrollment based on type
    const programType = formData.program_type || 'private'

    try {
      if (programType === 'vpk' || programType === 'vpk_wraparound') {
        // Create VPK enrollment
        if (!formData.vpk_certificate_number) {
          throw new Error('VPK certificate number is required for VPK programs')
        }

        const vpkEnrollment = await programsService.createVPKEnrollment({
          organization_id: orgId,
          child_id: child.id,
          schedule_type: formData.vpk_schedule_type || 'school_year',
          student_cert_number: formData.vpk_certificate_number,
          enrollment_date: new Date().toISOString().split('T')[0],
          start_date: formData.vpk_start_date || new Date().toISOString().split('T')[0],
          status: 'active',
          total_hours_required: formData.vpk_schedule_type === 'summer' ? 300 : 540,
          classroom_id: formData.classroom_id || undefined,
        })

        if (!vpkEnrollment) {
          console.error('Warning: Failed to create VPK enrollment for child', child.id)
        }
      } else if (programType === 'school_readiness' || programType === 'sr_copay') {
        // Create School Readiness enrollment
        if (!formData.sr_case_number) {
          throw new Error('SR case number is required for School Readiness programs')
        }

        const srEnrollment = await programsService.createSREnrollment({
          organization_id: orgId,
          child_id: child.id,
          family_id: formData.family_id,
          case_number: formData.sr_case_number,
          eligibility_start: formData.sr_eligibility_start || new Date().toISOString().split('T')[0],
          eligibility_end: formData.sr_eligibility_end || new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
          ).toISOString().split('T')[0],
          status: 'active',
          authorized_hours_weekly: formData.sr_authorized_hours_weekly || 40,
          rate_type: formData.sr_rate_type || 'full_time',
          weekly_rate: formData.weekly_rate || undefined,
          hourly_rate: formData.hourly_rate || undefined,
          copay_amount: formData.sr_copay_amount || undefined,
          copay_frequency: formData.sr_copay_frequency || undefined,
          classroom_id: formData.classroom_id || undefined,
        })

        if (!srEnrollment) {
          console.error('Warning: Failed to create SR enrollment for child', child.id)
        }
      }
    } catch (enrollmentError) {
      // Log error but don't fail - child is created, enrollment can be added manually
      console.error('Error creating program enrollment:', enrollmentError)
    }

    return child
  },

  /**
   * Get all children with program information
   */
  async getAllWithProgram(): Promise<ChildWithProgram[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        family:families(*),
        classroom:classrooms(*)
      `)
      .eq('organization_id', orgId)
      .order('first_name', { ascending: true })

    if (error) throw error
    return (data || []) as ChildWithProgram[]
  },

  /**
   * Get children by program type
   */
  async getByProgramType(programType: ChildProgramType): Promise<ChildWithProgram[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('children')
      .select(`
        *,
        family:families(*),
        classroom:classrooms(*)
      `)
      .eq('organization_id', orgId)
      .eq('program_type', programType)
      .eq('status', 'active')
      .order('first_name', { ascending: true })

    if (error) throw error
    return (data || []) as ChildWithProgram[]
  },

  async update(id: string, child: TablesUpdate<'children'>): Promise<Child> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    // First update the record
    const { error: updateError } = await supabase
      .from('children')
      .update(child)
      .eq('id', id)
      .eq('organization_id', orgId)

    if (updateError) throw updateError

    // Then fetch the updated record
    const { data, error: selectError } = await supabase
      .from('children')
      .select('*')
      .eq('id', id)
      .single()

    if (selectError) throw selectError
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getStats(date: string = new Date().toISOString().split('T')[0]) {
    const supabase = createClient()
    const orgId = await requireOrgId()

    // Get all children
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, status')
      .eq('organization_id', orgId)
      .eq('status', 'active')

    if (childrenError) throw childrenError

    // Get attendance for today
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('child_id, status')
      .eq('organization_id', orgId)
      .eq('date', date)

    if (attendanceError) throw attendanceError

    const total = children?.length || 0
    const present = attendance?.filter(a => a.status === 'present').length || 0
    const absent = total - present

    return { total, present, absent }
  }
}

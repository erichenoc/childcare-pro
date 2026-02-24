import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type {
  ImmunizationRecord,
  ImmunizationRecordFormData,
  ImmunizationExemption,
  ImmunizationExemptionFormData,
  ImmunizationCompliance,
  ImmunizationReminder,
  DcfVaccineRequirement,
  OrganizationImmunizationSummary,
  ChildImmunizationStatus,
  OverdueImmunization,
  ChildImmunizationReport,
  VaccineStatusByChild,
  ImmunizationFilters,
} from '@/shared/types/immunizations'

export const immunizationsService = {
  // ==================== DCF Vaccine Requirements ====================

  async getVaccineRequirements(): Promise<DcfVaccineRequirement[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('dcf_vaccine_requirements')
      .select('*')
      .eq('is_active', true)
      .order('min_age_months', { ascending: true })

    if (error) throw error
    return (data || []) as DcfVaccineRequirement[]
  },

  // ==================== Immunization Records ====================

  async getRecordsByChild(childId: string): Promise<ImmunizationRecord[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('immunization_records')
      .select(`
        *,
        verifier:profiles!verified_by(id, first_name, last_name)
      `)
      .eq('child_id', childId)
      .order('date_administered', { ascending: false })

    if (error) throw error
    return (data || []) as ImmunizationRecord[]
  },

  async getAllRecords(): Promise<ImmunizationRecord[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('immunization_records')
      .select(`
        *,
        child:children(id, first_name, last_name, date_of_birth, classroom_id),
        verifier:profiles!verified_by(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as ImmunizationRecord[]
  },

  async createRecord(record: ImmunizationRecordFormData): Promise<ImmunizationRecord> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('immunization_records')
      .insert({
        ...record,
        organization_id: orgId,
        status: record.status || 'pending',
      })
      .select('*')
      .single()

    if (error) throw error
    return data as ImmunizationRecord
  },

  async updateRecord(id: string, updates: Partial<ImmunizationRecordFormData>): Promise<ImmunizationRecord> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('immunization_records')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as ImmunizationRecord
  },

  async verifyRecord(id: string, notes?: string): Promise<ImmunizationRecord> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('immunization_records')
      .update({
        status: 'verified',
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as ImmunizationRecord
  },

  async deleteRecord(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('immunization_records')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ==================== Exemptions ====================

  async getExemptionsByChild(childId: string): Promise<ImmunizationExemption[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('immunization_exemptions')
      .select(`
        *,
        approver:profiles!approved_by(id, first_name, last_name)
      `)
      .eq('child_id', childId)
      .order('start_date', { ascending: false })

    if (error) throw error
    return (data || []) as ImmunizationExemption[]
  },

  async getAllExemptions(): Promise<ImmunizationExemption[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('immunization_exemptions')
      .select(`
        *,
        child:children(id, first_name, last_name),
        approver:profiles!approved_by(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('start_date', { ascending: false })

    if (error) throw error
    return (data || []) as ImmunizationExemption[]
  },

  async createExemption(exemption: ImmunizationExemptionFormData): Promise<ImmunizationExemption> {
    const supabase = createClient()
    const orgId = await requireOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('immunization_exemptions')
      .insert({
        ...exemption,
        organization_id: orgId,
        status: 'active',
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) throw error
    return data as ImmunizationExemption
  },

  async revokeExemption(id: string): Promise<ImmunizationExemption> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('immunization_exemptions')
      .update({ status: 'revoked' })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as ImmunizationExemption
  },

  // ==================== Compliance ====================

  async getComplianceByChild(childId: string): Promise<ImmunizationCompliance | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('immunization_compliance')
      .select('*')
      .eq('child_id', childId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as ImmunizationCompliance
  },

  async getAllCompliance(filters?: ImmunizationFilters): Promise<ChildImmunizationStatus[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    let query = supabase
      .from('children')
      .select(`
        id,
        organization_id,
        first_name,
        last_name,
        date_of_birth,
        classroom_id,
        immunization_compliance(*)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active')

    // Apply filters
    if (filters?.classroom_id) {
      query = query.eq('classroom_id', filters.classroom_id)
    }

    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order('last_name', { ascending: true })

    if (error) throw error

    // Transform data
    return (data || []).map(child => {
      const compliance = Array.isArray(child.immunization_compliance)
        ? child.immunization_compliance[0]
        : child.immunization_compliance

      const birthDate = new Date(child.date_of_birth)
      const now = new Date()
      const ageMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 +
        (now.getMonth() - birthDate.getMonth())

      return {
        child_id: child.id,
        organization_id: child.organization_id,
        first_name: child.first_name,
        last_name: child.last_name,
        date_of_birth: child.date_of_birth,
        age_months: ageMonths,
        compliance_status: compliance?.compliance_status || 'incomplete',
        vaccines_complete: compliance?.vaccines_complete || 0,
        vaccines_required: compliance?.vaccines_required || 0,
        vaccines_overdue: compliance?.vaccines_overdue || 0,
        next_due_vaccine: compliance?.next_due_vaccine || null,
        next_due_date: compliance?.next_due_date || null,
        provisional_enrollment: compliance?.provisional_enrollment || false,
        provisional_end_date: compliance?.provisional_end_date || null,
        last_checked_at: compliance?.last_checked_at || null,
      } as ChildImmunizationStatus
    }).filter(child => {
      if (filters?.status && child.compliance_status !== filters.status) {
        return false
      }
      if (filters?.show_provisional === false && child.provisional_enrollment) {
        return false
      }
      return true
    })
  },

  async setProvisionalEnrollment(
    childId: string,
    endDate: string,
    notes?: string
  ): Promise<ImmunizationCompliance> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const { data, error } = await supabase
      .from('immunization_compliance')
      .upsert({
        organization_id: orgId,
        child_id: childId,
        provisional_enrollment: true,
        provisional_end_date: endDate,
        provisional_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) throw error
    return data as ImmunizationCompliance
  },

  // ==================== Summary & Reports ====================

  async getOrganizationSummary(): Promise<OrganizationImmunizationSummary> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    // Get all active children with compliance status
    const { data: children, error } = await supabase
      .from('children')
      .select(`
        id,
        immunization_compliance(compliance_status, provisional_enrollment)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active')

    if (error) throw error

    const total = children?.length || 0
    let compliant = 0
    let incomplete = 0
    let overdue = 0
    let exempt = 0
    let provisional = 0

    children?.forEach(child => {
      const compliance = Array.isArray(child.immunization_compliance)
        ? child.immunization_compliance[0]
        : child.immunization_compliance

      if (compliance?.provisional_enrollment) {
        provisional++
      }

      switch (compliance?.compliance_status) {
        case 'compliant':
          compliant++
          break
        case 'overdue':
          overdue++
          break
        case 'exempt':
          exempt++
          break
        default:
          incomplete++
      }
    })

    return {
      total_children: total,
      fully_compliant: compliant,
      incomplete,
      overdue,
      exempt,
      provisional,
      compliance_rate: total > 0 ? Math.round(((compliant + exempt) / total) * 100) : 0,
    }
  },

  async getOverdueImmunizations(): Promise<OverdueImmunization[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    // Get children with incomplete vaccinations
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select(`
        id,
        first_name,
        last_name,
        date_of_birth,
        organization_id
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active')

    if (childrenError) throw childrenError

    const { data: requirements, error: reqError } = await supabase
      .from('dcf_vaccine_requirements')
      .select('*')
      .eq('is_active', true)

    if (reqError) throw reqError

    const { data: records, error: recError } = await supabase
      .from('immunization_records')
      .select('child_id, vaccine_code')
      .eq('organization_id', orgId)
      .in('status', ['verified', 'pending'])

    if (recError) throw recError

    const { data: exemptions, error: exError } = await supabase
      .from('immunization_exemptions')
      .select('child_id, vaccine_codes')
      .eq('organization_id', orgId)
      .eq('status', 'active')

    if (exError) throw exError

    // Calculate overdue immunizations
    const overdue: OverdueImmunization[] = []
    const now = new Date()

    children?.forEach(child => {
      const birthDate = new Date(child.date_of_birth)
      const ageMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 +
        (now.getMonth() - birthDate.getMonth())

      // Get records for this child
      const childRecords = records?.filter(r => r.child_id === child.id) || []
      const recordCounts: Record<string, number> = {}
      childRecords.forEach(r => {
        if (r.vaccine_code) {
          recordCounts[r.vaccine_code] = (recordCounts[r.vaccine_code] || 0) + 1
        }
      })

      // Get exemptions for this child
      const childExemptions = exemptions?.filter(e => e.child_id === child.id) || []
      const exemptVaccines = new Set<string>()
      childExemptions.forEach(e => {
        (e.vaccine_codes as string[] | null)?.forEach((code: string) => exemptVaccines.add(code))
      })

      // Check each required vaccine
      requirements?.forEach(req => {
        if (ageMonths >= req.min_age_months &&
          (req.max_age_months === null || ageMonths <= req.max_age_months)) {
          const dosesGiven = recordCounts[req.vaccine_code] || 0
          const isExempt = exemptVaccines.has(req.vaccine_code)

          if (!isExempt && dosesGiven < req.required_doses) {
            overdue.push({
              organization_id: child.organization_id,
              child_id: child.id,
              child_name: `${child.first_name} ${child.last_name}`,
              date_of_birth: child.date_of_birth,
              vaccine_name: req.vaccine_name,
              vaccine_code: req.vaccine_code,
              required_doses: req.required_doses,
              doses_given: dosesGiven,
              doses_needed: req.required_doses - dosesGiven,
            })
          }
        }
      })
    })

    return overdue
  },

  async getChildReport(childId: string): Promise<ChildImmunizationReport> {
    const supabase = createClient()

    // Get child info
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, first_name, last_name, date_of_birth')
      .eq('id', childId)
      .single()

    if (childError) throw childError

    // Calculate age
    const birthDate = new Date(child.date_of_birth)
    const now = new Date()
    const ageMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 +
      (now.getMonth() - birthDate.getMonth())

    // Get all data in parallel
    const [records, exemptions, compliance, reminders, requirements] = await Promise.all([
      this.getRecordsByChild(childId),
      this.getExemptionsByChild(childId),
      this.getComplianceByChild(childId),
      this.getRemindersByChild(childId),
      this.getVaccineRequirements(),
    ])

    // Build vaccine status
    const vaccineStatus: VaccineStatusByChild[] = requirements
      .filter(req => ageMonths >= req.min_age_months &&
        (req.max_age_months === null || ageMonths <= req.max_age_months))
      .map(req => {
        const vaccineRecords = records.filter(r => r.vaccine_code === req.vaccine_code)
        const isExempt = exemptions.some(e =>
          e.status === 'active' && e.vaccine_codes?.includes(req.vaccine_code)
        )

        return {
          vaccine_code: req.vaccine_code,
          vaccine_name: req.vaccine_name,
          required_doses: req.required_doses,
          doses_received: vaccineRecords.length,
          last_dose_date: vaccineRecords[0]?.date_administered || null,
          is_complete: vaccineRecords.length >= req.required_doses,
          is_exempt: isExempt,
          next_dose_due: vaccineRecords.length < req.required_doses && !isExempt
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : null,
        }
      })

    return {
      child: {
        id: child.id,
        first_name: child.first_name,
        last_name: child.last_name,
        date_of_birth: child.date_of_birth,
        age_months: ageMonths,
      },
      compliance,
      records,
      exemptions,
      vaccines_status: vaccineStatus,
      reminders,
    }
  },

  // ==================== Reminders ====================

  async getRemindersByChild(childId: string): Promise<ImmunizationReminder[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('immunization_reminders')
      .select('*')
      .eq('child_id', childId)
      .order('due_date', { ascending: true })

    if (error) throw error
    return (data || []) as ImmunizationReminder[]
  },

  async getUpcomingReminders(daysAhead: number = 30): Promise<ImmunizationReminder[]> {
    const supabase = createClient()
    const orgId = await requireOrgId()

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('immunization_reminders')
      .select(`
        *,
        child:children(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .lte('due_date', futureDate.toISOString().split('T')[0])
      .order('due_date', { ascending: true })

    if (error) throw error
    return (data || []) as ImmunizationReminder[]
  },

  async markReminderSent(id: string, sentTo: string[]): Promise<ImmunizationReminder> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('immunization_reminders')
      .update({
        reminder_sent: true,
        reminder_sent_at: new Date().toISOString(),
        reminder_sent_to: sentTo,
        status: 'sent',
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as ImmunizationReminder
  },

  async dismissReminder(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('immunization_reminders')
      .update({ status: 'dismissed' })
      .eq('id', id)

    if (error) throw error
  },
}

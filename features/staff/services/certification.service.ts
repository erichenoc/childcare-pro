import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { StaffCertification, CertificationFormData, StaffComplianceStatus } from '@/shared/types/staff-certifications'

export interface CertificationWithProfile extends StaffCertification {
  profile?: {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
  }
}

export interface ComplianceResult {
  is_compliant: boolean
  missing_requirements: string[]
  expiring_soon: string[]
  compliance_score: number
}

// Certification type labels
export const CERTIFICATION_TYPE_LABELS: Record<string, string> = {
  '45_hour_dcf': '45-Hour DCF Training',
  '40_hour_initial': '40-Hour Initial Training',
  'cda': 'CDA Credential',
  'cpr_first_aid': 'CPR/First Aid',
  'child_abuse_prevention': 'Child Abuse Prevention',
  'annual_in_service': 'Annual In-Service Training',
  'background_screening': 'Level 2 Background Screening',
  'health_physical': 'Health/Physical Exam',
  'safe_sleep': 'Safe Sleep Training',
  'early_literacy': 'Early Literacy Training',
  'medication_admin': 'Medication Administration',
  'special_needs': 'Special Needs Training',
  'other': 'Other',
}

// Required hours by type
export const REQUIRED_HOURS: Record<string, number> = {
  '45_hour_dcf': 45,
  '40_hour_initial': 40,
  'annual_in_service': 10,
  'cpr_first_aid': 8,
  'child_abuse_prevention': 1,
  'safe_sleep': 1,
}

export const certificationService = {
  // Get all certifications for a staff member
  async getByProfileId(profileId: string): Promise<StaffCertification[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('staff_certifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get all certifications for organization
  async getAll(): Promise<CertificationWithProfile[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('staff_certifications')
      .select(`
        *,
        profile:profiles (
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get expiring certifications
  async getExpiring(daysAhead: number = 30): Promise<CertificationWithProfile[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('staff_certifications')
      .select(`
        *,
        profile:profiles (
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('organization_id', orgId)
      .not('expiration_date', 'is', null)
      .lte('expiration_date', futureDate.toISOString().split('T')[0])
      .gte('expiration_date', new Date().toISOString().split('T')[0])
      .order('expiration_date', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get expired certifications
  async getExpired(): Promise<CertificationWithProfile[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('staff_certifications')
      .select(`
        *,
        profile:profiles (
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('organization_id', orgId)
      .not('expiration_date', 'is', null)
      .lt('expiration_date', new Date().toISOString().split('T')[0])
      .order('expiration_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Create new certification
  async create(profileId: string, data: CertificationFormData): Promise<StaffCertification> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data: cert, error } = await supabase
      .from('staff_certifications')
      .insert({
        organization_id: orgId,
        profile_id: profileId,
        certification_type: data.certification_type,
        certification_name: data.certification_name,
        issuing_organization: data.issuing_authority,
        credential_number: data.certificate_number,
        completion_date: data.issue_date,
        expiration_date: data.expiration_date,
        hours_completed: data.hours_completed,
        certificate_url: data.document_url,
        notes: data.notes,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    // Update profile fields based on certification type
    await this.updateProfileCertificationFields(profileId, data.certification_type)

    return cert
  },

  // Update certification
  async update(id: string, data: Partial<CertificationFormData>): Promise<StaffCertification> {
    const supabase = createClient()

    const updateData: Record<string, unknown> = {}
    if (data.certification_name) updateData.certification_name = data.certification_name
    if (data.issuing_authority !== undefined) updateData.issuing_organization = data.issuing_authority
    if (data.certificate_number !== undefined) updateData.credential_number = data.certificate_number
    if (data.issue_date !== undefined) updateData.completion_date = data.issue_date
    if (data.expiration_date !== undefined) updateData.expiration_date = data.expiration_date
    if (data.hours_completed !== undefined) updateData.hours_completed = data.hours_completed
    if (data.document_url !== undefined) updateData.certificate_url = data.document_url
    if (data.notes !== undefined) updateData.notes = data.notes

    const { data: cert, error } = await supabase
      .from('staff_certifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return cert
  },

  // Delete certification
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('staff_certifications')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Verify certification
  async verify(id: string, notes?: string): Promise<StaffCertification> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('staff_certifications')
      .update({
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
        status: 'active',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Check staff compliance
  async checkCompliance(profileId: string): Promise<ComplianceResult> {
    const supabase = createClient()

    const { data, error } = await supabase
      .rpc('check_staff_compliance', { p_profile_id: profileId })

    if (error) {
      // Fallback if RPC not available
      return this.calculateComplianceLocally(profileId)
    }

    return data?.[0] || {
      is_compliant: false,
      missing_requirements: [],
      expiring_soon: [],
      compliance_score: 0,
    }
  },

  // Local compliance calculation fallback
  async calculateComplianceLocally(profileId: string): Promise<ComplianceResult> {
    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (!profile) {
      return {
        is_compliant: false,
        missing_requirements: ['Profile not found'],
        expiring_soon: [],
        compliance_score: 0,
      }
    }

    const missing: string[] = []
    const expiring: string[] = []
    let score = 100

    const isDirector = profile.role === 'director' || profile.role === 'owner' || profile.is_director

    // Check 45-hour training (required for directors)
    if (isDirector && !profile.has_45_hours_training) {
      missing.push('45-Hour DCF Training (Required for Directors)')
      score -= 30
    }

    // Check 40-hour initial training
    if (!profile.has_40_hours_initial) {
      const hireDate = profile.hire_date ? new Date(profile.hire_date) : null
      if (hireDate) {
        const daysSinceHire = Math.floor((Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceHire > 365) {
          missing.push('40-Hour Initial Training (OVERDUE)')
          score -= 25
        } else if (daysSinceHire > 270) {
          expiring.push('40-Hour Initial Training (Due within 90 days)')
          score -= 10
        }
      }
    }

    // Check background check
    if (!profile.background_check_clear) {
      missing.push('Background Check')
      score -= 20
    }

    // Check CDA expiration
    if (profile.has_cda_credential && profile.cda_expiration_date) {
      const expDate = new Date(profile.cda_expiration_date)
      const daysUntilExp = Math.floor((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysUntilExp < 0) {
        missing.push('CDA Credential (EXPIRED)')
        score -= 15
      } else if (daysUntilExp < 30) {
        expiring.push('CDA Credential (Expires within 30 days)')
        score -= 5
      }
    }

    // Check annual in-service training
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    const fiscalYear = currentMonth >= 6 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`

    const hoursCompleted = profile.annual_training_hours_completed || 0
    if (profile.annual_training_fiscal_year !== fiscalYear || hoursCompleted < 10) {
      if (currentMonth >= 3 && currentMonth <= 5) {
        expiring.push(`Annual In-Service (${hoursCompleted}/10 hours)`)
        score -= 5
      }
    }

    return {
      is_compliant: missing.length === 0,
      missing_requirements: missing,
      expiring_soon: expiring,
      compliance_score: Math.max(0, score),
    }
  },

  // Get compliance stats for organization
  async getComplianceStats() {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get all active staff
    const { data: staff } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, has_45_hours_training, has_40_hours_initial, has_cda_credential, background_check_clear')
      .eq('organization_id', orgId)
      .in('role', ['teacher', 'assistant', 'lead_teacher', 'director', 'owner'])
      .eq('status', 'active')

    // Get certifications
    const { data: certs } = await supabase
      .from('staff_certifications')
      .select('id, profile_id, certification_type, expiration_date, status')
      .eq('organization_id', orgId)

    const totalStaff = staff?.length || 0
    let compliantCount = 0
    let expiringSoon = 0
    let missingTraining = 0

    for (const member of staff || []) {
      const compliance = await this.calculateComplianceLocally(member.id)
      if (compliance.is_compliant) compliantCount++
      if (compliance.expiring_soon.length > 0) expiringSoon++
      if (compliance.missing_requirements.length > 0) missingTraining++
    }

    // Count expired certs
    const today = new Date().toISOString().split('T')[0]
    const expiredCerts = certs?.filter(c => c.expiration_date && c.expiration_date < today).length || 0

    return {
      totalStaff,
      compliantCount,
      complianceRate: totalStaff > 0 ? Math.round((compliantCount / totalStaff) * 100) : 0,
      expiringSoon,
      missingTraining,
      expiredCerts,
    }
  },

  // Helper to update profile certification flags
  async updateProfileCertificationFields(profileId: string, certType: string): Promise<void> {
    const supabase = createClient()
    const updates: Record<string, unknown> = {}

    switch (certType) {
      case '45_hour_dcf':
        updates.has_45_hours_training = true
        updates.training_45_hours_completion_date = new Date().toISOString().split('T')[0]
        break
      case '40_hour_initial':
        updates.has_40_hours_initial = true
        updates.initial_training_completion_date = new Date().toISOString().split('T')[0]
        break
      case 'cda':
        updates.has_cda_credential = true
        break
      case 'background_screening':
        updates.background_check_clear = true
        updates.background_check_date = new Date().toISOString().split('T')[0]
        break
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId)
    }
  },

  // Log annual in-service hours
  async logInServiceHours(profileId: string, hours: number, description: string): Promise<StaffCertification> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Create in-service record
    const cert = await this.create(profileId, {
      certification_type: 'annual_in_service',
      certification_name: `In-Service Training: ${description}`,
      hours_completed: hours,
      issue_date: new Date().toISOString().split('T')[0],
    })

    // Update profile annual hours
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    const fiscalYear = currentMonth >= 6 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`

    // Get current hours
    const { data: profile } = await supabase
      .from('profiles')
      .select('annual_training_hours_completed, annual_training_fiscal_year')
      .eq('id', profileId)
      .single()

    let currentHours = 0
    if (profile?.annual_training_fiscal_year === fiscalYear) {
      currentHours = profile.annual_training_hours_completed || 0
    }

    await supabase
      .from('profiles')
      .update({
        annual_training_hours_completed: currentHours + hours,
        annual_training_fiscal_year: fiscalYear,
      })
      .eq('id', profileId)

    return cert
  },
}

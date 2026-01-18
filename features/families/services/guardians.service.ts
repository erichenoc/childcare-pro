import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { Guardian, GuardianChild } from '@/shared/types/guardians'

export interface GuardianWithChildren extends Guardian {
  guardian_children?: (GuardianChild & {
    child?: {
      id: string
      first_name: string
      last_name: string
      date_of_birth: string | null
    }
  })[]
}

export interface GuardianFormData {
  family_id: string
  first_name: string
  last_name: string
  relationship_type: string
  relationship_to_children?: string
  email?: string
  phone: string
  secondary_phone?: string
  work_phone?: string
  preferred_contact_method?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  employer_name?: string
  employer_phone?: string
  employer_address?: string
  occupation?: string
  work_schedule?: string
  photo_url?: string
  id_document_type?: string
  id_document_number?: string
  id_document_url?: string
  id_expiration_date?: string
  is_primary_contact?: boolean
  is_authorized_pickup?: boolean
  can_make_decisions?: boolean
  receives_invoices?: boolean
  receives_notifications?: boolean
  receives_daily_reports?: boolean
  custody_status?: string
  custody_notes?: string
  custody_documents_url?: string
  emergency_priority?: number
  notes?: string
}

export const RELATIONSHIP_TYPES = [
  { value: 'father', label: 'Padre' },
  { value: 'mother', label: 'Madre' },
  { value: 'stepfather', label: 'Padrastro' },
  { value: 'stepmother', label: 'Madrastra' },
  { value: 'legal_guardian', label: 'Tutor Legal' },
  { value: 'grandparent', label: 'Abuelo/a' },
  { value: 'aunt', label: 'Tía' },
  { value: 'uncle', label: 'Tío' },
  { value: 'foster_parent', label: 'Padre/Madre de Acogida' },
  { value: 'other', label: 'Otro' },
]

export const ID_DOCUMENT_TYPES = [
  { value: 'drivers_license', label: 'Licencia de Conducir' },
  { value: 'passport', label: 'Pasaporte' },
  { value: 'state_id', label: 'ID Estatal' },
  { value: 'military_id', label: 'ID Militar' },
]

export const CUSTODY_STATUSES = [
  { value: 'full', label: 'Custodia Total' },
  { value: 'joint', label: 'Custodia Compartida' },
  { value: 'none', label: 'Sin Custodia' },
  { value: 'restricted', label: 'Custodia Restringida' },
]

export const guardiansService = {
  // Get all guardians for a family
  async getByFamilyId(familyId: string): Promise<GuardianWithChildren[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('guardians')
      .select(`
        *,
        guardian_children (
          *,
          child:children (
            id,
            first_name,
            last_name,
            date_of_birth
          )
        )
      `)
      .eq('family_id', familyId)
      .eq('status', 'active')
      .order('emergency_priority', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get all guardians for organization
  async getAll(): Promise<GuardianWithChildren[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('guardians')
      .select(`
        *,
        guardian_children (
          *,
          child:children (
            id,
            first_name,
            last_name,
            date_of_birth
          )
        )
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get guardian by ID
  async getById(id: string): Promise<GuardianWithChildren | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('guardians')
      .select(`
        *,
        guardian_children (
          *,
          child:children (
            id,
            first_name,
            last_name,
            date_of_birth
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Create guardian
  async create(data: GuardianFormData): Promise<Guardian> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data: guardian, error } = await supabase
      .from('guardians')
      .insert({
        organization_id: orgId,
        family_id: data.family_id,
        first_name: data.first_name,
        last_name: data.last_name,
        relationship_type: data.relationship_type,
        relationship_to_children: data.relationship_to_children,
        email: data.email,
        phone: data.phone,
        secondary_phone: data.secondary_phone,
        work_phone: data.work_phone,
        preferred_contact_method: data.preferred_contact_method || 'phone',
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        employer_name: data.employer_name,
        employer_phone: data.employer_phone,
        employer_address: data.employer_address,
        occupation: data.occupation,
        work_schedule: data.work_schedule,
        photo_url: data.photo_url,
        id_document_type: data.id_document_type,
        id_document_number: data.id_document_number,
        id_document_url: data.id_document_url,
        id_expiration_date: data.id_expiration_date,
        is_primary_contact: data.is_primary_contact ?? false,
        is_authorized_pickup: data.is_authorized_pickup ?? true,
        can_make_decisions: data.can_make_decisions ?? true,
        receives_invoices: data.receives_invoices ?? false,
        receives_notifications: data.receives_notifications ?? true,
        receives_daily_reports: data.receives_daily_reports ?? true,
        custody_status: data.custody_status,
        custody_notes: data.custody_notes,
        custody_documents_url: data.custody_documents_url,
        emergency_priority: data.emergency_priority ?? 1,
        notes: data.notes,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error
    return guardian
  },

  // Update guardian
  async update(id: string, data: Partial<GuardianFormData>): Promise<Guardian> {
    const supabase = createClient()
    const { data: guardian, error } = await supabase
      .from('guardians')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return guardian
  },

  // Delete (soft delete)
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('guardians')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (error) throw error
  },

  // Link guardian to child
  async linkToChild(guardianId: string, childId: string, relationship: string, isAuthorizedPickup: boolean = true): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('guardian_children')
      .insert({
        guardian_id: guardianId,
        child_id: childId,
        relationship,
        is_authorized_pickup: isAuthorizedPickup,
      })

    if (error) throw error
  },

  // Unlink guardian from child
  async unlinkFromChild(guardianId: string, childId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('guardian_children')
      .delete()
      .eq('guardian_id', guardianId)
      .eq('child_id', childId)

    if (error) throw error
  },

  // Update pickup authorization for child
  async updatePickupAuthorization(guardianId: string, childId: string, isAuthorized: boolean): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('guardian_children')
      .update({ is_authorized_pickup: isAuthorized })
      .eq('guardian_id', guardianId)
      .eq('child_id', childId)

    if (error) throw error
  },

  // Get guardians for a specific child
  async getByChildId(childId: string): Promise<Guardian[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('guardian_children')
      .select(`
        *,
        guardian:guardians (*)
      `)
      .eq('child_id', childId)

    if (error) throw error

    return data?.map(gc => ({
      ...gc.guardian,
      is_authorized_pickup_for_child: gc.is_authorized_pickup,
      relationship_for_child: gc.relationship,
    })) || []
  },

  // Get primary contact for family
  async getPrimaryContact(familyId: string): Promise<Guardian | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('guardians')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_primary_contact', true)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Set primary contact
  async setPrimaryContact(familyId: string, guardianId: string): Promise<void> {
    const supabase = createClient()

    // First, unset all primary contacts for this family
    await supabase
      .from('guardians')
      .update({ is_primary_contact: false })
      .eq('family_id', familyId)

    // Then set the new primary contact
    const { error } = await supabase
      .from('guardians')
      .update({ is_primary_contact: true })
      .eq('id', guardianId)

    if (error) throw error
  },
}

import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { AuthorizedPickup, PickupValidationResult } from '@/shared/types/guardians'

export interface AuthorizedPickupWithChild extends AuthorizedPickup {
  child?: {
    id: string
    first_name: string
    last_name: string
    family_id: string
  }
}

export interface AuthorizedPickupFormData {
  child_id: string
  name: string
  relationship: string
  phone: string
  photo_url: string
  id_document_type: string
  id_document_number: string
  id_document_url: string
  valid_from?: string
  valid_until?: string
  restrictions?: string
  allowed_days?: string[]
  time_restrictions?: string
  verification_method?: string
  notes?: string
}

export const ALLOWED_DAYS_OPTIONS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
]

export const VERIFICATION_METHODS = [
  { value: 'in_person', label: 'En Persona' },
  { value: 'video_call', label: 'Videollamada' },
  { value: 'document_only', label: 'Solo Documentos' },
]

export const authorizedPickupsService = {
  // Get all authorized pickups for a child
  async getByChildId(childId: string): Promise<AuthorizedPickup[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('authorized_pickups')
      .select('*')
      .eq('child_id', childId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get all authorized pickups for organization
  async getAll(): Promise<AuthorizedPickupWithChild[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('authorized_pickups')
      .select(`
        *,
        child:children (
          id,
          first_name,
          last_name,
          family_id
        )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get authorized pickup by ID
  async getById(id: string): Promise<AuthorizedPickupWithChild | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('authorized_pickups')
      .select(`
        *,
        child:children (
          id,
          first_name,
          last_name,
          family_id
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

  // Create authorized pickup
  async create(data: AuthorizedPickupFormData): Promise<AuthorizedPickup> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: pickup, error } = await supabase
      .from('authorized_pickups')
      .insert({
        organization_id: orgId,
        child_id: data.child_id,
        name: data.name,
        relationship: data.relationship,
        phone: data.phone,
        photo_url: data.photo_url,
        id_document_type: data.id_document_type,
        id_document_number: data.id_document_number,
        id_document_url: data.id_document_url,
        valid_from: data.valid_from || new Date().toISOString().split('T')[0],
        valid_until: data.valid_until,
        restrictions: data.restrictions,
        allowed_days: data.allowed_days,
        time_restrictions: data.time_restrictions,
        verification_method: data.verification_method,
        notes: data.notes,
        is_active: true,
        added_by: user?.id,
      })
      .select()
      .single()

    if (error) throw error
    return pickup
  },

  // Update authorized pickup
  async update(id: string, data: Partial<AuthorizedPickupFormData>): Promise<AuthorizedPickup> {
    const supabase = createClient()
    const { data: pickup, error } = await supabase
      .from('authorized_pickups')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return pickup
  },

  // Deactivate (soft delete)
  async deactivate(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('authorized_pickups')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },

  // Reactivate
  async reactivate(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('authorized_pickups')
      .update({ is_active: true })
      .eq('id', id)

    if (error) throw error
  },

  // Verify pickup person
  async verify(id: string, notes?: string): Promise<AuthorizedPickup> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('authorized_pickups')
      .update({
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Record pickup usage
  async recordPickup(id: string): Promise<void> {
    const supabase = createClient()
    const { data: current } = await supabase
      .from('authorized_pickups')
      .select('times_used')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('authorized_pickups')
      .update({
        times_used: (current?.times_used || 0) + 1,
        last_pickup_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
  },

  // Validate if person is authorized to pick up child
  async validatePickup(
    childId: string,
    personType: 'guardian' | 'authorized' | 'emergency_contact',
    personId: string
  ): Promise<PickupValidationResult> {
    const supabase = createClient()

    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('validate_pickup_person', {
        p_child_id: childId,
        p_person_type: personType,
        p_person_id: personId,
      })

    if (!rpcError && rpcData?.[0]) {
      return {
        is_valid: rpcData[0].is_valid,
        person_name: rpcData[0].person_name,
        relationship: rpcData[0].relationship,
        photo_url: rpcData[0].photo_url,
        restrictions: rpcData[0].restrictions,
        message: rpcData[0].message,
      }
    }

    // Fallback to local validation
    if (personType === 'authorized') {
      const pickup = await this.getById(personId)
      if (!pickup) {
        return {
          is_valid: false,
          person_name: null,
          relationship: null,
          photo_url: null,
          restrictions: null,
          message: 'Persona autorizada no encontrada',
        }
      }

      const isValid = pickup.is_active &&
        (!pickup.valid_until || new Date(pickup.valid_until) >= new Date())

      return {
        is_valid: isValid,
        person_name: pickup.name,
        relationship: pickup.relationship,
        photo_url: pickup.photo_url,
        restrictions: pickup.restrictions,
        message: isValid ? 'Autorizado para recoger' : 'Autorización expirada o inactiva',
      }
    }

    return {
      is_valid: false,
      person_name: null,
      relationship: null,
      photo_url: null,
      restrictions: null,
      message: 'Tipo de persona no válido',
    }
  },

  // Get all authorized people for a child (combined)
  async getAllAuthorizedForChild(childId: string): Promise<{
    person_id: string
    person_type: string
    name: string
    relationship: string
    phone: string
    photo_url: string | null
    has_photo: boolean
    has_id: boolean
    restrictions: string | null
  }[]> {
    const supabase = createClient()

    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_authorized_pickups_for_child', { p_child_id: childId })

    if (!rpcError && rpcData) {
      return rpcData
    }

    // Fallback: just get authorized pickups
    const pickups = await this.getByChildId(childId)
    return pickups
      .filter(p => p.is_active && (!p.valid_until || new Date(p.valid_until) >= new Date()))
      .map(p => ({
        person_id: p.id,
        person_type: 'authorized',
        name: p.name,
        relationship: p.relationship,
        phone: p.phone,
        photo_url: p.photo_url,
        has_photo: !!p.photo_url,
        has_id: !!p.id_document_url,
        restrictions: p.restrictions,
      }))
  },

  // Get expired authorizations
  async getExpired(): Promise<AuthorizedPickupWithChild[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('authorized_pickups')
      .select(`
        *,
        child:children (
          id,
          first_name,
          last_name,
          family_id
        )
      `)
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .not('valid_until', 'is', null)
      .lt('valid_until', today)

    if (error) throw error
    return data || []
  },

  // Get expiring soon (within 30 days)
  async getExpiringSoon(days: number = 30): Promise<AuthorizedPickupWithChild[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('authorized_pickups')
      .select(`
        *,
        child:children (
          id,
          first_name,
          last_name,
          family_id
        )
      `)
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .not('valid_until', 'is', null)
      .gte('valid_until', today.toISOString().split('T')[0])
      .lte('valid_until', futureDate.toISOString().split('T')[0])

    if (error) throw error
    return data || []
  },
}

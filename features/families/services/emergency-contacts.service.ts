import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type { EmergencyContact } from '@/shared/types/guardians'

export interface EmergencyContactWithChild extends EmergencyContact {
  child?: {
    id: string
    first_name: string
    last_name: string
    family_id: string
  }
}

export interface EmergencyContactFormData {
  child_id: string
  name: string
  relationship: string
  phone: string
  secondary_phone?: string
  email?: string
  priority_order: number
  is_authorized_pickup?: boolean
  photo_url?: string
  id_document_url?: string
  availability_notes?: string
  notes?: string
}

export const COMMON_RELATIONSHIPS = [
  { value: 'grandmother', label: 'Abuela' },
  { value: 'grandfather', label: 'Abuelo' },
  { value: 'aunt', label: 'Tía' },
  { value: 'uncle', label: 'Tío' },
  { value: 'cousin', label: 'Primo/a' },
  { value: 'sibling', label: 'Hermano/a' },
  { value: 'neighbor', label: 'Vecino/a' },
  { value: 'family_friend', label: 'Amigo de la Familia' },
  { value: 'babysitter', label: 'Niñera/Cuidador' },
  { value: 'other', label: 'Otro' },
]

export const emergencyContactsService = {
  // Get all emergency contacts for a child
  async getByChildId(childId: string): Promise<EmergencyContact[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('child_id', childId)
      .eq('status', 'active')
      .order('priority_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get all emergency contacts for organization
  async getAll(): Promise<EmergencyContactWithChild[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('emergency_contacts')
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
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get emergency contact by ID
  async getById(id: string): Promise<EmergencyContactWithChild | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('emergency_contacts')
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

  // Create emergency contact
  async create(data: EmergencyContactFormData): Promise<EmergencyContact> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data: contact, error } = await supabase
      .from('emergency_contacts')
      .insert({
        organization_id: orgId,
        child_id: data.child_id,
        name: data.name,
        relationship: data.relationship,
        phone: data.phone,
        secondary_phone: data.secondary_phone,
        email: data.email,
        priority_order: data.priority_order,
        is_authorized_pickup: data.is_authorized_pickup ?? false,
        photo_url: data.photo_url,
        id_document_url: data.id_document_url,
        availability_notes: data.availability_notes,
        notes: data.notes,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error
    return contact
  },

  // Update emergency contact
  async update(id: string, data: Partial<EmergencyContactFormData>): Promise<EmergencyContact> {
    const supabase = createClient()
    const { data: contact, error } = await supabase
      .from('emergency_contacts')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return contact
  },

  // Delete (soft delete)
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('emergency_contacts')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (error) throw error
  },

  // Check if child has minimum contacts
  async checkMinimumContacts(childId: string): Promise<{ hasMinimum: boolean; count: number; message: string }> {
    const supabase = createClient()

    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_emergency_contacts_count', { p_child_id: childId })

    if (!rpcError && rpcData?.[0]) {
      return {
        hasMinimum: rpcData[0].has_minimum,
        count: rpcData[0].contact_count,
        message: rpcData[0].message,
      }
    }

    // Fallback to local count
    const contacts = await this.getByChildId(childId)
    const count = contacts.length

    return {
      hasMinimum: count >= 2,
      count,
      message: count === 0
        ? 'No hay contactos de emergencia. Se requieren mínimo 2.'
        : count === 1
          ? 'Solo hay 1 contacto de emergencia. Se requieren mínimo 2.'
          : 'Requisito de contactos de emergencia cumplido.',
    }
  },

  // Reorder priorities
  async reorderPriorities(childId: string, orderedIds: string[]): Promise<void> {
    const supabase = createClient()

    // Update each contact's priority
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase
          .from('emergency_contacts')
          .update({ priority_order: index + 1 })
          .eq('id', id)
          .eq('child_id', childId)
      )
    )
  },

  // Get contacts authorized for pickup
  async getAuthorizedForPickup(childId: string): Promise<EmergencyContact[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('child_id', childId)
      .eq('status', 'active')
      .eq('is_authorized_pickup', true)
      .order('priority_order', { ascending: true })

    if (error) throw error
    return data || []
  },
}

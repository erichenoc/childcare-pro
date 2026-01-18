import { createClient } from '@/shared/lib/supabase/client'
import { requireOrgId } from '@/shared/lib/organization-context'
import type {
  IncidentExpanded,
  IncidentFormData,
  SignatureFormData,
  RecordSignatureResult,
  IncidentType,
  IncidentSeverity,
} from '@/shared/types/incidents-expanded.ts'

// Incident templates for common scenarios
export const INCIDENT_TEMPLATES = {
  booboo: {
    name: 'Reporte Booboo (Lesión Menor)',
    incident_type: 'injury' as IncidentType,
    severity: 'minor' as IncidentSeverity,
    description_template: `Tipo de lesión: [rasguño/golpe/mordedura/caída]
Parte del cuerpo afectada: [describir]
¿Cómo ocurrió?: [describir circunstancias]
¿Dónde ocurrió?: [área de juegos/salón/baño/etc.]`,
    action_template: `Tratamiento aplicado:
[ ] Lavado con agua y jabón
[ ] Aplicación de hielo
[ ] Curita/vendaje
[ ] Consuelo y observación
[ ] Otro: _____________

Observaciones adicionales:`,
  },
  behavioral: {
    name: 'Incidente Conductual',
    incident_type: 'behavioral' as IncidentType,
    severity: 'moderate' as IncidentSeverity,
    description_template: `Comportamiento observado: [describir]
Contexto/situación: [qué estaba ocurriendo antes]
¿Involucró a otros niños?: [sí/no - nombres si aplica]
Duración aproximada: [minutos]`,
    action_template: `Intervención realizada:
[ ] Redirección verbal
[ ] Tiempo de calma
[ ] Conversación individual
[ ] Separación temporal del grupo
[ ] Contacto inmediato con padres
[ ] Otro: _____________

Plan de seguimiento:`,
  },
  illness: {
    name: 'Enfermedad/Síntomas',
    incident_type: 'illness' as IncidentType,
    severity: 'moderate' as IncidentSeverity,
    description_template: `Síntomas observados: [describir]
Hora de inicio de síntomas: [hora]
Temperatura (si aplica): [°F]
¿Comió/bebió normalmente?: [sí/no]
Comportamiento general: [normal/irritable/letárgico]`,
    action_template: `Acciones tomadas:
[ ] Monitoreo continuo
[ ] Temperatura tomada
[ ] Aislamiento del grupo
[ ] Contacto con padres para recogida
[ ] Líquidos ofrecidos
[ ] Descanso

Hora de contacto con padres:
Hora de recogida:`,
  },
  medication: {
    name: 'Administración de Medicamento',
    incident_type: 'medication' as IncidentType,
    severity: 'minor' as IncidentSeverity,
    description_template: `Medicamento: [nombre]
Dosis: [cantidad]
Vía de administración: [oral/tópica/inhalada]
Hora programada: [hora]
Hora administrada: [hora]`,
    action_template: `Verificaciones realizadas:
[ ] Autorización de padres verificada
[ ] Medicamento en envase original
[ ] Nombre del niño en el medicamento
[ ] Fecha de vencimiento verificada
[ ] Segunda persona verificó dosis

Observaciones post-administración:`,
  },
  accident: {
    name: 'Accidente Serio',
    incident_type: 'injury' as IncidentType,
    severity: 'serious' as IncidentSeverity,
    description_template: `Descripción detallada del accidente:

Lesiones visibles:

Testigos presentes:

Equipos/áreas involucradas:`,
    action_template: `Acciones inmediatas:
[ ] Primeros auxilios administrados
[ ] 911 llamado (hora: ___)
[ ] Padres contactados inmediatamente
[ ] Director/supervisor notificado
[ ] Área asegurada
[ ] Fotos tomadas

Detalles de atención médica (si aplica):`,
  },
}

export interface IncidentWithDetails extends IncidentExpanded {
  child?: {
    id: string
    first_name: string
    last_name: string
    date_of_birth: string | null
    photo_url: string | null
  }
  classroom?: {
    id: string
    name: string
  }
  reporting_teacher?: {
    id: string
    first_name: string
    last_name: string
  }
}

export const incidentsEnhancedService = {
  /**
   * Get all incidents with full details
   */
  async getAll(): Promise<IncidentWithDetails[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        child:children(id, first_name, last_name, date_of_birth, photo_url),
        classroom:classrooms(id, name),
        reporting_teacher:profiles!incidents_reporting_teacher_id_fkey(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .order('occurred_at', { ascending: false })

    if (error) throw error
    return (data || []) as IncidentWithDetails[]
  },

  /**
   * Get pending signature incidents
   */
  async getPendingSignature(): Promise<IncidentWithDetails[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        child:children(id, first_name, last_name, date_of_birth, photo_url),
        classroom:classrooms(id, name),
        reporting_teacher:profiles!incidents_reporting_teacher_id_fkey(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'pending_signature')
      .order('occurred_at', { ascending: false })

    if (error) throw error
    return (data || []) as IncidentWithDetails[]
  },

  /**
   * Get incident by ID with all details
   */
  async getById(id: string): Promise<IncidentWithDetails | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        child:children(id, first_name, last_name, date_of_birth, photo_url),
        classroom:classrooms(id, name),
        reporting_teacher:profiles!incidents_reporting_teacher_id_fkey(id, first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as IncidentWithDetails
  },

  /**
   * Create incident from template
   */
  async createFromTemplate(
    templateKey: keyof typeof INCIDENT_TEMPLATES,
    childId: string,
    classroomId?: string
  ): Promise<{ id: string; template: typeof INCIDENT_TEMPLATES[keyof typeof INCIDENT_TEMPLATES] }> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const template = INCIDENT_TEMPLATES[templateKey]

    const { data, error } = await supabase
      .from('incidents')
      .insert({
        organization_id: orgId,
        child_id: childId,
        classroom_id: classroomId || null,
        incident_type: template.incident_type,
        severity: template.severity,
        occurred_at: new Date().toISOString(),
        description: template.description_template,
        action_taken: template.action_template,
        status: 'open',
        parent_notified: false,
      })
      .select('id')
      .single()

    if (error) throw error
    return { id: data.id, template }
  },

  /**
   * Create a new incident
   */
  async create(formData: IncidentFormData): Promise<IncidentWithDetails> {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Generate incident number
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', `${year}-01-01`)

    const incidentNumber = `INC-${year}-${String((count || 0) + 1).padStart(4, '0')}`

    const { data, error } = await supabase
      .from('incidents')
      .insert({
        organization_id: orgId,
        incident_number: incidentNumber,
        child_id: formData.child_id,
        classroom_id: formData.classroom_id || null,
        incident_type: formData.incident_type,
        severity: formData.severity,
        occurred_at: formData.occurred_at,
        location: formData.location || null,
        description: formData.description,
        action_taken: formData.action_taken || null,
        reporting_teacher_id: formData.reporting_teacher_id || null,
        witness_staff_ids: formData.witness_staff_ids || [],
        witness_names: formData.witness_names || null,
        parent_notified: formData.parent_notified || false,
        parent_notified_method: formData.parent_notified_method || null,
        parent_notified_at: formData.parent_notified ? new Date().toISOString() : null,
        follow_up_required: formData.follow_up_required || false,
        follow_up_date: formData.follow_up_date || null,
        status: 'open',
      })
      .select(`
        *,
        child:children(id, first_name, last_name, date_of_birth, photo_url),
        classroom:classrooms(id, name),
        reporting_teacher:profiles!incidents_reporting_teacher_id_fkey(id, first_name, last_name)
      `)
      .single()

    if (error) throw error
    return data as IncidentWithDetails
  },

  /**
   * Update incident
   */
  async update(id: string, formData: Partial<IncidentFormData>): Promise<IncidentWithDetails> {
    const supabase = createClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Only include fields that are provided
    if (formData.child_id !== undefined) updateData.child_id = formData.child_id
    if (formData.classroom_id !== undefined) updateData.classroom_id = formData.classroom_id || null
    if (formData.incident_type !== undefined) updateData.incident_type = formData.incident_type
    if (formData.severity !== undefined) updateData.severity = formData.severity
    if (formData.occurred_at !== undefined) updateData.occurred_at = formData.occurred_at
    if (formData.location !== undefined) updateData.location = formData.location || null
    if (formData.description !== undefined) updateData.description = formData.description
    if (formData.action_taken !== undefined) updateData.action_taken = formData.action_taken || null
    if (formData.reporting_teacher_id !== undefined) updateData.reporting_teacher_id = formData.reporting_teacher_id || null
    if (formData.witness_staff_ids !== undefined) updateData.witness_staff_ids = formData.witness_staff_ids || []
    if (formData.witness_names !== undefined) updateData.witness_names = formData.witness_names || null
    if (formData.parent_notified !== undefined) {
      updateData.parent_notified = formData.parent_notified
      if (formData.parent_notified) {
        updateData.parent_notified_at = new Date().toISOString()
      }
    }
    if (formData.parent_notified_method !== undefined) updateData.parent_notified_method = formData.parent_notified_method || null
    if (formData.follow_up_required !== undefined) updateData.follow_up_required = formData.follow_up_required
    if (formData.follow_up_date !== undefined) updateData.follow_up_date = formData.follow_up_date || null

    const { data, error } = await supabase
      .from('incidents')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        child:children(id, first_name, last_name, date_of_birth, photo_url),
        classroom:classrooms(id, name),
        reporting_teacher:profiles!incidents_reporting_teacher_id_fkey(id, first_name, last_name)
      `)
      .single()

    if (error) throw error
    return data as IncidentWithDetails
  },

  /**
   * Mark parent as notified
   */
  async markParentNotified(
    id: string,
    method: 'phone' | 'in_person' | 'email' | 'text',
    notifiedBy: string
  ): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('incidents')
      .update({
        parent_notified: true,
        parent_notified_at: new Date().toISOString(),
        parent_notified_method: method,
        parent_notified_by: notifiedBy,
        status: 'pending_signature',
      })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Record parent signature
   */
  async recordSignature(id: string, signatureData: SignatureFormData): Promise<RecordSignatureResult> {
    const supabase = createClient()

    try {
      const signedAt = new Date().toISOString()

      const { error } = await supabase
        .from('incidents')
        .update({
          parent_signature_data: signatureData.signature_data,
          parent_signed_at: signedAt,
          parent_signed_by_name: signatureData.signed_by_name,
          parent_signed_by_relationship: signatureData.signed_by_relationship,
          status: 'pending_closure',
        })
        .eq('id', id)

      if (error) throw error

      return {
        success: true,
        message: 'Firma registrada exitosamente',
        signed_at: signedAt,
      }
    } catch (error) {
      console.error('Error recording signature:', error)
      return {
        success: false,
        message: 'Error al registrar la firma',
        signed_at: null,
      }
    }
  },

  /**
   * Close incident
   */
  async closeIncident(id: string, closedBy: string, notes?: string): Promise<void> {
    const supabase = createClient()

    // First check if signature exists
    const { data: incident } = await supabase
      .from('incidents')
      .select('parent_signature_data, parent_signed_at')
      .eq('id', id)
      .single()

    if (!incident?.parent_signature_data) {
      throw new Error('No se puede cerrar el incidente sin firma del padre/tutor')
    }

    const { error } = await supabase
      .from('incidents')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by: closedBy,
        closure_notes: notes || null,
      })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Mark follow-up as completed
   */
  async completeFollowUp(id: string, completedBy: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('incidents')
      .update({
        follow_up_completed: true,
        follow_up_completed_at: new Date().toISOString(),
        follow_up_completed_by: completedBy,
      })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Get incidents requiring follow-up
   */
  async getRequiringFollowUp(): Promise<IncidentWithDetails[]> {
    const orgId = await requireOrgId()
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        child:children(id, first_name, last_name, date_of_birth, photo_url),
        classroom:classrooms(id, name),
        reporting_teacher:profiles!incidents_reporting_teacher_id_fkey(id, first_name, last_name)
      `)
      .eq('organization_id', orgId)
      .eq('follow_up_required', true)
      .eq('follow_up_completed', false)
      .lte('follow_up_date', today)
      .order('follow_up_date', { ascending: true })

    if (error) throw error
    return (data || []) as IncidentWithDetails[]
  },

  /**
   * Get stats for dashboard
   */
  async getStats() {
    const orgId = await requireOrgId()
    const supabase = createClient()

    // Get all incidents for stats
    const { data: incidents, error } = await supabase
      .from('incidents')
      .select('status, severity, parent_signature_data, follow_up_required, follow_up_completed, created_at')
      .eq('organization_id', orgId)

    if (error) throw error

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const data = incidents || []

    return {
      total: data.length,
      thisMonth: data.filter(i => new Date(i.created_at) >= thisMonth).length,
      open: data.filter(i => i.status === 'open').length,
      pendingSignature: data.filter(i => i.status === 'pending_signature').length,
      pendingClosure: data.filter(i => i.status === 'pending_closure').length,
      closed: data.filter(i => i.status === 'closed').length,
      pendingFollowUp: data.filter(i => i.follow_up_required && !i.follow_up_completed).length,
      bySeverity: {
        minor: data.filter(i => i.severity === 'minor').length,
        moderate: data.filter(i => i.severity === 'moderate').length,
        serious: data.filter(i => i.severity === 'serious').length,
        critical: data.filter(i => i.severity === 'critical').length,
      },
    }
  },
}

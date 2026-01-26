// =====================================================
// WHATSAPP IDENTITY SERVICE
// Identify organizations and guardians by phone/instance
// =====================================================

import { createClient } from '@/shared/lib/supabase/server'
import type {
  WhatsAppSession,
  ProspectData,
  SessionContext,
  IdentifyResponse,
} from '../types/whatsapp.types'

interface IdentifyResult {
  success: boolean
  data?: IdentifyResponse
  error?: string
}

// Helper para normalizar numero de telefono
function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace('@s.whatsapp.net', '')
  normalized = normalized.replace(/[^\d+]/g, '')
  normalized = normalized.replace('+', '')
  return normalized
}

export const whatsappIdentityService = {
  /**
   * Identificar organizacion e informacion del contacto por instancia y remoteJid
   */
  async identify(instanceName: string, remoteJid: string): Promise<IdentifyResult> {
    const supabase = await createClient()
    const phoneNumber = normalizePhoneNumber(remoteJid)

    try {
      // 1. Buscar la instancia de WhatsApp para obtener organization_id
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('id, organization_id, instance_name')
        .eq('instance_name', instanceName)
        .eq('status', 'connected')
        .single()

      if (instanceError || !instance) {
        return {
          success: false,
          error: `Instance not found or not connected: ${instanceName}`,
        }
      }

      // 2. Obtener informacion de la organizacion
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', instance.organization_id)
        .single()

      if (orgError || !org) {
        return {
          success: false,
          error: 'Organization not found',
        }
      }

      // 3. Buscar guardian por numero de telefono
      const { data: guardian } = await supabase
        .from('guardians')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          email,
          family_id,
          families (
            id,
            name
          )
        `)
        .eq('organization_id', instance.organization_id)
        .or(`phone.eq.${phoneNumber},phone.eq.+1${phoneNumber},phone.eq.1${phoneNumber}`)
        .single()

      // 4. Obtener o crear sesion
      const session = await this.getOrCreateSession(
        instance.organization_id,
        instanceName,
        remoteJid,
        guardian?.id || null,
        guardian?.family_id || null
      )

      // 5. Si es guardian, obtener sus hijos
      let children: Array<{ id: string; name: string; classroom: string }> = []
      if (guardian?.family_id) {
        const { data: childrenData } = await supabase
          .from('children')
          .select(`
            id,
            first_name,
            last_name,
            classroom_id,
            classrooms (
              id,
              name
            )
          `)
          .eq('family_id', guardian.family_id)
          .eq('status', 'active')

        if (childrenData) {
          children = childrenData.map((child) => ({
            id: child.id,
            name: `${child.first_name} ${child.last_name}`,
            classroom: (child.classrooms as { name: string } | null)?.name || 'Sin asignar',
          }))
        }
      }

      // 6. Construir respuesta
      const response: IdentifyResponse = {
        type: guardian ? 'parent' : 'prospect',
        organization: {
          id: org.id,
          name: org.name,
          instance_name: instanceName,
        },
        session: {
          id: session.id,
          current_child_id: session.current_child_id || undefined,
          is_prospect: session.is_prospect,
          prospect_data: session.is_prospect ? session.prospect_data : undefined,
        },
      }

      if (guardian) {
        const family = guardian.families as { id: string; name: string } | null
        response.guardian = {
          id: guardian.id,
          name: `${guardian.first_name} ${guardian.last_name}`,
          phone: guardian.phone || phoneNumber,
        }
        if (family) {
          response.family = {
            id: family.id,
            name: family.name,
          }
        }
        response.children = children
      }

      return { success: true, data: response }
    } catch (error) {
      console.error('[WhatsApp Identity] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  /**
   * Obtener o crear sesion de WhatsApp
   */
  async getOrCreateSession(
    organizationId: string,
    instanceName: string,
    remoteJid: string,
    guardianId: string | null,
    familyId: string | null
  ): Promise<WhatsAppSession> {
    const supabase = await createClient()

    // Buscar sesion existente no expirada
    const { data: existingSession } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('instance_name', instanceName)
      .eq('remote_jid', remoteJid)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingSession) {
      // Actualizar last_message_at
      await supabase
        .from('whatsapp_sessions')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: existingSession.message_count + 1,
        })
        .eq('id', existingSession.id)

      return existingSession as WhatsAppSession
    }

    // Crear nueva sesion
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 horas de expiracion

    const newSession = {
      organization_id: organizationId,
      instance_name: instanceName,
      remote_jid: remoteJid,
      guardian_id: guardianId,
      family_id: familyId,
      is_prospect: !guardianId,
      prospect_data: {} as ProspectData,
      session_context: {} as SessionContext,
      message_count: 1,
      last_message_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }

    const { data: session, error } = await supabase
      .from('whatsapp_sessions')
      .insert(newSession)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return session as WhatsAppSession
  },

  /**
   * Actualizar sesion con nuevo contexto
   */
  async updateSessionContext(
    sessionId: string,
    context: Partial<SessionContext>
  ): Promise<void> {
    const supabase = await createClient()

    const { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('session_context')
      .eq('id', sessionId)
      .single()

    const updatedContext = {
      ...(session?.session_context || {}),
      ...context,
    }

    await supabase
      .from('whatsapp_sessions')
      .update({ session_context: updatedContext })
      .eq('id', sessionId)
  },

  /**
   * Actualizar datos de prospecto
   */
  async updateProspectData(
    sessionId: string,
    prospectData: Partial<ProspectData>
  ): Promise<void> {
    const supabase = await createClient()

    const { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('prospect_data')
      .eq('id', sessionId)
      .single()

    const updatedData = {
      ...(session?.prospect_data || {}),
      ...prospectData,
    }

    await supabase
      .from('whatsapp_sessions')
      .update({ prospect_data: updatedData })
      .eq('id', sessionId)
  },

  /**
   * Seleccionar hijo actual para la sesion
   */
  async selectChild(sessionId: string, childId: string): Promise<void> {
    const supabase = await createClient()

    await supabase
      .from('whatsapp_sessions')
      .update({
        current_child_id: childId,
        session_context: {
          selected_child_id: childId,
        },
      })
      .eq('id', sessionId)
  },
}

export default whatsappIdentityService

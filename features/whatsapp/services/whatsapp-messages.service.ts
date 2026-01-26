// =====================================================
// WHATSAPP MESSAGES SERVICE
// Template management and message logging
// =====================================================

import { createClient } from '@/shared/lib/supabase/server'
import type {
  WhatsAppMessage,
  WhatsAppTemplate,
  TemplateKey,
  MessageDirection,
  MessageType,
  MessageStatus,
  LogMessageRequest,
  ChildSummaryResponse,
  InvoicesResponse,
  FormattedResponse,
} from '../types/whatsapp.types'

// ========== DEFAULT TEMPLATES ==========

const DEFAULT_TEMPLATES: Record<TemplateKey, { name: string; content: string; variables: string[] }> = {
  greeting: {
    name: 'Saludo inicial',
    content: 'Hola {{name}}! Bienvenido a {{center_name}}. ¿En qué puedo ayudarte hoy?',
    variables: ['name', 'center_name'],
  },
  menu: {
    name: 'Menu principal',
    content: `¿Qué te gustaría saber?

1️⃣ Resumen del día de {{child_name}}
2️⃣ Estado de asistencia
3️⃣ Ver facturas pendientes
4️⃣ Ver fotos recientes
5️⃣ Reportar incidente
6️⃣ Hablar con alguien

Responde con el número de tu opción.`,
    variables: ['child_name'],
  },
  select_child: {
    name: 'Seleccionar niño',
    content: `Tienes varios hijos registrados. ¿Sobre cuál te gustaría información?

{{children_list}}

Responde con el número.`,
    variables: ['children_list'],
  },
  daily_summary: {
    name: 'Resumen diario',
    content: `📋 *Resumen de {{child_name}}* - {{date}}

🕐 *Asistencia:*
{{attendance_info}}

🍽️ *Comidas:*
{{meals_info}}

😴 *Siesta:*
{{nap_info}}

😊 *Estado de ánimo:* {{mood_info}}

🎨 *Actividades:*
{{activities_info}}

📸 Fotos del día: {{photos_count}}`,
    variables: ['child_name', 'date', 'attendance_info', 'meals_info', 'nap_info', 'mood_info', 'activities_info', 'photos_count'],
  },
  invoice_status: {
    name: 'Estado de facturas',
    content: `💰 *Estado de cuenta - {{family_name}}*

{{invoices_list}}

*Balance total pendiente:* ${{total_balance}}

¿Deseas pagar alguna factura? Responde con el número.`,
    variables: ['family_name', 'invoices_list', 'total_balance'],
  },
  attendance: {
    name: 'Estado de asistencia',
    content: `👶 *Asistencia de {{child_name}}*

Estado: {{status}}
{{check_in_info}}
{{check_out_info}}`,
    variables: ['child_name', 'status', 'check_in_info', 'check_out_info'],
  },
  photos: {
    name: 'Fotos del dia',
    content: `📸 *Fotos de {{child_name}}* - {{date}}

{{photos_count}} foto(s) disponible(s)`,
    variables: ['child_name', 'date', 'photos_count'],
  },
  incident: {
    name: 'Notificacion de incidente',
    content: `⚠️ *Notificación Importante*

Se ha registrado un incidente para {{child_name}}:

*Tipo:* {{incident_type}}
*Severidad:* {{severity}}
*Descripción:* {{description}}

Si tienes preguntas, responde a este mensaje.`,
    variables: ['child_name', 'incident_type', 'severity', 'description'],
  },
  prospect_welcome: {
    name: 'Bienvenida prospecto',
    content: `¡Hola! 👋 Gracias por contactar a {{center_name}}.

Somos un centro de cuidado infantil licenciado en Florida, dedicado al desarrollo integral de los niños.

¿En qué puedo ayudarte?
1️⃣ Información sobre programas y precios
2️⃣ Horarios de operación
3️⃣ Agendar un tour/visita
4️⃣ Hablar con alguien

Responde con el número de tu opción.`,
    variables: ['center_name'],
  },
  prospect_prices: {
    name: 'Precios para prospectos',
    content: `📋 *Programas de {{center_name}}*

{{programs_list}}

🕐 *Horario:* {{hours}}

✨ *Incluye:*
{{features_list}}

¿Te gustaría agendar una visita para conocernos?`,
    variables: ['center_name', 'programs_list', 'hours', 'features_list'],
  },
  tour_scheduled: {
    name: 'Tour agendado',
    content: `✅ *Visita Confirmada*

Te esperamos el {{date}} a las {{time}}.

📍 Dirección: {{address}}

Por favor llega 10 minutos antes. Si necesitas cambiar la fecha, responde a este mensaje.`,
    variables: ['date', 'time', 'address'],
  },
  after_hours: {
    name: 'Fuera de horario',
    content: `Gracias por contactarnos. Nuestro horario de atención es de {{start_hour}} a {{end_hour}}.

Tu mensaje ha sido recibido y te responderemos mañana a primera hora.

Si es una emergencia, por favor llama al {{emergency_phone}}.`,
    variables: ['start_hour', 'end_hour', 'emergency_phone'],
  },
  unknown: {
    name: 'Intento no reconocido',
    content: `Lo siento, no entendí tu mensaje. ¿Podrías ser más específico?

Escribe "menu" para ver las opciones disponibles.`,
    variables: [],
  },
  error: {
    name: 'Error del sistema',
    content: `Lo siento, hubo un problema procesando tu solicitud. Por favor intenta de nuevo en unos minutos.

Si el problema persiste, escribe "ayuda" para contactar a un agente.`,
    variables: [],
  },
}

export const whatsappMessagesService = {
  // ========== TEMPLATE MANAGEMENT ==========

  /**
   * Obtener template por clave
   */
  async getTemplate(
    organizationId: string,
    templateKey: TemplateKey
  ): Promise<string> {
    const supabase = await createClient()

    // Buscar template personalizado
    const { data: customTemplate } = await supabase
      .from('whatsapp_templates')
      .select('content')
      .eq('organization_id', organizationId)
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single()

    if (customTemplate) {
      return customTemplate.content
    }

    // Usar template por defecto
    return DEFAULT_TEMPLATES[templateKey]?.content || DEFAULT_TEMPLATES.unknown.content
  },

  /**
   * Obtener todos los templates de una organizacion
   */
  async getAllTemplates(organizationId: string): Promise<WhatsAppTemplate[]> {
    const supabase = await createClient()

    const { data: templates } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('template_key', { ascending: true })

    return (templates || []) as WhatsAppTemplate[]
  },

  /**
   * Crear o actualizar template personalizado
   */
  async upsertTemplate(
    organizationId: string,
    templateKey: TemplateKey,
    content: string
  ): Promise<WhatsAppTemplate | null> {
    const supabase = await createClient()

    const defaultTemplate = DEFAULT_TEMPLATES[templateKey]

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .upsert({
        organization_id: organizationId,
        template_key: templateKey,
        template_name: defaultTemplate?.name || templateKey,
        content,
        variables: defaultTemplate?.variables || [],
        language: 'es',
        is_active: true,
      }, {
        onConflict: 'organization_id,template_key',
      })
      .select()
      .single()

    if (error) {
      console.error('[WhatsApp Messages] Error upserting template:', error)
      return null
    }

    return data as WhatsAppTemplate
  },

  // ========== MESSAGE FORMATTING ==========

  /**
   * Formatear template con variables
   */
  formatTemplate(template: string, variables: Record<string, string>): string {
    let formatted = template

    for (const [key, value] of Object.entries(variables)) {
      formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
    }

    return formatted
  },

  /**
   * Formatear resumen diario para WhatsApp
   */
  formatChildSummary(summary: ChildSummaryResponse): FormattedResponse {
    const attendanceInfo = summary.attendance.check_in_time
      ? `Llegó: ${summary.attendance.check_in_time}${summary.attendance.check_out_time ? ` | Salió: ${summary.attendance.check_out_time}` : ' | Aún en el centro'}`
      : 'No registrado hoy'

    const mealsInfo = summary.meals.length > 0
      ? summary.meals.map((m) => `• ${m.type}: ${m.amount}${m.notes ? ` (${m.notes})` : ''}`).join('\n')
      : 'Sin registro de comidas'

    const napInfo = summary.nap
      ? `${summary.nap.start_time} - ${summary.nap.end_time} (${summary.nap.duration_minutes} min)`
      : 'Sin siesta registrada'

    const moodInfo = summary.mood?.overall || 'No registrado'

    const activitiesInfo = summary.activities.length > 0
      ? summary.activities.map((a) => `• ${a.name}${a.notes ? `: ${a.notes}` : ''}`).join('\n')
      : 'Sin actividades registradas'

    const text = `📋 *Resumen de ${summary.child.name}* - ${summary.date}

🕐 *Asistencia:*
${attendanceInfo}

🍽️ *Comidas:*
${mealsInfo}

😴 *Siesta:*
${napInfo}

😊 *Estado de ánimo:* ${moodInfo}

🎨 *Actividades:*
${activitiesInfo}

📸 Fotos del día: ${summary.photos_count}`

    // Si hay incidentes, agregar alerta
    if (summary.incidents.length > 0) {
      const incidentsText = summary.incidents
        .map((i) => `⚠️ ${i.type} (${i.severity}): ${i.description}`)
        .join('\n')

      return {
        text: `${text}\n\n*⚠️ Incidentes:*\n${incidentsText}`,
      }
    }

    return { text }
  },

  /**
   * Formatear facturas para WhatsApp
   */
  formatInvoices(invoices: InvoicesResponse): FormattedResponse {
    const invoicesList = invoices.invoices.length > 0
      ? invoices.invoices
          .map((inv, i) => {
            const statusEmoji = inv.status === 'overdue' ? '🔴' : inv.status === 'partial' ? '🟡' : '🟢'
            return `${i + 1}. ${statusEmoji} #${inv.invoice_number}\n   ${inv.period}\n   Total: $${inv.total.toFixed(2)} | Pendiente: $${inv.balance.toFixed(2)}\n   Vence: ${inv.due_date}`
          })
          .join('\n\n')
      : 'No tienes facturas pendientes'

    const text = `💰 *Estado de cuenta - ${invoices.family.name}*

${invoicesList}

*Balance total pendiente:* $${invoices.total_balance.toFixed(2)}

${invoices.invoices.length > 0 ? '¿Deseas pagar alguna factura? Responde con el número.' : ''}`

    const buttons = invoices.invoices.length > 0
      ? invoices.invoices.slice(0, 3).map((inv, i) => ({
          id: `pay_${inv.id}`,
          text: `Pagar #${inv.invoice_number}`,
        }))
      : undefined

    return { text, buttons }
  },

  // ========== MESSAGE LOGGING ==========

  /**
   * Registrar mensaje en base de datos
   */
  async logMessage(request: LogMessageRequest): Promise<WhatsAppMessage | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert({
        organization_id: request.organization_id,
        session_id: request.session_id,
        instance_name: request.instance_name,
        remote_jid: request.remote_jid,
        message_id: request.message_id,
        direction: request.direction,
        message_type: request.message_type,
        content: request.content,
        media_url: request.media_url,
        intent_detected: request.intent_detected,
        confidence_score: request.confidence_score,
        response_time_ms: request.response_time_ms,
        status: request.status || 'received',
        metadata: request.metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('[WhatsApp Messages] Error logging message:', error)
      return null
    }

    return data as WhatsAppMessage
  },

  /**
   * Actualizar estado de mensaje
   */
  async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    errorMessage?: string
  ): Promise<void> {
    const supabase = await createClient()

    await supabase
      .from('whatsapp_messages')
      .update({
        status,
        error_message: errorMessage,
      })
      .eq('message_id', messageId)
  },

  /**
   * Obtener historial de mensajes de una sesion
   */
  async getSessionMessages(
    sessionId: string,
    limit: number = 50
  ): Promise<WhatsAppMessage[]> {
    const supabase = await createClient()

    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return (data || []) as WhatsAppMessage[]
  },

  // ========== ANALYTICS ==========

  /**
   * Obtener estadisticas de mensajes
   */
  async getMessageStats(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    total_received: number
    total_sent: number
    unique_users: number
    avg_response_time_ms: number
    intents_breakdown: Record<string, number>
  }> {
    const supabase = await createClient()

    const { data: messages } = await supabase
      .from('whatsapp_messages')
      .select('direction, intent_detected, response_time_ms, remote_jid')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (!messages || messages.length === 0) {
      return {
        total_received: 0,
        total_sent: 0,
        unique_users: 0,
        avg_response_time_ms: 0,
        intents_breakdown: {},
      }
    }

    const received = messages.filter((m) => m.direction === 'inbound')
    const sent = messages.filter((m) => m.direction === 'outbound')
    const uniqueUsers = new Set(messages.map((m) => m.remote_jid)).size
    const responseTimes = sent
      .map((m) => m.response_time_ms)
      .filter((t): t is number => t !== null)
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0

    const intentsBreakdown: Record<string, number> = {}
    for (const msg of received) {
      if (msg.intent_detected) {
        intentsBreakdown[msg.intent_detected] = (intentsBreakdown[msg.intent_detected] || 0) + 1
      }
    }

    return {
      total_received: received.length,
      total_sent: sent.length,
      unique_users: uniqueUsers,
      avg_response_time_ms: Math.round(avgResponseTime),
      intents_breakdown: intentsBreakdown,
    }
  },
}

export default whatsappMessagesService

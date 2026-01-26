// =====================================================
// POST /api/whatsapp/n8n/ai-chat
// AI Conversational Agent for WhatsApp
// Uses OpenRouter GPT-4o for natural conversations
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { generateText, tool } from 'ai'
import { createClient } from '@/shared/lib/supabase/server'
import { openrouter } from '@/shared/lib/openrouter'
import { z } from 'zod'

// Request schema
const aiChatRequestSchema = z.object({
  // Message info
  message: z.string().min(1),
  messageType: z.enum(['text', 'image', 'audio', 'document']).default('text'),

  // Contact info
  contactType: z.enum(['parent', 'prospect', 'unknown']),
  phoneNumber: z.string(),
  pushName: z.string().optional(),

  // Organization info
  organizationId: z.string().uuid().optional(),
  organizationName: z.string().optional(),

  // Parent-specific info
  guardianId: z.string().uuid().optional(),
  guardianName: z.string().optional(),
  familyId: z.string().uuid().optional(),
  children: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    classroom: z.string().optional(),
  })).optional(),
  currentChildId: z.string().uuid().optional(),

  // Session info
  sessionId: z.string().uuid().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),

  // Security: verified children in this session
  verifiedChildren: z.array(z.string().uuid()).optional(),
})

// Helper: Normalize name for comparison (remove accents, lowercase, trim)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .trim()
}

// Helper: Check if names match (fuzzy matching)
function namesMatch(input: string, registered: string): boolean {
  const normalizedInput = normalizeName(input)
  const normalizedRegistered = normalizeName(registered)

  // Exact match
  if (normalizedInput === normalizedRegistered) return true

  // Check if input matches first name
  const firstName = normalizedRegistered.split(' ')[0]
  if (normalizedInput === firstName) return true

  // Check if registered name contains input (for nicknames)
  if (normalizedRegistered.includes(normalizedInput)) return true

  // Check if input contains first name (e.g., "mi hijo juan" contains "juan")
  if (normalizedInput.includes(firstName) && firstName.length >= 3) return true

  return false
}

// System prompt for the WhatsApp AI Agent
function buildSystemPrompt(context: {
  contactType: string
  organizationName?: string
  guardianName?: string
  children?: Array<{ id: string; name: string; classroom?: string }>
  isBusinessHours: boolean
}) {
  const { contactType, organizationName, guardianName, children, isBusinessHours } = context
  const centerName = organizationName || 'nuestro centro de cuidado infantil'

  let basePrompt = `Eres Maya, la asistente virtual de ${centerName}, un centro de cuidado infantil licenciado en Florida.

## Tu Personalidad
- Eres amable, empática y profesional
- Respondes siempre en español (a menos que el usuario escriba en inglés)
- Usas un tono cálido pero no excesivamente informal
- Eres concisa - las respuestas de WhatsApp deben ser cortas y claras
- Usas emojis con moderación (1-2 por mensaje máximo)

## Reglas Importantes
- NUNCA inventes información sobre niños, facturas o datos del centro
- Si no tienes información, usa las herramientas disponibles para obtenerla
- Si no puedes ayudar con algo, ofrece conectar con un humano
- Mantén la privacidad - no compartas información de un niño con personas no autorizadas
- Responde SOLO lo que se te pregunta, no agregues información innecesaria

## Formato de Respuesta
- Máximo 3-4 oraciones por mensaje
- Usa saltos de línea para separar ideas
- Usa *asteriscos* para énfasis (formato WhatsApp)
- Lista numerada solo cuando sea necesario (ej: opciones de menú)
`

  if (contactType === 'parent' && guardianName) {
    const firstName = guardianName.split(' ')[0]
    const childrenNames = children?.map(c => c.name).join(', ') || 'su hijo/a'

    basePrompt += `
## Contexto del Usuario (Padre/Madre)
- Nombre: ${firstName}
- Hijos en el centro: ${childrenNames}
- Tipo: Padre/madre registrado

## SEGURIDAD - Verificación de Identidad (MUY IMPORTANTE)
Antes de dar información sensible sobre un niño (resumen del día, fotos, incidentes), DEBES:
1. Usar la herramienta "verify_child_name" para verificar que el padre conoce el nombre del niño
2. Si la verificación falla, NO dar información y pedir que confirmen el nombre correcto
3. Una vez verificado, puedes usar las otras herramientas normalmente
4. Las facturas NO requieren verificación (son de la familia, no del niño específico)

Ejemplo de flujo seguro:
- Usuario: "¿Cómo le fue a mi hijo hoy?"
- Tú: "Para proteger la privacidad, ¿puedes confirmarme el nombre de tu hijo/a?"
- Usuario: "Juanito"
- [Usas verify_child_name con el nombre "Juanito"]
- Si es correcto: Procedes a dar información
- Si es incorrecto: "El nombre no coincide con nuestros registros. ¿Puedes verificar?"

## Lo que puedes hacer para padres:
- Verificar identidad antes de info sensible (usa verify_child_name)
- Dar información sobre el día de sus hijos (usa get_child_summary, REQUIERE verificación)
- Consultar estado de facturas (usa get_invoices, NO requiere verificación)
- Informar sobre fotos disponibles (usa get_photos, REQUIERE verificación)
- Responder preguntas generales sobre el centro
- Conectar con el personal si lo necesitan
`
  } else if (contactType === 'prospect') {
    basePrompt += `
## Contexto del Usuario (Prospecto)
- Es un cliente potencial interesado en nuestros servicios
- Puede preguntar sobre precios, horarios, programas, etc.

## Lo que puedes hacer para prospectos:
- Dar información general sobre el centro
- Explicar programas y grupos de edad
- Informar sobre horarios de operación (6:30 AM - 6:00 PM, Lunes a Viernes)
- Mencionar que pueden agendar un tour/visita
- Proporcionar información de contacto

## Información del Centro
- Horario: Lunes a Viernes, 6:30 AM - 6:00 PM
- Licenciado por DCF de Florida
- Programas: Infantes (0-12 meses), Toddlers (1-2 años), Preescolar (3-5 años)
- Incluye: Desayuno, almuerzo, snacks, actividades educativas
- Para precios específicos, sugiere agendar una visita
`
  } else {
    basePrompt += `
## Contexto del Usuario
- Usuario no identificado
- Trata de identificar si es padre o prospecto basándote en su mensaje

## Acciones
- Si menciona a un hijo en el centro, puede ser un padre no registrado
- Si pregunta por información general, probablemente es un prospecto
- Ofrece ayuda apropiada según el contexto
`
  }

  if (!isBusinessHours) {
    basePrompt += `
## IMPORTANTE: Fuera de Horario
Actualmente estamos FUERA de horario de atención (6:30 AM - 6:00 PM).
- Puedes responder preguntas básicas
- Para asuntos urgentes, indica que respondan mañana en horario laboral
- Para emergencias con niños, proporciona el número de emergencias del centro si lo solicitan
`
  }

  return basePrompt
}

// Check if within business hours (Florida timezone)
function isWithinBusinessHours(): boolean {
  const now = new Date()
  const floridaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const hour = floridaTime.getHours()
  const day = floridaTime.getDay()

  // Monday-Friday (1-5), 6:30 AM - 6:00 PM
  if (day === 0 || day === 6) return false // Weekend
  if (hour < 6 || (hour === 6 && floridaTime.getMinutes() < 30)) return false
  if (hour >= 18) return false

  return true
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.N8N_WEBHOOK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!authHeader || !authHeader.includes(apiKey || '')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request
    const body = await request.json()
    const validation = aiChatRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const supabase = await createClient()

    // Build conversation history
    const conversationMessages = data.conversationHistory?.slice(-10) || []
    conversationMessages.push({ role: 'user' as const, content: data.message })

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt({
      contactType: data.contactType,
      organizationName: data.organizationName,
      guardianName: data.guardianName,
      children: data.children,
      isBusinessHours: isWithinBusinessHours(),
    })

    // Get verified children from session context
    let verifiedChildIds: string[] = data.verifiedChildren || []

    // Define tools for the AI agent
    const tools = {
      verify_child_name: tool({
        description: 'SEGURIDAD: Verifica que el padre conoce el nombre del niño antes de dar información sensible. SIEMPRE usa esto ANTES de get_child_summary o get_photos.',
        parameters: z.object({
          childNameProvided: z.string().describe('El nombre que el padre proporcionó para verificar'),
        }),
        execute: async ({ childNameProvided }) => {
          if (!data.children || data.children.length === 0) {
            return {
              verified: false,
              error: 'No hay niños registrados para este usuario',
            }
          }

          // Check if any child name matches
          const matchedChild = data.children.find(child =>
            namesMatch(childNameProvided, child.name)
          )

          if (matchedChild) {
            // Add to verified list
            if (!verifiedChildIds.includes(matchedChild.id)) {
              verifiedChildIds.push(matchedChild.id)
            }

            return {
              verified: true,
              childId: matchedChild.id,
              childName: matchedChild.name,
              message: `Verificación exitosa para ${matchedChild.name}.`,
            }
          }

          // No match found
          const registeredNames = data.children.map(c => c.name.split(' ')[0]).join(', ')
          return {
            verified: false,
            error: 'El nombre proporcionado no coincide con nuestros registros.',
            hint: `Tenemos registrado(s): ${registeredNames}. Por favor verifica el nombre.`,
          }
        },
      }),

      get_child_summary: tool({
        description: 'Obtiene el resumen del día de un niño. IMPORTANTE: Requiere que el niño haya sido verificado primero con verify_child_name.',
        parameters: z.object({
          childId: z.string().describe('ID del niño (obtenido de verify_child_name).'),
        }),
        execute: async ({ childId }) => {
          if (!data.organizationId) return { error: 'No organization context' }

          const targetChildId = childId || data.currentChildId || data.children?.[0]?.id
          if (!targetChildId) return { error: 'No child specified' }

          // SECURITY CHECK: Verify child has been verified in this session
          if (!verifiedChildIds.includes(targetChildId)) {
            return {
              error: 'SEGURIDAD: Este niño no ha sido verificado en esta sesión.',
              action_required: 'Primero usa verify_child_name para confirmar la identidad.',
            }
          }

          // Get child info
          const { data: child } = await supabase
            .from('children')
            .select('id, first_name, last_name')
            .eq('id', targetChildId)
            .single()

          // Get today's attendance
          const today = new Date().toISOString().split('T')[0]
          const { data: attendance } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('child_id', targetChildId)
            .eq('date', today)
            .single()

          // Get today's activities
          const { data: activities } = await supabase
            .from('daily_activities')
            .select('*')
            .eq('child_id', targetChildId)
            .gte('recorded_at', `${today}T00:00:00`)
            .lte('recorded_at', `${today}T23:59:59`)
            .order('recorded_at', { ascending: true })

          // Get any incidents
          const { data: incidents } = await supabase
            .from('incidents')
            .select('*')
            .eq('child_id', targetChildId)
            .gte('occurred_at', `${today}T00:00:00`)
            .lte('occurred_at', `${today}T23:59:59`)

          return {
            childName: child ? `${child.first_name} ${child.last_name}` : 'el niño',
            date: today,
            attendance: attendance ? {
              checkedIn: !!attendance.check_in_time,
              checkInTime: attendance.check_in_time,
              checkedOut: !!attendance.check_out_time,
              checkOutTime: attendance.check_out_time,
            } : null,
            activities: activities?.map(a => ({
              type: a.activity_type,
              description: a.description,
              time: a.recorded_at,
            })) || [],
            incidents: incidents?.map(i => ({
              type: i.incident_type,
              description: i.description,
              severity: i.severity,
            })) || [],
            hasData: !!(attendance || activities?.length || incidents?.length),
          }
        },
      }),

      get_invoices: tool({
        description: 'Obtiene el estado de las facturas de una familia. Usa esto cuando un padre pregunte sobre pagos, facturas pendientes, o cuánto debe.',
        parameters: z.object({}),
        execute: async () => {
          if (!data.familyId || !data.organizationId) {
            return { error: 'No family context' }
          }

          const { data: invoices } = await supabase
            .from('invoices')
            .select('*')
            .eq('family_id', data.familyId)
            .in('status', ['pending', 'overdue', 'partial'])
            .order('due_date', { ascending: true })
            .limit(5)

          const totalPending = invoices?.reduce((sum, inv) => {
            const paid = inv.amount_paid || 0
            return sum + (inv.total_amount - paid)
          }, 0) || 0

          return {
            pendingInvoices: invoices?.map(inv => ({
              id: inv.id,
              period: inv.billing_period,
              total: inv.total_amount,
              paid: inv.amount_paid || 0,
              pending: inv.total_amount - (inv.amount_paid || 0),
              dueDate: inv.due_date,
              status: inv.status,
            })) || [],
            totalPending,
            hasInvoices: (invoices?.length || 0) > 0,
          }
        },
      }),

      get_photos: tool({
        description: 'Verifica si hay fotos disponibles de un niño. IMPORTANTE: Requiere que el niño haya sido verificado primero con verify_child_name.',
        parameters: z.object({
          childId: z.string().optional().describe('ID del niño (obtenido de verify_child_name)'),
        }),
        execute: async ({ childId }) => {
          if (!data.organizationId) return { error: 'No organization context' }

          const targetChildId = childId || data.currentChildId || data.children?.[0]?.id
          if (!targetChildId) return { error: 'No child specified' }

          // SECURITY CHECK: Verify child has been verified in this session
          if (!verifiedChildIds.includes(targetChildId)) {
            return {
              error: 'SEGURIDAD: Este niño no ha sido verificado en esta sesión.',
              action_required: 'Primero usa verify_child_name para confirmar la identidad.',
            }
          }

          const today = new Date().toISOString().split('T')[0]

          const { data: photos, count } = await supabase
            .from('daily_photos')
            .select('id, caption, created_at', { count: 'exact' })
            .eq('child_id', targetChildId)
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`)
            .limit(5)

          return {
            photoCount: count || 0,
            hasPhotos: (count || 0) > 0,
            recentPhotos: photos?.map(p => ({
              caption: p.caption,
              time: p.created_at,
            })) || [],
            message: count && count > 0
              ? `Hay ${count} foto(s) de hoy disponibles en el portal de padres.`
              : 'No hay fotos nuevas de hoy todavía.',
          }
        },
      }),

      schedule_tour: tool({
        description: 'Registra el interés de un prospecto en agendar un tour/visita. Usa esto cuando alguien quiera visitar el centro.',
        parameters: z.object({
          preferredDate: z.string().optional().describe('Fecha preferida si la mencionaron'),
          preferredTime: z.string().optional().describe('Hora preferida si la mencionaron'),
          notes: z.string().optional().describe('Notas adicionales sobre lo que buscan'),
        }),
        execute: async ({ preferredDate, preferredTime, notes }) => {
          // Log the tour request
          const { error } = await supabase
            .from('sales_leads')
            .upsert({
              phone: data.phoneNumber,
              name: data.pushName || 'WhatsApp Lead',
              source: 'whatsapp_bot',
              status: 'tour_requested',
              notes: `Tour solicitado via WhatsApp. ${preferredDate ? `Fecha preferida: ${preferredDate}` : ''} ${preferredTime ? `Hora: ${preferredTime}` : ''} ${notes || ''}`.trim(),
              organization_id: data.organizationId,
            }, {
              onConflict: 'phone',
            })

          if (error) {
            console.error('[AI Chat] Error saving tour request:', error)
            return { success: false, error: 'Error al guardar solicitud' }
          }

          return {
            success: true,
            message: 'Solicitud de tour registrada. Un miembro de nuestro equipo te contactará pronto para confirmar la fecha y hora.',
          }
        },
      }),

      escalate_to_human: tool({
        description: 'Escala la conversación a un agente humano. Usa esto cuando el usuario pida hablar con una persona, o cuando no puedas resolver su consulta.',
        parameters: z.object({
          reason: z.string().describe('Razón de la escalación'),
        }),
        execute: async ({ reason }) => {
          // Update session to mark as needing human attention
          if (data.sessionId) {
            await supabase
              .from('whatsapp_sessions')
              .update({
                needs_human: true,
                human_request_reason: reason,
                updated_at: new Date().toISOString(),
              })
              .eq('id', data.sessionId)
          }

          return {
            escalated: true,
            message: 'He notificado a nuestro equipo. Alguien te responderá pronto durante horario laboral (Lunes a Viernes, 6:30 AM - 6:00 PM).',
          }
        },
      }),
    }

    // Generate response using GPT-4o via OpenRouter
    console.log('[WhatsApp AI] Generating response for:', data.contactType, data.message.substring(0, 50))

    const result = await generateText({
      model: openrouter('openai/gpt-4o'),
      system: systemPrompt,
      messages: conversationMessages,
      tools,
      maxSteps: 3, // Allow up to 3 tool calls
      temperature: 0.7,
    })

    const responseText = result.text || 'Lo siento, no pude procesar tu mensaje. ¿Puedes intentar de nuevo?'

    // Save the conversation to session context
    if (data.sessionId) {
      // Get existing context
      const { data: session } = await supabase
        .from('whatsapp_sessions')
        .select('context')
        .eq('id', data.sessionId)
        .single()

      const existingHistory = session?.context?.conversation_history || []
      const newHistory = [
        ...existingHistory.slice(-8), // Keep last 8 messages
        { role: 'user', content: data.message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: responseText, timestamp: new Date().toISOString() },
      ]

      // Merge existing verified children with new ones
      const existingVerified = session?.context?.verified_children || []
      const allVerified = [...new Set([...existingVerified, ...verifiedChildIds])]

      await supabase
        .from('whatsapp_sessions')
        .update({
          context: {
            ...session?.context,
            conversation_history: newHistory,
            verified_children: allVerified, // Persist verified children
            last_intent: result.toolCalls?.[0]?.toolName || 'general_chat',
          },
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.sessionId)
    }

    console.log('[WhatsApp AI] Response generated:', responseText.substring(0, 100))

    return NextResponse.json({
      success: true,
      data: {
        responseText,
        toolsUsed: result.toolCalls?.map(tc => tc.toolName) || [],
        tokensUsed: result.usage?.totalTokens || 0,
      },
    })

  } catch (error) {
    console.error('[WhatsApp AI] Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Error processing AI request',
      data: {
        responseText: 'Lo siento, tuve un problema técnico. Por favor intenta de nuevo o escribe "ayuda" para ver opciones.',
      },
    }, { status: 500 })
  }
}

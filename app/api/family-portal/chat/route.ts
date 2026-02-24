import { NextRequest, NextResponse } from 'next/server'
import { generateText, tool, stepCountIs } from 'ai'
import { openrouter } from '@/shared/lib/openrouter'
import { createClient } from '@/shared/lib/supabase/server'
import { z } from 'zod'

/**
 * Family Portal AI Chat API
 *
 * Uses the same Maya agent as WhatsApp but for web portal
 * Includes security verification for child information
 */

const MAYA_SYSTEM_PROMPT = `Eres Maya, la asistente virtual amigable de ChildCare Pro.
Tu rol es ayudar a los padres con informacion sobre sus hijos en la guarderia.

## Tu Personalidad
- Amable, empatica y profesional
- Respondes en espanol de forma natural y conversacional
- Usas emojis moderadamente para ser mas amigable
- Eres paciente y clara en tus explicaciones

## Capacidades
Puedes ayudar con:
- Informacion sobre los ninos (despues de verificacion)
- Estado de facturas y pagos
- Fotos recientes
- Historial de asistencia
- Programar visitas/tours
- Responder preguntas generales sobre la guarderia

## SEGURIDAD IMPORTANTE
- SIEMPRE verifica el nombre del nino antes de dar informacion sensible
- Usa la herramienta verify_child_name para confirmar identidad
- Solo da informacion de ninos que han sido verificados en esta sesion
- Si el padre pregunta por un nino sin verificar, pide confirmacion primero

## Flujo de Verificacion
1. Padre pregunta sobre un nino
2. Tu pides: "Por seguridad, confirma el nombre completo del nino"
3. Padre da el nombre
4. Usas verify_child_name para validar
5. Si coincide, procedes con la informacion
6. Si no coincide, informas amablemente que no encontraste coincidencia

## Limitaciones
- No puedes modificar datos, solo consultar
- No des informacion medica especifica
- Para emergencias, remite a contactar directamente a la guarderia
- Si no sabes algo, admitelo honestamente`

// Helper function to normalize names for comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function namesMatch(input: string, registered: string): boolean {
  const normalizedInput = normalizeName(input)
  const normalizedRegistered = normalizeName(registered)

  if (normalizedInput === normalizedRegistered) return true

  const firstName = normalizedRegistered.split(' ')[0]
  if (normalizedInput === firstName) return true

  if (normalizedRegistered.includes(normalizedInput)) return true

  if (normalizedInput.includes(firstName) && firstName.length >= 3) return true

  return false
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      message,
      guardianId,
      organizationId,
      childIds,
      verifiedChildren = [],
      conversationHistory = [],
    } = body

    if (!message || !guardianId || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify guardian access
    const { data: guardian } = await supabase
      .from('guardians')
      .select('id, portal_user_id')
      .eq('id', guardianId)
      .eq('portal_user_id', user.id)
      .single()

    if (!guardian) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let updatedVerifiedChildren = [...verifiedChildren]

    // Define tools
    const verifyChildNameSchema = z.object({
      providedName: z.string().describe('Nombre que el padre proporciono'),
    })
    const getChildSummarySchema = z.object({
      childId: z.string().describe('ID del nino'),
    })
    const getPhotosSchema = z.object({
      childId: z.string().optional().describe('ID del nino especifico'),
    })
    const scheduleTourSchema = z.object({
      preferredDate: z.string().optional().describe('Fecha preferida'),
      notes: z.string().optional().describe('Notas adicionales'),
    })

    const tools = {
      verify_child_name: tool({
        description: 'Verifica que el nombre proporcionado coincide con un nino registrado del padre',
        inputSchema: verifyChildNameSchema,
        execute: async ({ providedName }): Promise<Record<string, unknown>> => {
          const { data: children } = await supabase
            .from('children')
            .select('id, first_name, last_name')
            .in('id', childIds)

          if (!children || children.length === 0) {
            return { verified: false, message: 'No se encontraron ninos registrados' }
          }

          for (const child of children) {
            const fullName = `${child.first_name} ${child.last_name}`
            if (namesMatch(providedName, fullName)) {
              if (!updatedVerifiedChildren.includes(child.id)) {
                updatedVerifiedChildren.push(child.id)
              }
              return {
                verified: true,
                childId: child.id,
                childName: fullName,
                message: `Verificado: ${fullName}`,
              }
            }
          }

          return {
            verified: false,
            message: 'El nombre no coincide con ningun nino registrado',
          }
        },
      }),

      get_child_summary: tool({
        description: 'Obtiene resumen del estado actual del nino (requiere verificacion previa)',
        inputSchema: getChildSummarySchema,
        execute: async ({ childId }): Promise<Record<string, unknown>> => {
          if (!updatedVerifiedChildren.includes(childId)) {
            return { error: 'Este nino no ha sido verificado. Pide confirmacion del nombre primero.' }
          }

          const { data: child } = await supabase
            .from('children')
            .select(`
              first_name,
              last_name,
              date_of_birth,
              status,
              classroom:classrooms(name)
            `)
            .eq('id', childId)
            .single()

          if (!child) return { error: 'Nino no encontrado' }

          const today = new Date().toISOString().split('T')[0]
          const { data: attendance } = await supabase
            .from('attendance')
            .select('check_in, check_out, status')
            .eq('child_id', childId)
            .eq('date', today)
            .single()

          return {
            name: `${child.first_name} ${child.last_name}`,
            classroom: (child.classroom as unknown as { name: string } | null)?.name || 'Sin asignar',
            status: child.status,
            todayAttendance: attendance || { status: 'not_recorded' },
          }
        },
      }),

      get_invoices: tool({
        description: 'Obtiene facturas pendientes del padre',
        inputSchema: z.object({}),
        execute: async (): Promise<Record<string, unknown>> => {
          const { data: invoices } = await supabase
            .from('invoices')
            .select('invoice_number, total_amount, due_date, status, child:children(first_name)')
            .in('child_id', childIds)
            .in('status', ['pending', 'overdue'])
            .order('due_date', { ascending: true })
            .limit(5)

          if (!invoices || invoices.length === 0) {
            return { message: 'No tienes facturas pendientes. Todo al dia!' }
          }

          return {
            pendingCount: invoices.length,
            invoices: invoices.map(inv => ({
              number: inv.invoice_number,
              amount: inv.total_amount,
              dueDate: inv.due_date,
              status: inv.status,
              childName: (inv.child as unknown as { first_name: string } | null)?.first_name,
            })),
          }
        },
      }),

      get_photos: tool({
        description: 'Obtiene fotos recientes de los ninos (requiere verificacion)',
        inputSchema: getPhotosSchema,
        execute: async ({ childId }): Promise<Record<string, unknown>> => {
          const targetIds = childId ? [childId] : updatedVerifiedChildren

          if (targetIds.length === 0) {
            return { error: 'Primero verifica el nombre del nino para ver sus fotos.' }
          }

          const { data: photos } = await supabase
            .from('daily_photos')
            .select('caption, taken_at, child:children(first_name)')
            .in('child_id', targetIds)
            .order('taken_at', { ascending: false })
            .limit(5)

          if (!photos || photos.length === 0) {
            return { message: 'No hay fotos recientes disponibles.' }
          }

          return {
            count: photos.length,
            photos: photos.map(p => ({
              caption: p.caption,
              date: p.taken_at,
              childName: (p.child as unknown as { first_name: string } | null)?.first_name,
            })),
            note: 'Puedes ver todas las fotos en la seccion Fotos del portal.',
          }
        },
      }),

      schedule_tour: tool({
        description: 'Ayuda a programar una visita o tour a la guarderia',
        inputSchema: scheduleTourSchema,
        execute: async ({ preferredDate, notes }): Promise<Record<string, unknown>> => {
          return {
            message: 'Para programar una visita, por favor contacta directamente a la guarderia.',
            phone: 'Disponible en el perfil de la organizacion',
            preferredDate,
            notes,
            action: 'Un miembro del staff se comunicara contigo pronto.',
          }
        },
      }),
    }

    // Build conversation messages
    const messages = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // Generate response
    const result = await generateText({
      model: openrouter('openai/gpt-4o'),
      system: MAYA_SYSTEM_PROMPT,
      messages,
      tools,
      stopWhen: stepCountIs(5),
    })

    return NextResponse.json({
      response: result.text,
      verifiedChildren: updatedVerifiedChildren,
    })
  } catch (error) {
    console.error('[Family Portal Chat] Error:', error)
    return NextResponse.json(
      { error: 'Error processing message' },
      { status: 500 }
    )
  }
}

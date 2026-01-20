// =====================================================
// AI Assistant API Route
// =====================================================
// Handles chat messages, tool execution, and streaming

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { allTools, requiresConfirmation } from '@/features/ai-assistant/tools/definitions'
import { executeTool, executeConfirmedAction } from '@/features/ai-assistant/tools/executor'
import type { AIAssistantRequest, ToolCall, AssistantContext } from '@/features/ai-assistant/types'

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'openai/gpt-4o'

// =====================================================
// SYSTEM PROMPT
// =====================================================

function buildSystemPrompt(context: AssistantContext): string {
  return `Eres el asistente inteligente de ChildCare Pro, una plataforma de gestión para guarderías en Florida.

Tu nombre es "Asistente ChildCare" y tu rol es ayudar a los dueños y administradores de guarderías a gestionar su negocio de manera eficiente.

## Información del Contexto
- Organización: ${context.organizationName}
- Usuario: ${context.userName} (${context.userRole})
- Página actual: ${context.currentPage}
- Fecha: ${context.currentDate}
- Hora: ${context.currentTime}
- Idioma preferido: ${context.language === 'es' ? 'Español' : 'English'}

## Tu Personalidad
- Habla de forma natural, cálida y profesional, como un colega de confianza
- Usa un tono amigable pero respetuoso
- Sé proactivo en ofrecer soluciones y sugerencias útiles
- Cuando des información numérica o de listas, formatea de manera clara y legible
- Usa emojis ocasionalmente para hacer la conversación más amena (✅, 📊, 👶, 💰, etc.)
- Si no tienes información suficiente, pregunta amablemente
- SIEMPRE responde en el idioma que el usuario use

## Tus Capacidades
Puedes ayudar con:
1. **Gestión de Niños y Familias**: Buscar, ver información, estado de inscripción
2. **Control de Asistencia**: Ver quién está presente, registrar entradas/salidas
3. **Ratios DCF**: Verificar cumplimiento de ratios de Florida
4. **Facturación**: Ver facturas, pagos pendientes, crear facturas, enviar recordatorios
5. **Incidentes**: Reportar y dar seguimiento a incidentes
6. **Personal**: Ver información del staff y asignaciones
7. **Comunicación**: Ayudar a redactar mensajes para las familias
8. **Análisis**: Resúmenes diarios, alertas, estadísticas

## Reglas Importantes
1. Para CUALQUIER acción que modifique datos (check-in, check-out, crear factura, reportar incidente, enviar email), SIEMPRE pide confirmación al usuario antes de ejecutar
2. Cuando muestres resultados de tools, interprétalos y presénttalos de forma natural, no como datos crudos
3. Si algo falla, explica el problema de forma amigable y sugiere alternativas
4. Mantén las respuestas concisas pero completas
5. Si el usuario parece estresado o con un problema urgente, prioriza la solución

## Formato de Respuestas
- Para listas: usa viñetas o numeración
- Para datos importantes: usa **negritas**
- Para alertas: usa emojis apropiados (⚠️ para advertencias, ✅ para éxito)
- Para montos: siempre incluye el símbolo $ y formatea con dos decimales

Recuerda: Tu objetivo es hacer la vida del usuario más fácil. Sé útil, preciso y amigable.`
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function getUserContext(supabase: Awaited<ReturnType<typeof createClient>>): Promise<AssistantContext | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user profile and organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, organization_id, organizations(name)')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const now = new Date()

  // Handle organizations which can be an object or array
  const org = profile.organizations as { name: string } | { name: string }[] | null
  const orgName = Array.isArray(org) ? org[0]?.name : org?.name

  return {
    organizationName: orgName || 'Mi Guardería',
    userName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuario',
    userRole: profile.role || 'owner',
    currentPage: 'dashboard',
    currentDate: now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    currentTime: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    language: 'es',
  }
}

async function saveMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  role: 'user' | 'assistant' | 'tool',
  content: string,
  metadata?: Record<string, unknown>
) {
  await supabase.from('ai_messages').insert({
    conversation_id: conversationId,
    role,
    content,
    metadata: metadata || {},
  })
}

async function getOrCreateConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  organizationId: string,
  existingId?: string
): Promise<string> {
  if (existingId) {
    // Verify conversation exists and belongs to user
    const { data } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', existingId)
      .eq('user_id', userId)
      .single()

    if (data) return existingId
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      user_id: userId,
      organization_id: organizationId,
      title: 'Nueva conversación',
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function getConversationHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  limit = 20
): Promise<Array<{ role: string; content: string }>> {
  const { data } = await supabase
    .from('ai_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data) return []

  // Return in chronological order
  return data.reverse().map((m: { role: string; content: string }) => ({
    role: m.role === 'tool' ? 'assistant' : m.role,
    content: m.content,
  }))
}

// =====================================================
// STREAMING HANDLER
// =====================================================

async function* streamAssistantResponse(
  messages: Array<{ role: string; content: string; tool_calls?: unknown[]; tool_call_id?: string }>,
  systemPrompt: string,
  onToolCall?: (toolCall: ToolCall) => Promise<unknown>,
  maxToolIterations = 3
): AsyncGenerator<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    yield `data: ${JSON.stringify({ type: 'error', error: 'API key no configurada' })}\n\n`
    return
  }

  // Format tools for OpenAI format
  const tools = allTools.map(t => ({
    type: t.type,
    function: t.function,
  }))

  // Keep track of all messages including tool calls/results
  const conversationMessages = [...messages]
  let iteration = 0

  while (iteration < maxToolIterations) {
    iteration++

    const requestBody = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationMessages,
      ],
      tools,
      tool_choice: 'auto',
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    }

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'ChildCare Pro AI Assistant',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[AI Assistant] OpenRouter error:', response.status, errorText)
        yield `data: ${JSON.stringify({ type: 'error', error: `Error del servicio AI: ${response.status}` })}\n\n`
        return
      }

      if (!response.body) {
        yield `data: ${JSON.stringify({ type: 'error', error: 'Sin respuesta del servicio' })}\n\n`
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      let currentToolCall: { id: string; name: string; arguments: string } | null = null
      let hasToolCalls = false
      const pendingToolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (jsonStr === '[DONE]') continue

          try {
            const data = JSON.parse(jsonStr)
            const delta = data.choices?.[0]?.delta
            const finishReason = data.choices?.[0]?.finish_reason

            if (!delta) continue

            // Content delta
            if (delta.content) {
              fullContent += delta.content
              yield `data: ${JSON.stringify({ type: 'content', delta: delta.content })}\n\n`
            }

            // Tool call handling
            if (delta.tool_calls) {
              hasToolCalls = true
              for (const tc of delta.tool_calls) {
                if (tc.index !== undefined) {
                  // New tool call or update existing
                  if (tc.id) {
                    currentToolCall = {
                      id: tc.id,
                      name: tc.function?.name || '',
                      arguments: '',
                    }
                  }
                  if (tc.function?.name && currentToolCall) {
                    currentToolCall.name = tc.function.name
                  }
                  if (tc.function?.arguments && currentToolCall) {
                    currentToolCall.arguments += tc.function.arguments
                  }
                }
              }
            }

            // Check for finish with tool calls
            if (finishReason === 'tool_calls' && currentToolCall) {
              // Parse accumulated arguments
              const parsedToolCall = {
                id: currentToolCall.id || `tool_${Date.now()}`,
                name: currentToolCall.name || '',
                arguments: JSON.parse(currentToolCall.arguments || '{}'),
              }
              pendingToolCalls.push(parsedToolCall)
              currentToolCall = null
            }

          } catch (parseError) {
            // Skip invalid JSON chunks
            continue
          }
        }
      }

      // If there were tool calls, execute them and continue the loop
      if (hasToolCalls && pendingToolCalls.length > 0) {
        // Build assistant message with tool calls
        const assistantToolCallsMessage = {
          role: 'assistant',
          content: fullContent || null,
          tool_calls: pendingToolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        }
        conversationMessages.push(assistantToolCallsMessage)

        // Execute each tool call and add results
        for (const toolCall of pendingToolCalls) {
          // Notify about tool call
          yield `data: ${JSON.stringify({ type: 'tool_call', tool: toolCall })}\n\n`

          let result: unknown = { error: 'No handler provided' }

          if (onToolCall) {
            result = await onToolCall(toolCall as ToolCall)
          }

          // Check if this requires confirmation (don't continue conversation, wait for user)
          if (result && typeof result === 'object' && 'requiresConfirmation' in result) {
            yield `data: ${JSON.stringify({ type: 'tool_result', tool_call_id: toolCall.id, result })}\n\n`
            yield `data: ${JSON.stringify({ type: 'done', fullContent, needsConfirmation: true })}\n\n`
            return
          }

          yield `data: ${JSON.stringify({ type: 'tool_result', tool_call_id: toolCall.id, result })}\n\n`

          // Add tool result message
          conversationMessages.push({
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: toolCall.id,
          })
        }

        // Continue the loop to get the model's response after tool execution
        continue
      }

      // No tool calls, we're done
      yield `data: ${JSON.stringify({ type: 'done', fullContent })}\n\n`
      return

    } catch (error) {
      console.error('[AI Assistant] Stream error:', error)
      yield `data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Error de conexión' })}\n\n`
      return
    }
  }

  // Max iterations reached
  yield `data: ${JSON.stringify({ type: 'done', fullContent: 'Se alcanzó el límite de iteraciones de herramientas.' })}\n\n`
}

// =====================================================
// MAIN HANDLER
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get user context
    const context = await getUserContext(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Perfil de usuario no encontrado' }, { status: 404 })
    }

    // Parse request
    const body: AIAssistantRequest = await request.json()
    const { message, conversationId: existingConversationId, context: requestContext } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
    }

    // Update context with request info
    if (requestContext?.currentPage) {
      context.currentPage = requestContext.currentPage
    }

    // Detect language from message
    const spanishWords = ['hola', 'buenos', 'qué', 'que', 'cómo', 'como', 'cuántos', 'cuantos', 'dónde', 'donde', 'quién', 'quien', 'por favor', 'gracias', 'necesito', 'puedes', 'ayuda']
    const isSpanish = spanishWords.some(word => message.toLowerCase().includes(word))
    context.language = isSpanish ? 'es' : 'en'

    // Get organization ID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    // Get or create conversation
    const conversationId = await getOrCreateConversation(
      supabase,
      user.id,
      profile.organization_id,
      existingConversationId
    )

    // Save user message
    await saveMessage(supabase, conversationId, 'user', message)

    // Get conversation history
    const history = await getConversationHistory(supabase, conversationId)

    // Add current message if not in history
    const messages = [
      ...history,
      { role: 'user', content: message },
    ]

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context)

    // Tool execution handler - passes organization context for data access
    const handleToolCall = async (toolCall: ToolCall): Promise<unknown> => {
      const { result, pendingConfirmation } = await executeTool(toolCall, {
        organizationId: profile.organization_id,
        supabase,
      })

      if (pendingConfirmation) {
        // Save pending action to database
        await supabase.from('ai_pending_actions').insert({
          conversation_id: conversationId,
          action_type: pendingConfirmation.action_type,
          action_params: pendingConfirmation.params,
          status: 'pending',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        })

        return {
          requiresConfirmation: true,
          ...pendingConfirmation,
        }
      }

      return result?.result
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let fullResponse = ''

        try {
          for await (const chunk of streamAssistantResponse(messages, systemPrompt, handleToolCall)) {
            controller.enqueue(encoder.encode(chunk))

            // Extract content for saving
            try {
              const data = JSON.parse(chunk.replace('data: ', '').trim())
              if (data.type === 'content' && data.delta) {
                fullResponse += data.delta
              }
            } catch {
              // Ignore parse errors for non-JSON chunks
            }
          }

          // Save assistant response
          if (fullResponse) {
            await saveMessage(supabase, conversationId, 'assistant', fullResponse)
          }

          // Send conversation ID in final message
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'meta', conversationId })}\n\n`))

        } catch (error) {
          console.error('[AI Assistant] Stream error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Error en streaming' })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('[AI Assistant] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

// =====================================================
// CONFIRM ACTION ENDPOINT
// =====================================================

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { actionId, confirm } = body

    if (!actionId) {
      return NextResponse.json({ error: 'actionId requerido' }, { status: 400 })
    }

    // Get pending action
    const { data: action, error: fetchError } = await supabase
      .from('ai_pending_actions')
      .select('*')
      .eq('id', actionId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !action) {
      return NextResponse.json({ error: 'Acción no encontrada o ya procesada' }, { status: 404 })
    }

    // Check if expired
    if (new Date(action.expires_at) < new Date()) {
      await supabase
        .from('ai_pending_actions')
        .update({ status: 'expired' })
        .eq('id', actionId)

      return NextResponse.json({ error: 'La acción ha expirado' }, { status: 410 })
    }

    if (confirm) {
      // Execute the confirmed action
      try {
        const result = await executeConfirmedAction(action.action_type, action.action_params)

        await supabase
          .from('ai_pending_actions')
          .update({
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            result,
          })
          .eq('id', actionId)

        return NextResponse.json({
          success: true,
          message: 'Acción ejecutada correctamente',
          result,
        })

      } catch (execError) {
        console.error('[AI Assistant] Action execution error:', execError)
        return NextResponse.json({
          error: execError instanceof Error ? execError.message : 'Error al ejecutar acción',
        }, { status: 500 })
      }
    } else {
      // Reject the action
      await supabase
        .from('ai_pending_actions')
        .update({ status: 'rejected' })
        .eq('id', actionId)

      return NextResponse.json({
        success: true,
        message: 'Acción cancelada',
      })
    }

  } catch (error) {
    console.error('[AI Assistant] Confirm error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

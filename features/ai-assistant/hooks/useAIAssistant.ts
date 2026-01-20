'use client'

// =====================================================
// AI Assistant Hook
// =====================================================
// Manages chat state, streaming, and tool execution

import { useState, useCallback, useRef } from 'react'
import type { AIMessage, AIChatState, PendingConfirmation, ToolCall } from '../types'

interface UseAIAssistantOptions {
  onConfirmationRequired?: (confirmation: PendingConfirmation) => void
  onToolExecuted?: (toolName: string, result: unknown) => void
}

export function useAIAssistant(options: UseAIAssistantOptions = {}) {
  const [state, setState] = useState<AIChatState>({
    messages: [],
    isLoading: false,
    isStreaming: false,
    error: null,
    conversationId: null,
    pendingAction: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const streamingContentRef = useRef<string>('')

  // Send message with streaming
  const sendMessage = useCallback(async (
    content: string,
    context?: { currentPage: string; selectedEntity?: { type: string; id: string } }
  ) => {
    if (!content.trim() || state.isLoading) return

    // Create user message
    const userMessage: AIMessage = {
      id: `user_${Date.now()}`,
      conversation_id: state.conversationId || '',
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    }

    // Add user message and set loading
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      isStreaming: true,
      error: null,
    }))

    // Create placeholder for assistant response
    const assistantMessageId = `assistant_${Date.now()}`
    const assistantMessage: AIMessage = {
      id: assistantMessageId,
      conversation_id: state.conversationId || '',
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, assistantMessage],
    }))

    // Reset streaming content
    streamingContentRef.current = ''

    // Create abort controller
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          conversationId: state.conversationId,
          context,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error en la solicitud')
      }

      if (!response.body) {
        throw new Error('No se recibió respuesta del servidor')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          try {
            const event = JSON.parse(jsonStr)

            switch (event.type) {
              case 'content':
                // Update streaming content
                streamingContentRef.current += event.delta
                setState(prev => ({
                  ...prev,
                  messages: prev.messages.map(m =>
                    m.id === assistantMessageId
                      ? { ...m, content: streamingContentRef.current }
                      : m
                  ),
                }))
                break

              case 'tool_call':
                // Tool is being called
                const toolCall = event.tool as ToolCall
                setState(prev => ({
                  ...prev,
                  messages: prev.messages.map(m =>
                    m.id === assistantMessageId
                      ? { ...m, tool_calls: [...(m.tool_calls || []), toolCall] }
                      : m
                  ),
                }))
                break

              case 'tool_result':
                // Tool execution completed
                if (event.result?.requiresConfirmation) {
                  const confirmation = event.result as PendingConfirmation
                  setState(prev => ({
                    ...prev,
                    pendingAction: confirmation,
                  }))
                  options.onConfirmationRequired?.(confirmation)
                } else {
                  options.onToolExecuted?.(event.tool_call_id, event.result)
                }
                break

              case 'confirmation_required':
                // Action requires user confirmation
                const pendingAction = event.action as PendingConfirmation
                setState(prev => ({
                  ...prev,
                  pendingAction,
                }))
                options.onConfirmationRequired?.(pendingAction)
                break

              case 'meta':
                // Update conversation ID
                if (event.conversationId) {
                  setState(prev => ({
                    ...prev,
                    conversationId: event.conversationId,
                  }))
                }
                break

              case 'error':
                throw new Error(event.error)

              case 'done':
                // Streaming complete
                break
            }
          } catch (parseError) {
            // Skip invalid JSON
            continue
          }
        }
      }

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Request was cancelled
        return
      }

      console.error('[useAIAssistant] Error:', error)

      // Update error state
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error desconocido',
        messages: prev.messages.map(m =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: streamingContentRef.current || 'Lo siento, hubo un error. Por favor intenta de nuevo.',
              }
            : m
        ),
      }))
    } finally {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false,
      }))
      abortControllerRef.current = null
    }
  }, [state.conversationId, state.isLoading, options])

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  // Confirm pending action
  const confirmAction = useCallback(async (actionId: string, confirm: boolean) => {
    if (!state.pendingAction) return

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, confirm }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al confirmar acción')
      }

      // Add confirmation result to chat
      const confirmationMessage: AIMessage = {
        id: `system_${Date.now()}`,
        conversation_id: state.conversationId || '',
        role: 'assistant',
        content: confirm
          ? `✅ **Acción ejecutada:** ${result.message || 'Completado exitosamente'}`
          : `❌ **Acción cancelada:** La operación fue cancelada por el usuario.`,
        created_at: new Date().toISOString(),
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, confirmationMessage],
        pendingAction: null,
      }))

      return result

    } catch (error) {
      console.error('[useAIAssistant] Confirm error:', error)

      const errorMessage: AIMessage = {
        id: `error_${Date.now()}`,
        conversation_id: state.conversationId || '',
        role: 'assistant',
        content: `⚠️ **Error:** ${error instanceof Error ? error.message : 'No se pudo procesar la acción'}`,
        created_at: new Date().toISOString(),
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        pendingAction: null,
      }))

      throw error
    }
  }, [state.conversationId, state.pendingAction])

  // Clear chat history
  const clearChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: null,
      conversationId: null,
      pendingAction: null,
    })
  }, [])

  // Add initial welcome message
  const initializeChat = useCallback((welcomeMessage?: string) => {
    const defaultWelcome = `¡Hola! Soy tu asistente de ChildCare Pro. Puedo ayudarte con:

- **Asistencia**: Ver quién está presente, registrar entradas/salidas
- **Familias y Niños**: Buscar información, ver balances
- **Facturación**: Facturas pendientes, recordatorios de pago
- **Ratios DCF**: Verificar cumplimiento de ratios
- **Incidentes**: Reportar y dar seguimiento
- **Análisis**: Resumen del día, alertas activas

¿En qué puedo ayudarte hoy?`

    const welcomeMsg: AIMessage = {
      id: 'welcome',
      conversation_id: '',
      role: 'assistant',
      content: welcomeMessage || defaultWelcome,
      created_at: new Date().toISOString(),
    }

    setState(prev => ({
      ...prev,
      messages: [welcomeMsg],
    }))
  }, [])

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
    error: state.error,
    conversationId: state.conversationId,
    pendingAction: state.pendingAction,

    // Actions
    sendMessage,
    cancelRequest,
    confirmAction,
    clearChat,
    initializeChat,
  }
}

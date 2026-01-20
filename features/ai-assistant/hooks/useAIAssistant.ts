'use client'

// =====================================================
// AI Assistant Hook
// =====================================================
// Manages chat state, streaming, and tool execution
// Features: Human-like typing effect with chunked messages

import { useState, useCallback, useRef } from 'react'
import type { AIMessage, AIChatState, PendingConfirmation, ToolCall } from '../types'

interface UseAIAssistantOptions {
  onConfirmationRequired?: (confirmation: PendingConfirmation) => void
  onToolExecuted?: (toolName: string, result: unknown) => void
}

// Language detection - checks if message is primarily Spanish
function detectLanguage(text: string): 'es' | 'en' {
  const spanishIndicators = [
    /¿/, /¡/, /ñ/i,
    /\b(hola|gracias|por favor|cómo|qué|cuántos|cuántas|dónde|cuál|quién)\b/i,
    /\b(está|están|tengo|tienes|tiene|hay|son|soy|eres|es)\b/i,
    /\b(buenos|buenas|días|noches|tardes)\b/i,
    /\b(niños|niñas|familia|factura|asistencia|salón|personal)\b/i,
  ]

  const spanishMatches = spanishIndicators.filter(pattern => pattern.test(text)).length
  return spanishMatches >= 1 ? 'es' : 'en'
}

// Split text into natural chunks (paragraphs, then sentences if needed)
function splitIntoChunks(text: string, maxChunkLength: number = 300): string[] {
  // First, split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())

  const chunks: string[] = []

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChunkLength) {
      chunks.push(paragraph)
    } else {
      // Split long paragraphs by sentences
      const sentences = paragraph.split(/(?<=[.!?])\s+/)
      let currentChunk = ''

      for (const sentence of sentences) {
        if ((currentChunk + ' ' + sentence).length <= maxChunkLength) {
          currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence
        } else {
          if (currentChunk) chunks.push(currentChunk)
          currentChunk = sentence
        }
      }
      if (currentChunk) chunks.push(currentChunk)
    }
  }

  return chunks.length > 0 ? chunks : [text]
}

// Calculate typing delay based on chunk length (simulate human reading/typing speed)
function calculateTypingDelay(chunkLength: number): number {
  // Base delay + variable based on length
  // Roughly 50ms per character, but capped
  const baseDelay = 800
  const variableDelay = Math.min(chunkLength * 15, 2000)
  return baseDelay + variableDelay
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

  // Additional state for typing indicator
  const [isTyping, setIsTyping] = useState(false)
  const [typingLanguage, setTypingLanguage] = useState<'es' | 'en'>('es')

  const abortControllerRef = useRef<AbortController | null>(null)
  const streamingContentRef = useRef<string>('')
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Reveal content in chunks with typing effect
  const revealContentInChunks = useCallback(async (
    fullContent: string,
    messageId: string,
    userLanguage: 'es' | 'en'
  ) => {
    const chunks = splitIntoChunks(fullContent)

    // If only one small chunk, show immediately
    if (chunks.length === 1 && fullContent.length < 200) {
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m =>
          m.id === messageId ? { ...m, content: fullContent } : m
        ),
      }))
      setIsTyping(false)
      return
    }

    let revealedContent = ''
    setTypingLanguage(userLanguage)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const isLastChunk = i === chunks.length - 1

      // Show typing indicator before each chunk (except the first which already shows it)
      if (i > 0) {
        setIsTyping(true)
        await new Promise(resolve => {
          typingTimeoutRef.current = setTimeout(resolve, calculateTypingDelay(chunk.length))
        })
      }

      // Add the chunk to revealed content
      revealedContent = revealedContent
        ? revealedContent + '\n\n' + chunk
        : chunk

      // Update the message with revealed content
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m =>
          m.id === messageId ? { ...m, content: revealedContent } : m
        ),
      }))

      // Brief pause between chunks to simulate natural typing
      if (!isLastChunk) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    setIsTyping(false)
  }, [])

  // Send message with streaming
  const sendMessage = useCallback(async (
    content: string,
    context?: { currentPage: string; selectedEntity?: { type: string; id: string } }
  ) => {
    if (!content.trim() || state.isLoading) return

    // Detect language from user's message
    const detectedLanguage = detectLanguage(content)
    setTypingLanguage(detectedLanguage)

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

    // Reset streaming content and show typing indicator
    streamingContentRef.current = ''
    setIsTyping(true)

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
                // Accumulate streaming content
                streamingContentRef.current += event.delta
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
                // Streaming complete - now reveal content in chunks
                if (streamingContentRef.current) {
                  setState(prev => ({ ...prev, isStreaming: false }))
                  await revealContentInChunks(
                    streamingContentRef.current,
                    assistantMessageId,
                    detectedLanguage
                  )
                }
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
        setIsTyping(false)
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
                content: streamingContentRef.current ||
                  (detectedLanguage === 'es'
                    ? 'Lo siento, hubo un error. Por favor intenta de nuevo.'
                    : 'Sorry, there was an error. Please try again.'),
              }
            : m
        ),
      }))
      setIsTyping(false)
    } finally {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false,
      }))
      abortControllerRef.current = null
    }
  }, [state.conversationId, state.isLoading, options, revealContentInChunks])

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsTyping(false)
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
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsTyping(false)
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

• **Asistencia**: Ver quién está presente, registrar entradas/salidas
• **Familias y Niños**: Buscar información, ver balances
• **Facturación**: Facturas pendientes, recordatorios de pago
• **Ratios DCF**: Verificar cumplimiento de ratios
• **Incidentes**: Reportar y dar seguimiento
• **Análisis**: Resumen del día, alertas activas

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
    isTyping,
    typingLanguage,
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

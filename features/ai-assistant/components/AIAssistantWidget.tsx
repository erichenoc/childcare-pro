'use client'

// =====================================================
// AI Assistant Widget
// =====================================================
// Floating chat widget for AI assistant

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { useAIAssistant } from '../hooks/useAIAssistant'
import { ActionConfirmationModal } from './ActionConfirmationModal'
import type { PendingConfirmation } from '../types'

// Quick action suggestions
const QUICK_ACTIONS = [
  { icon: '📊', label: 'Resumen del día', prompt: '¿Cómo va el día de hoy?' },
  { icon: '👶', label: 'Asistencia', prompt: '¿Cuántos niños hay presentes hoy?' },
  { icon: '💰', label: 'Pagos pendientes', prompt: '¿Hay facturas vencidas?' },
  { icon: '⚠️', label: 'Alertas', prompt: '¿Hay alguna alerta o problema?' },
]

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  const {
    messages,
    isLoading,
    isStreaming,
    isTyping,
    typingLanguage,
    error,
    pendingAction,
    sendMessage,
    confirmAction,
    clearChat,
    initializeChat,
  } = useAIAssistant({
    onConfirmationRequired: (confirmation) => {
      setShowConfirmation(true)
    },
  })

  // Typing indicator text based on language
  const typingText = typingLanguage === 'es' ? 'Escribiendo...' : 'Typing...'

  // Initialize chat with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      initializeChat()
    }
  }, [messages.length, initializeChat])

  // Auto-scroll to bottom when messages change or typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming, isTyping])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Show confirmation modal when pending action is set
  useEffect(() => {
    if (pendingAction) {
      setShowConfirmation(true)
    }
  }, [pendingAction])

  // Get current page context
  const getPageContext = (path: string): string => {
    if (path.includes('/children')) return 'Gestión de Niños'
    if (path.includes('/families')) return 'Gestión de Familias'
    if (path.includes('/staff')) return 'Gestión de Personal'
    if (path.includes('/classrooms')) return 'Gestión de Salones'
    if (path.includes('/attendance')) return 'Control de Asistencia'
    if (path.includes('/billing')) return 'Facturación'
    if (path.includes('/communication')) return 'Comunicación'
    if (path.includes('/incidents')) return 'Incidentes'
    if (path.includes('/reports')) return 'Reportes'
    if (path.includes('/settings')) return 'Configuración'
    return 'Dashboard'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    sendMessage(input, {
      currentPage: getPageContext(pathname),
    })
    setInput('')
  }

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt, {
      currentPage: getPageContext(pathname),
    })
  }

  const handleConfirmAction = async (confirmed: boolean) => {
    if (!pendingAction) return

    try {
      await confirmAction(pendingAction.action_id, confirmed)
    } catch (error) {
      console.error('Confirmation error:', error)
    } finally {
      setShowConfirmation(false)
    }
  }

  const handleClearChat = () => {
    clearChat()
    initializeChat()
  }

  // Format message content with markdown-like styling
  const formatContent = (content: string) => {
    // Bold
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Bullet points
    formatted = formatted.replace(/^- /gm, '• ')
    // Line breaks
    formatted = formatted.split('\n').join('<br/>')

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-700 dark:bg-gray-600 rotate-90'
            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-2xl hover:scale-110'
        }`}
        title="Asistente IA"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-white" />
            <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[70vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-4 flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">Asistente ChildCare</h3>
              <p className="text-blue-100 text-sm">
                Siempre listo para ayudarte
              </p>
            </div>
            <button
              onClick={handleClearChat}
              className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition"
              title="Limpiar chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] bg-gray-50 dark:bg-gray-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {formatContent(message.content)}
                  </div>

                </div>
              </div>
            ))}

            {/* Typing indicator - shows when assistant is "typing" */}
            {(isStreaming || isTyping) && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                      {typingText}
                    </span>
                    <div className="flex gap-1">
                      <div
                        className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Sugerencias rápidas:
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex items-center gap-1.5 text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition"
                  >
                    <span>{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && pendingAction && (
        <ActionConfirmationModal
          action={pendingAction}
          onConfirm={() => handleConfirmAction(true)}
          onCancel={() => handleConfirmAction(false)}
        />
      )}
    </>
  )
}

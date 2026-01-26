'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react'
import { guardianAuthService } from '@/features/family-portal/services/guardian-auth.service'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type Child = {
  id: string
  firstName: string
  lastName: string
}

export default function FamilyPortalChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [guardian, setGuardian] = useState<{
    id: string
    firstName: string
    lastName: string
    email: string
    organizationId: string
    children: Child[]
  } | null>(null)
  const [verifiedChildren, setVerifiedChildren] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadGuardian() {
      const data = await guardianAuthService.getCurrentGuardian()
      if (data) {
        setGuardian(data)
        // Add welcome message
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `Hola ${data.firstName}! Soy Maya, tu asistente virtual de ChildCare Pro. Estoy aqui para ayudarte con cualquier pregunta sobre tus hijos, facturas, horarios y mas.\n\nPor seguridad, antes de darte informacion especifica sobre un nino, necesitare que me confirmes su nombre.\n\nComo puedo ayudarte hoy?`,
          timestamp: new Date(),
        }])
      }
    }
    loadGuardian()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !guardian) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/family-portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          guardianId: guardian.id,
          organizationId: guardian.organizationId,
          childIds: guardian.children.map(c => c.id),
          verifiedChildren,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) throw new Error('Error en la respuesta')

      const data = await response.json()

      // Update verified children if provided
      if (data.verifiedChildren) {
        setVerifiedChildren(data.verifiedChildren)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setVerifiedChildren([])
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hola ${guardian?.firstName}! Soy Maya, tu asistente virtual. Como puedo ayudarte hoy?`,
      timestamp: new Date(),
    }])
  }

  return (
    <div className="h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)] flex flex-col bg-[#e6e7ee] rounded-2xl sm:rounded-3xl shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] overflow-hidden">
      {/* Header - Neumorphic with Gradient */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 sm:p-4 flex items-center justify-between shadow-[0_4px_8px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Bot className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-1 sm:gap-2">
              Maya
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            </h1>
            <p className="text-purple-100 text-xs sm:text-sm">Tu asistente virtual</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 sm:p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200"
          title="Nueva conversacion"
        >
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Messages - Neumorphic Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-[2px_2px_4px_#b8b9be,-2px_-2px_4px_#ffffff]">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            )}

            <div
              className={`
                max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3
                ${message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff]'
                  : 'bg-[#e6e7ee] text-gray-700 rounded-bl-md shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff]'
                }
              `}
            >
              <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                {message.timestamp.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-[2px_2px_4px_#b8b9be,-2px_-2px_4px_#ffffff]">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-[2px_2px_4px_#b8b9be,-2px_-2px_4px_#ffffff]">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="bg-[#e6e7ee] rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff]">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - Neumorphic */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4"
      >
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#e6e7ee] rounded-xl shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] text-gray-700 placeholder-gray-400 outline-none focus:shadow-[inset_6px_6px_12px_#b8b9be,inset_-6px_-6px_12px_#ffffff] transition-shadow duration-200 text-sm sm:text-base"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] hover:shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Maya puede responder preguntas sobre tus hijos, facturas, horarios y mas
        </p>
      </form>
    </div>
  )
}

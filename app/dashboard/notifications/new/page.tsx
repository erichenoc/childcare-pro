'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Send,
  Mail,
  Smartphone,
  MessageSquare,
  Clock,
  Users,
  UserCheck,
  Baby,
  ArrowLeft,
  FileText,
  AlertTriangle,
  Loader2,
  Check,
} from 'lucide-react'
import {
  notificationsService,
  type NotificationTemplate,
  type NotificationType,
  type NotificationPriority,
  type RecipientType,
  type TemplateCategory,
} from '@/features/notifications/services/notifications.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassTextarea,
} from '@/shared/components/ui'

const RECIPIENT_OPTIONS: { value: RecipientType; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'Todos (Padres y Personal)', icon: Users },
  { value: 'parents', label: 'Solo Padres', icon: Baby },
  { value: 'staff', label: 'Solo Personal', icon: UserCheck },
  { value: 'specific', label: 'Seleccionar Destinatarios', icon: Check },
]

const PRIORITY_OPTIONS: { value: NotificationPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Baja', color: 'text-gray-600' },
  { value: 'normal', label: 'Normal', color: 'text-blue-600' },
  { value: 'high', label: 'Alta', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgente', color: 'text-red-600' },
]

const CHANNEL_OPTIONS: { value: NotificationType; label: string; icon: React.ElementType }[] = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'push', label: 'Push', icon: Bell },
  { value: 'sms', label: 'SMS', icon: Smartphone },
  { value: 'in_app', label: 'In-App', icon: MessageSquare },
]

export default function NewNotificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetType = searchParams?.get('type') as TemplateCategory | null

  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipientType, setRecipientType] = useState<RecipientType>('all')
  const [priority, setPriority] = useState<NotificationPriority>('normal')
  const [channels, setChannels] = useState<NotificationType[]>(['email', 'push'])
  const [scheduledAt, setScheduledAt] = useState('')
  const [isScheduled, setIsScheduled] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    // Pre-select template based on URL parameter
    if (presetType && templates.length > 0) {
      const template = templates.find(t => t.category === presetType)
      if (template) {
        handleTemplateSelect(template.id)
      }
    }
  }, [presetType, templates])

  async function loadTemplates() {
    try {
      setIsLoading(true)
      const data = notificationsService.getMockTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleTemplateSelect(templateId: string) {
    setSelectedTemplate(templateId)
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSubject(template.subject)
      setBody(template.body)
      // Set priority based on category
      if (template.category === 'emergency') {
        setPriority('urgent')
        setChannels(['email', 'push', 'sms'])
      }
    }
  }

  function toggleChannel(channel: NotificationType) {
    setChannels(prev => {
      if (prev.includes(channel)) {
        // Don't allow removing all channels
        if (prev.length === 1) return prev
        return prev.filter(c => c !== channel)
      }
      return [...prev, channel]
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) {
      alert('Por favor complete el asunto y el mensaje')
      return
    }

    try {
      setIsSending(true)
      // In production, this would call the actual service
      // await notificationsService.sendBulkNotification(...)

      // Simulate sending
      await new Promise(resolve => setTimeout(resolve, 1500))

      alert('Notificación enviada exitosamente')
      router.push('/dashboard/notifications')
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Error al enviar la notificación')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/notifications">
          <GlassButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </GlassButton>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Notificación</h1>
          <p className="text-gray-500">
            Envía un mensaje a padres y/o personal
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <GlassCardTitle>Usar Plantilla (Opcional)</GlassCardTitle>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <GlassSelect
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                >
                  <option value="">Seleccionar plantilla...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </GlassSelect>
                <p className="text-sm text-gray-500 mt-2">
                  Las plantillas contienen variables como {'{{child_name}}'} que serán reemplazadas automáticamente.
                </p>
              </GlassCardContent>
            </GlassCard>

            {/* Message Content */}
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <GlassCardTitle>Contenido del Mensaje</GlassCardTitle>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asunto *
                    </label>
                    <GlassInput
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ej: Recordatorio importante"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje *
                    </label>
                    <GlassTextarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Escribe el mensaje que deseas enviar..."
                      rows={6}
                      required
                    />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Recipients */}
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <GlassCardTitle>Destinatarios</GlassCardTitle>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid grid-cols-2 gap-3">
                  {RECIPIENT_OPTIONS.map(option => {
                    const Icon = option.icon
                    const isSelected = recipientType === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRecipientType(option.value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                            {option.label}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Sidebar Options */}
          <div className="space-y-6">
            {/* Channels */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Canales de Envío</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-2">
                  {CHANNEL_OPTIONS.map(option => {
                    const Icon = option.icon
                    const isSelected = channels.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleChannel(option.value)}
                        className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                          <span className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                            {option.label}
                          </span>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-primary-600" />}
                      </button>
                    )
                  })}
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Priority */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Prioridad</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <GlassSelect
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                >
                  {PRIORITY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </GlassSelect>
                {priority === 'urgent' && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                      <p className="text-sm text-red-700">
                        Las notificaciones urgentes se envían inmediatamente por todos los canales disponibles.
                      </p>
                    </div>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>

            {/* Schedule */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Programar Envío</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Programar para más tarde</span>
                  </label>
                  {isScheduled && (
                    <GlassInput
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Submit */}
            <GlassButton
              type="submit"
              className="w-full"
              disabled={isSending || !subject.trim() || !body.trim()}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : isScheduled ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Programar Envío
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Ahora
                </>
              )}
            </GlassButton>
          </div>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  Users,
  UserCheck,
  Building,
  Calendar,
  AlertTriangle,
  Loader2,
  Copy,
  RefreshCw,
} from 'lucide-react'
import {
  notificationsService,
  type Notification,
  type NotificationType,
  type NotificationStatus,
} from '@/features/notifications/services/notifications.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
} from '@/shared/components/ui'

interface PageProps {
  params: Promise<{ id: string }>
}

const TYPE_INFO: Record<NotificationType, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  email: { label: 'Email', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Mail },
  push: { label: 'Push', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Bell },
  sms: { label: 'SMS', color: 'text-green-700', bgColor: 'bg-green-100', icon: Smartphone },
  in_app: { label: 'In-App', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: MessageSquare },
}

const STATUS_INFO: Record<NotificationStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  sent: { label: 'Enviado', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Send },
  delivered: { label: 'Entregado', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  failed: { label: 'Fallido', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
  read: { label: 'Leido', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: Eye },
}

const PRIORITY_INFO: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Baja', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  normal: { label: 'Normal', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  high: { label: 'Alta', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  urgent: { label: 'Urgente', color: 'text-red-700', bgColor: 'bg-red-100' },
}

export default function NotificationDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const [notification, setNotification] = useState<Notification | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadNotification()
  }, [id])

  async function loadNotification() {
    try {
      setIsLoading(true)
      // Try to get from service first, fallback to mock
      const mockNotifications = notificationsService.getMockNotifications()
      const found = mockNotifications.find(n => n.id === id)
      setNotification(found || null)
    } catch (error) {
      console.error('Error loading notification:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRecipientLabel = (notif: Notification) => {
    switch (notif.recipient_type) {
      case 'all':
        return 'Todos (Padres y Personal)'
      case 'parents':
        return 'Todos los Padres'
      case 'staff':
        return 'Todo el Personal'
      case 'specific':
        return `${notif.recipient_ids.length} destinatarios especificos`
      default:
        return 'Desconocido'
    }
  }

  const getRecipientIcon = (type: string) => {
    switch (type) {
      case 'all':
        return Building
      case 'parents':
        return Users
      case 'staff':
        return UserCheck
      default:
        return Users
    }
  }

  const copyToClipboard = async () => {
    if (!notification) return
    const text = `${notification.subject}\n\n${notification.body}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!notification) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Notificacion No Encontrada
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          No se pudo encontrar la notificacion solicitada.
        </p>
        <Link href="/dashboard/notifications">
          <GlassButton variant="secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Notificaciones
          </GlassButton>
        </Link>
      </div>
    )
  }

  const typeInfo = TYPE_INFO[notification.type]
  const statusInfo = STATUS_INFO[notification.status]
  const priorityInfo = PRIORITY_INFO[notification.priority]
  const TypeIcon = typeInfo.icon
  const StatusIcon = statusInfo.icon
  const RecipientIcon = getRecipientIcon(notification.recipient_type)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/notifications">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Detalle de Notificacion
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {formatShortDate(notification.created_at)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <GlassButton variant="secondary" onClick={copyToClipboard}>
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </>
            )}
          </GlassButton>
          {notification.status === 'pending' && (
            <GlassButton variant="primary">
              <Send className="w-4 h-4 mr-2" />
              Enviar Ahora
            </GlassButton>
          )}
          {notification.status === 'failed' && (
            <GlassButton variant="primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </GlassButton>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Type */}
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${typeInfo.bgColor} flex items-center justify-center`}>
              <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tipo</p>
              <p className="font-semibold text-gray-900 dark:text-white">{typeInfo.label}</p>
            </div>
          </div>
        </GlassCard>

        {/* Status */}
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${statusInfo.bgColor} flex items-center justify-center`}>
              <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
              <p className="font-semibold text-gray-900 dark:text-white">{statusInfo.label}</p>
            </div>
          </div>
        </GlassCard>

        {/* Priority */}
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${priorityInfo.bgColor} flex items-center justify-center`}>
              <AlertTriangle className={`w-5 h-5 ${priorityInfo.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Prioridad</p>
              <p className="font-semibold text-gray-900 dark:text-white">{priorityInfo.label}</p>
            </div>
          </div>
        </GlassCard>

        {/* Recipients */}
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <RecipientIcon className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Destinatarios</p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {notification.recipient_type === 'specific'
                  ? `${notification.recipient_ids.length} personas`
                  : notification.recipient_type === 'all' ? 'Todos'
                  : notification.recipient_type === 'parents' ? 'Padres'
                  : 'Personal'
                }
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Notification Content */}
        <div className="lg:col-span-2">
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${typeInfo.bgColor} flex items-center justify-center`}>
                  <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                </div>
                <div>
                  <GlassCardTitle>Contenido del Mensaje</GlassCardTitle>
                  <p className="text-sm text-gray-500">{typeInfo.label}</p>
                </div>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Asunto
                  </label>
                  <div className="mt-1 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {notification.subject}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Mensaje
                  </label>
                  <div className="mt-1 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 min-h-[150px]">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {notification.body}
                    </p>
                  </div>
                </div>

                {/* Additional Data */}
                {notification.data && Object.keys(notification.data).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Datos Adicionales
                    </label>
                    <div className="mt-1 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <pre className="text-sm text-gray-600 dark:text-gray-400 overflow-x-auto">
                        {JSON.stringify(notification.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Sidebar - Details */}
        <div className="space-y-6">
          {/* Timeline */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Linea de Tiempo</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                {/* Created */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Creada</p>
                    <p className="text-sm text-gray-500">{formatDate(notification.created_at)}</p>
                  </div>
                </div>

                {/* Scheduled */}
                {notification.scheduled_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Programada para</p>
                      <p className="text-sm text-gray-500">{formatDate(notification.scheduled_at)}</p>
                    </div>
                  </div>
                )}

                {/* Sent */}
                {notification.sent_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Send className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Enviada</p>
                      <p className="text-sm text-gray-500">{formatDate(notification.sent_at)}</p>
                    </div>
                  </div>
                )}

                {/* Status indicator */}
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${statusInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{statusInfo.label}</p>
                    <p className="text-sm text-gray-500">Estado actual</p>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Recipients Detail */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Destinatarios</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <RecipientIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getRecipientLabel(notification)}
                    </p>
                    <p className="text-sm text-gray-500">Grupo de destinatarios</p>
                  </div>
                </div>

                {notification.recipient_type === 'specific' && notification.recipient_ids.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {notification.recipient_ids.length} personas seleccionadas manualmente
                    </p>
                  </div>
                )}
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard variant="clear" className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Acciones</h3>
                <div className="mt-2 space-y-2">
                  <Link href={`/dashboard/notifications/new?duplicate=${notification.id}`}>
                    <GlassButton variant="ghost" size="sm" className="w-full justify-start">
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicar Notificacion
                    </GlassButton>
                  </Link>
                  <Link href="/dashboard/notifications">
                    <GlassButton variant="ghost" size="sm" className="w-full justify-start">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver al Historial
                    </GlassButton>
                  </Link>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

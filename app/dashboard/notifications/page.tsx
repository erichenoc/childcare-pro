'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  Send,
  Mail,
  Smartphone,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  UserCheck,
  AlertTriangle,
  Plus,
  FileText,
  BarChart3,
  Loader2,
  Search,
  Filter,
} from 'lucide-react'
import {
  notificationsService,
  type Notification,
  type NotificationStats,
  type NotificationType,
  type NotificationStatus,
} from '@/features/notifications/services/notifications.service'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
} from '@/shared/components/ui'
import { useTranslations } from '@/shared/lib/i18n'

export default function NotificationsPage() {
  const t = useTranslations()

  const TYPE_INFO: Record<NotificationType, { label: string; color: string; icon: React.ElementType }> = {
    email: { label: 'Email', color: 'bg-blue-100 text-blue-700', icon: Mail },
    push: { label: 'Push', color: 'bg-purple-100 text-purple-700', icon: Bell },
    sms: { label: 'SMS', color: 'bg-green-100 text-green-700', icon: Smartphone },
    in_app: { label: 'In-App', color: 'bg-orange-100 text-orange-700', icon: MessageSquare },
  }

  const STATUS_INFO: Record<NotificationStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: t.notifications.pending, color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    sent: { label: t.notifications.sentStatus, color: 'bg-blue-100 text-blue-700', icon: Send },
    delivered: { label: t.billing.sent, color: 'bg-green-100 text-green-700', icon: CheckCircle },
    failed: { label: t.notifications.failed, color: 'bg-red-100 text-red-700', icon: XCircle },
    read: { label: t.communication.read, color: 'bg-emerald-100 text-emerald-700', icon: Eye },
  }
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<NotificationStatus | 'all'>('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      // Use mock data for development
      const notifData = notificationsService.getMockNotifications()
      const statsData = notificationsService.getMockStats()
      setNotifications(notifData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRecipientLabel = (notification: Notification) => {
    switch (notification.recipient_type) {
      case 'all':
        return t.common.all
      case 'parents':
        return t.communication.audienceParents
      case 'staff':
        return t.staff.title
      case 'specific':
        return `${notification.recipient_ids.length} ${t.notifications.recipients.toLowerCase()}`
      default:
        return t.common.unassigned
    }
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch =
      notif.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.body.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || notif.type === filterType
    const matchesStatus = filterStatus === 'all' || notif.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.notifications.title}</h1>
          <p className="text-gray-500">
            {t.notifications.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/notifications/templates">
            <GlassButton variant="secondary">
              <FileText className="w-4 h-4 mr-2" />
              {t.communication.compose}
            </GlassButton>
          </Link>
          <Link href="/dashboard/notifications/new">
            <GlassButton>
              <Plus className="w-4 h-4 mr-2" />
              {t.notifications.newNotification}
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard variant="clear" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total_sent}</p>
                <p className="text-sm text-gray-500">{t.notifications.sent}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="clear" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.delivery_rate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Tasa de Entrega</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="clear" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.read_rate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Tasa de Lectura</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="clear" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
                <p className="text-sm text-gray-500">Fallidas</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/notifications/new?type=announcement">
          <GlassCard variant="clear" className="p-4 hover:shadow-neu-inset transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">{t.notifications.announcement}</span>
            </div>
          </GlassCard>
        </Link>

        <Link href="/dashboard/notifications/new?type=reminder">
          <GlassCard variant="clear" className="p-4 hover:shadow-neu-inset transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">{t.notifications.reminder}</span>
            </div>
          </GlassCard>
        </Link>

        <Link href="/dashboard/notifications/new?type=billing">
          <GlassCard variant="clear" className="p-4 hover:shadow-neu-inset transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Aviso de Pago</span>
            </div>
          </GlassCard>
        </Link>

        <Link href="/dashboard/notifications/new?type=emergency">
          <GlassCard variant="clear" className="p-4 hover:shadow-neu-inset transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">{t.notifications.alert}</span>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Filters */}
      <GlassCard variant="clear" className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <GlassInput
              type="text"
              placeholder={t.notifications.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <GlassSelect
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
              className="w-32"
              options={[
                { value: 'all', label: t.notifications.all },
                { value: 'email', label: 'Email' },
                { value: 'push', label: 'Push' },
                { value: 'sms', label: 'SMS' },
                { value: 'in_app', label: 'In-App' },
              ]}
            />
            <GlassSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as NotificationStatus | 'all')}
              className="w-36"
              options={[
                { value: 'all', label: t.notifications.all },
                { value: 'pending', label: t.notifications.pending },
                { value: 'sent', label: t.notifications.sentStatus },
                { value: 'delivered', label: t.billing.sent },
                { value: 'read', label: t.communication.read },
                { value: 'failed', label: t.notifications.failed },
              ]}
            />
          </div>
        </div>
      </GlassCard>

      {/* Notifications List */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <GlassCardTitle>{t.notifications.history}</GlassCardTitle>
              <p className="text-sm text-gray-500">
                {filteredNotifications.length} {t.notifications.title.toLowerCase()}
              </p>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const typeInfo = TYPE_INFO[notif.type]
              const statusInfo = STATUS_INFO[notif.status]
              const TypeIcon = typeInfo.icon
              const StatusIcon = statusInfo.icon

              return (
                <Link
                  key={notif.id}
                  href={`/dashboard/notifications/${notif.id}`}
                  className="block"
                >
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className={`w-10 h-10 rounded-lg ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {notif.priority === 'urgent' && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                {t.notifications.urgent}
                              </span>
                            )}
                            {notif.priority === 'high' && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                {t.notifications.normal}
                              </span>
                            )}
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">{notif.subject}</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{notif.body}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {getRecipientLabel(notif)}
                            </span>
                            <span>
                              {notif.scheduled_at
                                ? `${t.notifications.scheduled}: ${formatDate(notif.scheduled_at)}`
                                : notif.sent_at
                                  ? formatDate(notif.sent_at)
                                  : t.notifications.pending
                              }
                            </span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}

            {filteredNotifications.length === 0 && (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t.notifications.noNotifications}
                </h3>
                <p className="text-gray-500 mb-4">
                  {t.common.noResults}
                </p>
                <Link href="/dashboard/notifications/new">
                  <GlassButton>
                    <Plus className="w-4 h-4 mr-2" />
                    {t.notifications.createFirstNotification}
                  </GlassButton>
                </Link>
              </div>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Sidebar Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>{t.dashboard.quickActions}</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-2">
              <Link href="/dashboard/notifications/new">
                <GlassButton variant="secondary" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  {t.notifications.newNotification}
                </GlassButton>
              </Link>
              <Link href="/dashboard/notifications/templates">
                <GlassButton variant="secondary" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  {t.communication.compose}
                </GlassButton>
              </Link>
              <Link href="/dashboard/notifications/history">
                <GlassButton variant="secondary" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t.notifications.history}
                </GlassButton>
              </Link>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Tip: Notificaciones de Emergencia</h3>
              <p className="text-sm text-gray-600 mt-1">
                Las notificaciones de emergencia se envían por todos los canales disponibles
                (email, SMS y push) para asegurar que lleguen a todos los destinatarios
                de manera inmediata.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

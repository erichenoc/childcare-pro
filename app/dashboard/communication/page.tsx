'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare,
  Send,
  Inbox,
  Bell,
  Image,
  Plus,
  Search,
  MailOpen,
  Mail,
  Clock,
  Loader2,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/shared/lib/i18n'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassAvatar,
  GlassBadge,
} from '@/shared/components/ui'
import { messagesService, type MessageWithSender } from '@/features/communication/services/messages.service'
import type { Message } from '@/shared/types/database.types'

type TabType = 'inbox' | 'sent' | 'announcements'

interface MessageDisplay {
  id: string
  from: { name: string; role: string }
  subject: string
  preview: string
  date: string
  read: boolean
  type: 'inbox' | 'sent'
  hasAttachment?: boolean
}

interface AnnouncementDisplay {
  id: string
  title: string
  content: string
  date: string
  audience: string
}

export default function CommunicationPage() {
  const t = useTranslations()
  const { formatDate } = useI18n()

  const [activeTab, setActiveTab] = useState<TabType>('inbox')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState<MessageDisplay[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementDisplay[]>([])
  const [stats, setStats] = useState({ unread: 0, inbox: 0, sent: 0, announcements: 0 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)

      const [allMessages, announcementData, statsData] = await Promise.all([
        messagesService.getAll(),
        messagesService.getAnnouncements(),
        messagesService.getStats(),
      ])

      // Transform messages to display format
      const transformedMessages: MessageDisplay[] = allMessages
        .filter(m => m.message_type !== 'announcement')
        .map(m => ({
          id: m.id,
          from: {
            name: m.family?.primary_contact_name ||
                  (m.sender ? `${m.sender.first_name} ${m.sender.last_name}` : 'Sistema'),
            role: m.sender?.role || 'system',
          },
          subject: m.subject || 'Sin asunto',
          preview: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : ''),
          date: m.created_at || new Date().toISOString(),
          read: m.is_read || false,
          type: m.recipient_id ? 'inbox' : 'sent',
          hasAttachment: Boolean(m.attachments),
        }))

      // Transform announcements
      const transformedAnnouncements: AnnouncementDisplay[] = announcementData.map(a => ({
        id: a.id,
        title: a.subject || 'Anuncio',
        content: a.content,
        date: a.created_at || new Date().toISOString(),
        audience: a.recipient_id ? 'parents' : 'all',
      }))

      setMessages(transformedMessages)
      setAnnouncements(transformedAnnouncements)
      setStats(statsData)

    } catch (error) {
      console.error('Error loading communication data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const inboxMessages = messages.filter((m) => m.type === 'inbox')
  const sentMessages = messages.filter((m) => m.type === 'sent')
  const unreadCount = inboxMessages.filter((m) => !m.read).length

  // Filter messages based on search
  const filteredMessages = (activeTab === 'inbox' ? inboxMessages : sentMessages).filter(
    (message) =>
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.from.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const tabs = [
    { id: 'inbox' as TabType, label: t.communication.inbox, icon: Inbox, count: unreadCount },
    { id: 'sent' as TabType, label: t.communication.sent, icon: Send, count: null },
    { id: 'announcements' as TabType, label: t.communication.announcements, icon: Bell, count: null },
  ]

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffHours < 24) {
      return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    }
    return formatDate(dateString)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.communication.title}
          </h1>
          <p className="text-gray-500">
            {t.communication.subtitle}
          </p>
        </div>

        <GlassButton variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
          {t.communication.newMessage}
        </GlassButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
              <p className="text-sm text-gray-500">{t.communication.unread}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <MailOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{inboxMessages.length}</p>
              <p className="text-sm text-gray-500">Recibidos</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{sentMessages.length}</p>
              <p className="text-sm text-gray-500">Enviados</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
              <p className="text-sm text-gray-500">Anuncios</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? 'bg-blue-100 text-blue-600 font-medium'
                  : 'bg-white text-gray-600 hover:bg-blue-50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search */}
      {activeTab !== 'announcements' && (
        <GlassCard>
          <GlassCardContent className="py-4">
            <GlassInput
              placeholder={t.communication.searchMessages}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Messages List */}
      {activeTab !== 'announcements' && (
        <div className="space-y-2">
          {filteredMessages.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">{t.communication.noMessagesFound}</p>
            </GlassCard>
          ) : (
            filteredMessages.map((message) => (
              <GlassCard
                key={message.id}
                className={`p-4 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                  !message.read ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <GlassAvatar name={message.from.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-gray-900 truncate ${!message.read ? 'font-semibold' : ''}`}>
                          {message.from.name}
                        </p>
                        <p className={`text-sm truncate ${!message.read ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                          {message.subject}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs text-gray-500">{formatMessageDate(message.date)}</span>
                        <div className="flex gap-1">
                          {message.hasAttachment && (
                            <Image className="w-4 h-4 text-gray-400" />
                          )}
                          {!message.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {message.preview}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {/* Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <GlassButton variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              {t.communication.createAnnouncement}
            </GlassButton>
          </div>

          {announcements.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hay anuncios disponibles</p>
            </GlassCard>
          ) : (
            announcements.map((announcement) => (
              <GlassCard key={announcement.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                  <GlassBadge variant="default" size="sm">
                    {announcement.audience === 'all' ? 'Todos' : 'Padres'}
                  </GlassBadge>
                </div>
                <p className="text-gray-600 mb-3">{announcement.content}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(announcement.date)}</span>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}
    </div>
  )
}

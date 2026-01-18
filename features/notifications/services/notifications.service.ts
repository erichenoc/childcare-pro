// Notifications Service - ChildCare Pro
// Handles push notifications, email, SMS for bulk messaging

import { createClient } from '@/shared/lib/supabase/client'
import { emailService } from './email.service'

// ============================================
// TYPES
// ============================================

export type NotificationType = 'email' | 'push' | 'sms' | 'in_app'
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type RecipientType = 'all' | 'parents' | 'staff' | 'specific'
export type TemplateCategory = 'attendance' | 'billing' | 'incident' | 'announcement' | 'reminder' | 'emergency'

export interface NotificationTemplate {
  id: string
  organization_id: string
  name: string
  category: TemplateCategory
  subject: string
  body: string
  variables: string[] // e.g., ['child_name', 'parent_name', 'date']
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  organization_id: string
  template_id: string | null
  type: NotificationType
  priority: NotificationPriority
  recipient_type: RecipientType
  recipient_ids: string[] // User IDs
  subject: string
  body: string
  data: Record<string, unknown> | null // Additional JSON data
  scheduled_at: string | null
  sent_at: string | null
  status: NotificationStatus
  created_by: string
  created_at: string
}

export interface NotificationRecipient {
  id: string
  notification_id: string
  user_id: string
  email: string | null
  phone: string | null
  status: NotificationStatus
  delivered_at: string | null
  read_at: string | null
  error_message: string | null
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_enabled: boolean
  push_enabled: boolean
  sms_enabled: boolean
  in_app_enabled: boolean
  attendance_notifications: boolean
  billing_notifications: boolean
  incident_notifications: boolean
  announcement_notifications: boolean
  reminder_notifications: boolean
  emergency_notifications: boolean // Always on for safety
  quiet_hours_start: string | null // HH:MM format
  quiet_hours_end: string | null
}

export interface BulkNotificationRequest {
  template_id?: string
  type: NotificationType[]
  priority: NotificationPriority
  recipient_type: RecipientType
  recipient_ids?: string[]
  classroom_ids?: string[]
  subject: string
  body: string
  scheduled_at?: string
  data?: Record<string, unknown>
}

export interface NotificationStats {
  total_sent: number
  delivered: number
  failed: number
  read: number
  delivery_rate: number
  read_rate: number
}

// ============================================
// DEFAULT TEMPLATES
// ============================================

export const DEFAULT_TEMPLATES: Omit<NotificationTemplate, 'id' | 'organization_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Child Check-In',
    category: 'attendance',
    subject: '{{child_name}} has arrived safely',
    body: 'Good news! {{child_name}} was checked in at {{time}} by {{checked_in_by}}. Have a great day!',
    variables: ['child_name', 'time', 'checked_in_by'],
    is_active: true,
  },
  {
    name: 'Child Check-Out',
    category: 'attendance',
    subject: '{{child_name}} has been picked up',
    body: '{{child_name}} was picked up at {{time}} by {{picked_up_by}}. See you tomorrow!',
    variables: ['child_name', 'time', 'picked_up_by'],
    is_active: true,
  },
  {
    name: 'Late Pick-Up Warning',
    category: 'attendance',
    subject: 'Reminder: Pick up {{child_name}}',
    body: 'This is a reminder that {{child_name}} is still at the center. Our closing time is {{closing_time}}. Please pick up your child as soon as possible.',
    variables: ['child_name', 'closing_time'],
    is_active: true,
  },
  {
    name: 'Invoice Due',
    category: 'billing',
    subject: 'Invoice #{{invoice_number}} is due',
    body: 'Your invoice #{{invoice_number}} for {{amount}} is due on {{due_date}}. Please make your payment to avoid late fees.',
    variables: ['invoice_number', 'amount', 'due_date'],
    is_active: true,
  },
  {
    name: 'Payment Received',
    category: 'billing',
    subject: 'Payment received - Thank you!',
    body: 'We have received your payment of {{amount}} for invoice #{{invoice_number}}. Thank you for your prompt payment!',
    variables: ['amount', 'invoice_number'],
    is_active: true,
  },
  {
    name: 'Overdue Invoice',
    category: 'billing',
    subject: 'Invoice #{{invoice_number}} is overdue',
    body: 'Your invoice #{{invoice_number}} for {{amount}} is now {{days_overdue}} days overdue. Please make your payment immediately to avoid service interruption.',
    variables: ['invoice_number', 'amount', 'days_overdue'],
    is_active: true,
  },
  {
    name: 'Incident Report',
    category: 'incident',
    subject: 'Incident Report for {{child_name}}',
    body: 'An incident was reported involving {{child_name}} on {{date}}. Type: {{incident_type}}. Please log in to the parent portal to view the full report and sign.',
    variables: ['child_name', 'date', 'incident_type'],
    is_active: true,
  },
  {
    name: 'General Announcement',
    category: 'announcement',
    subject: '{{title}}',
    body: '{{message}}\n\n- {{center_name}} Team',
    variables: ['title', 'message', 'center_name'],
    is_active: true,
  },
  {
    name: 'Event Reminder',
    category: 'reminder',
    subject: 'Reminder: {{event_name}} on {{date}}',
    body: 'This is a reminder about the upcoming event: {{event_name}} on {{date}} at {{time}}.\n\n{{details}}\n\nWe look forward to seeing you there!',
    variables: ['event_name', 'date', 'time', 'details'],
    is_active: true,
  },
  {
    name: 'Emergency Alert',
    category: 'emergency',
    subject: 'URGENT: {{title}}',
    body: 'EMERGENCY NOTIFICATION\n\n{{message}}\n\nPlease take immediate action as needed. Contact us at {{contact_phone}} for more information.',
    variables: ['title', 'message', 'contact_phone'],
    is_active: true,
  },
  {
    name: 'Center Closure',
    category: 'emergency',
    subject: 'Center Closed: {{date}}',
    body: 'Due to {{reason}}, {{center_name}} will be closed on {{date}}. Normal operations will resume on {{reopen_date}}. We apologize for any inconvenience.',
    variables: ['reason', 'center_name', 'date', 'reopen_date'],
    is_active: true,
  },
]

// ============================================
// SERVICE CLASS
// ============================================

class NotificationsService {
  // ============================================
  // TEMPLATES
  // ============================================

  async getTemplates(organizationId: string): Promise<NotificationTemplate[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('category')
      .order('name')

    if (error) throw error
    return data || []
  }

  async createTemplate(template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationTemplate> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notification_templates')
      .insert(template)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notification_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteTemplate(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async sendBulkNotification(
    organizationId: string,
    request: BulkNotificationRequest,
    createdBy: string
  ): Promise<Notification> {
    const supabase = createClient()

    // Create the main notification record
    const notification: Omit<Notification, 'id' | 'created_at'> = {
      organization_id: organizationId,
      template_id: request.template_id || null,
      type: request.type[0], // Primary type
      priority: request.priority,
      recipient_type: request.recipient_type,
      recipient_ids: request.recipient_ids || [],
      subject: request.subject,
      body: request.body,
      data: request.data || null,
      scheduled_at: request.scheduled_at || null,
      sent_at: request.scheduled_at ? null : new Date().toISOString(),
      status: request.scheduled_at ? 'pending' : 'sent',
      created_by: createdBy,
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error

    // If not scheduled, send immediately
    if (!request.scheduled_at && data) {
      await this.processNotificationDelivery(supabase, organizationId, data, request)
    }

    return data
  }

  // Process actual delivery of notifications
  private async processNotificationDelivery(
    supabase: ReturnType<typeof createClient>,
    organizationId: string,
    notification: Notification,
    request: BulkNotificationRequest
  ) {
    try {
      // Get recipient emails based on recipient_type
      let recipientEmails: string[] = []

      if (request.recipient_type === 'specific' && request.recipient_ids?.length) {
        // Get emails for specific recipient IDs
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email')
          .in('id', request.recipient_ids)
          .not('email', 'is', null)

        recipientEmails = profiles?.map(p => p.email).filter(Boolean) as string[] || []
      } else if (request.recipient_type === 'parents') {
        // Get all parent emails for the organization
        const { data: families } = await supabase
          .from('families')
          .select('email, secondary_email')
          .eq('organization_id', organizationId)

        if (families) {
          families.forEach(f => {
            if (f.email) recipientEmails.push(f.email)
            if (f.secondary_email) recipientEmails.push(f.secondary_email)
          })
        }
      } else if (request.recipient_type === 'staff') {
        // Get all staff emails
        const { data: staff } = await supabase
          .from('profiles')
          .select('email')
          .eq('organization_id', organizationId)
          .in('role', ['teacher', 'assistant', 'director', 'admin'])
          .not('email', 'is', null)

        recipientEmails = staff?.map(s => s.email).filter(Boolean) as string[] || []
      } else if (request.recipient_type === 'all') {
        // Combine parents and staff
        const { data: families } = await supabase
          .from('families')
          .select('email, secondary_email')
          .eq('organization_id', organizationId)

        if (families) {
          families.forEach(f => {
            if (f.email) recipientEmails.push(f.email)
            if (f.secondary_email) recipientEmails.push(f.secondary_email)
          })
        }

        const { data: staff } = await supabase
          .from('profiles')
          .select('email')
          .eq('organization_id', organizationId)
          .in('role', ['teacher', 'assistant', 'director', 'admin', 'owner'])
          .not('email', 'is', null)

        if (staff) {
          recipientEmails.push(...(staff.map(s => s.email).filter(Boolean) as string[]))
        }
      }

      // Remove duplicates
      recipientEmails = [...new Set(recipientEmails)]

      // Send emails if email channel is selected
      if (request.type.includes('email') && recipientEmails.length > 0) {
        // Get organization name for branding
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single()

        const result = await emailService.sendGenericNotification(
          recipientEmails,
          {
            subject: request.subject,
            body: request.body,
            centerName: org?.name,
          }
        )

        // Update notification status based on result
        if (result.success) {
          await supabase
            .from('notifications')
            .update({ status: 'delivered' })
            .eq('id', notification.id)
        } else {
          console.error('Email delivery failed:', result.error)
          // Still mark as sent since we attempted delivery
        }
      }

      // Push notifications (placeholder for future implementation)
      if (request.type.includes('push')) {
        // Would integrate with OneSignal or similar
        console.log('Push notification queued for', recipientEmails.length, 'recipients')
      }

      // SMS notifications (placeholder for future implementation)
      if (request.type.includes('sms')) {
        // Would integrate with Twilio or similar
        console.log('SMS notification queued for recipients')
      }
    } catch (deliveryError) {
      console.error('Error processing notification delivery:', deliveryError)
      // Don't throw - we already saved the notification record
    }
  }

  async getNotifications(
    organizationId: string,
    options?: {
      status?: NotificationStatus
      type?: NotificationType
      limit?: number
      offset?: number
    }
  ): Promise<Notification[]> {
    const supabase = createClient()
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }
    if (options?.type) {
      query = query.eq('type', options.type)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async getNotificationById(id: string): Promise<Notification | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async cancelScheduledNotification(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'failed' })
      .eq('id', id)
      .eq('status', 'pending')

    if (error) throw error
  }

  // ============================================
  // PREFERENCES
  // ============================================

  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getStats(
    organizationId: string,
    dateRange?: { start: string; end: string }
  ): Promise<NotificationStats> {
    const supabase = createClient()
    let query = supabase
      .from('notifications')
      .select('status')
      .eq('organization_id', organizationId)

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
    }

    const { data, error } = await query
    if (error) throw error

    const notifications = data || []
    const total_sent = notifications.filter(n => n.status !== 'pending').length
    const delivered = notifications.filter(n => n.status === 'delivered' || n.status === 'read').length
    const failed = notifications.filter(n => n.status === 'failed').length
    const read = notifications.filter(n => n.status === 'read').length

    return {
      total_sent,
      delivered,
      failed,
      read,
      delivery_rate: total_sent > 0 ? (delivered / total_sent) * 100 : 0,
      read_rate: delivered > 0 ? (read / delivered) * 100 : 0,
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  parseTemplate(template: string, variables: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    return result
  }

  // ============================================
  // MOCK DATA FOR DEVELOPMENT
  // ============================================

  getMockTemplates(): NotificationTemplate[] {
    const orgId = 'org-1'
    return DEFAULT_TEMPLATES.map((t, i) => ({
      ...t,
      id: `template-${i + 1}`,
      organization_id: orgId,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }))
  }

  getMockNotifications(): Notification[] {
    const now = new Date()
    return [
      {
        id: 'notif-1',
        organization_id: 'org-1',
        template_id: 'template-8',
        type: 'email',
        priority: 'high',
        recipient_type: 'all',
        recipient_ids: [],
        subject: 'Important Update: Winter Schedule Changes',
        body: 'Dear families, we are writing to inform you about schedule changes during the winter break...',
        data: null,
        scheduled_at: null,
        sent_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'delivered',
        created_by: 'user-1',
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif-2',
        organization_id: 'org-1',
        template_id: 'template-9',
        type: 'push',
        priority: 'normal',
        recipient_type: 'parents',
        recipient_ids: [],
        subject: 'Reminder: Parent-Teacher Conference',
        body: 'This is a reminder about the upcoming Parent-Teacher Conference on January 20th at 6:00 PM.',
        data: { event_id: 'event-123' },
        scheduled_at: null,
        sent_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'read',
        created_by: 'user-1',
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif-3',
        organization_id: 'org-1',
        template_id: 'template-4',
        type: 'email',
        priority: 'normal',
        recipient_type: 'specific',
        recipient_ids: ['parent-1', 'parent-2', 'parent-3'],
        subject: 'Invoice Due Reminder',
        body: 'Your January invoice is due on January 15th. Please log in to make your payment.',
        data: null,
        scheduled_at: null,
        sent_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'delivered',
        created_by: 'user-1',
        created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif-4',
        organization_id: 'org-1',
        template_id: 'template-10',
        type: 'sms',
        priority: 'urgent',
        recipient_type: 'all',
        recipient_ids: [],
        subject: 'URGENT: Early Dismissal Today',
        body: 'Due to weather conditions, the center will close at 3:00 PM today. Please pick up your children by then.',
        data: null,
        scheduled_at: null,
        sent_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'delivered',
        created_by: 'user-1',
        created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif-5',
        organization_id: 'org-1',
        template_id: null,
        type: 'email',
        priority: 'normal',
        recipient_type: 'staff',
        recipient_ids: [],
        subject: 'Staff Meeting Reminder',
        body: 'Reminder: Monthly staff meeting tomorrow at 7:00 AM. Coffee and donuts will be provided!',
        data: null,
        scheduled_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        sent_at: null,
        status: 'pending',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
      },
    ]
  }

  getMockStats(): NotificationStats {
    return {
      total_sent: 156,
      delivered: 148,
      failed: 8,
      read: 112,
      delivery_rate: 94.9,
      read_rate: 75.7,
    }
  }
}

// Export singleton instance
export const notificationsService = new NotificationsService()

// =====================================================
// Mass Notifications Types
// =====================================================

// Types
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TargetType = 'all' | 'classroom' | 'family' | 'custom'
export type TemplateType = 'general' | 'emergency' | 'reminder' | 'announcement' | 'billing'
export type MassNotificationStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'
export type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced'
export type AppNotificationType = 'info' | 'success' | 'warning' | 'error' | 'reminder'

export interface NotificationTemplate {
  id: string
  organization_id: string
  name: string
  description: string | null
  subject: string
  body_text: string
  body_html: string | null
  variables: string[] | null
  template_type: TemplateType
  is_active: boolean
  use_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface MassNotification {
  id: string
  organization_id: string
  title: string
  notification_type: NotificationChannel
  priority: NotificationPriority
  subject: string
  body_text: string
  body_html: string | null
  template_id: string | null
  target_type: TargetType
  target_classroom_ids: string[] | null
  target_family_ids: string[] | null
  target_filters: Record<string, unknown> | null
  scheduled_at: string | null
  is_scheduled: boolean
  total_recipients: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  failed_count: number
  bounced_count: number
  status: MassNotificationStatus
  started_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  error_message: string | null
  sent_by: string | null
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface NotificationRecipient {
  id: string
  organization_id: string
  notification_id: string
  family_id: string | null
  recipient_name: string
  recipient_email: string | null
  recipient_phone: string | null
  personalized_subject: string | null
  personalized_body: string | null
  status: RecipientStatus
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  failed_at: string | null
  email_message_id: string | null
  delivery_attempts: number
  last_attempt_at: string | null
  error_message: string | null
  links_clicked: string[] | null
  created_at: string
}

export interface AppNotification {
  id: string
  organization_id: string
  user_id: string
  title: string
  message: string
  notification_type: AppNotificationType
  action_url: string | null
  action_label: string | null
  source_type: string | null
  source_id: string | null
  is_read: boolean
  read_at: string | null
  is_archived: boolean
  archived_at: string | null
  expires_at: string | null
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_enabled: boolean
  email_daily_summary: boolean
  email_immediate_alerts: boolean
  sms_enabled: boolean
  sms_emergencies_only: boolean
  push_enabled: boolean
  push_sound_enabled: boolean
  in_app_enabled: boolean
  receive_billing: boolean
  receive_attendance: boolean
  receive_incidents: boolean
  receive_announcements: boolean
  receive_reminders: boolean
  receive_marketing: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  quiet_hours_timezone: string
  created_at: string
  updated_at: string
}

export interface NotificationSummary {
  id: string
  organization_id: string
  title: string
  notification_type: NotificationChannel
  priority: NotificationPriority
  target_type: TargetType
  status: MassNotificationStatus
  total_recipients: number
  delivered_count: number
  opened_count: number
  failed_count: number
  delivery_rate: number
  open_rate: number
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  sent_by_name: string | null
}

export interface UserUnreadNotifications {
  user_id: string
  unread_count: number
  urgent_count: number
  latest_notification_at: string | null
}

export interface RecipientInfo {
  family_id: string
  recipient_name: string
  recipient_email: string | null
  recipient_phone: string | null
}

// Form Data Types
export interface NotificationTemplateFormData {
  name: string
  description?: string
  subject: string
  body_text: string
  body_html?: string
  template_type: TemplateType
  variables?: string[]
}

export interface MassNotificationFormData {
  title: string
  notification_type: NotificationChannel
  priority?: NotificationPriority
  subject: string
  body_text: string
  body_html?: string
  template_id?: string
  target_type: TargetType
  target_classroom_ids?: string[]
  target_family_ids?: string[]
  target_filters?: Record<string, unknown>
  scheduled_at?: string
  is_scheduled?: boolean
}

export interface NotificationPreferencesFormData {
  email_enabled?: boolean
  email_daily_summary?: boolean
  email_immediate_alerts?: boolean
  sms_enabled?: boolean
  sms_emergencies_only?: boolean
  push_enabled?: boolean
  push_sound_enabled?: boolean
  in_app_enabled?: boolean
  receive_billing?: boolean
  receive_attendance?: boolean
  receive_incidents?: boolean
  receive_announcements?: boolean
  receive_reminders?: boolean
  receive_marketing?: boolean
  quiet_hours_enabled?: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
  quiet_hours_timezone?: string
}

// Utility types for template variables
export type TemplateVariable =
  | '{{parent_name}}'
  | '{{family_name}}'
  | '{{family_email}}'
  | '{{child_name}}'
  | '{{child_first_name}}'
  | '{{organization_name}}'
  | '{{organization_phone}}'
  | '{{organization_email}}'
  | '{{date}}'
  | '{{time}}'

export const TEMPLATE_VARIABLES: { key: TemplateVariable; description: string }[] = [
  { key: '{{parent_name}}', description: 'Nombre del padre/tutor principal' },
  { key: '{{family_name}}', description: 'Nombre de la familia' },
  { key: '{{family_email}}', description: 'Email de la familia' },
  { key: '{{child_name}}', description: 'Nombre completo del niño' },
  { key: '{{child_first_name}}', description: 'Primer nombre del niño' },
  { key: '{{organization_name}}', description: 'Nombre del centro' },
  { key: '{{organization_phone}}', description: 'Teléfono del centro' },
  { key: '{{organization_email}}', description: 'Email del centro' },
  { key: '{{date}}', description: 'Fecha actual' },
  { key: '{{time}}', description: 'Hora actual' },
]

// =====================================================
// WHATSAPP TYPES - Evolution API Integration
// =====================================================

// ========== INSTANCIAS ==========

export type WhatsAppInstanceStatus = 'connected' | 'disconnected' | 'connecting' | 'qr_pending'

export interface WhatsAppInstance {
  id: string
  organization_id: string
  instance_name: string
  phone_number: string | null
  status: WhatsAppInstanceStatus
  qr_code_base64: string | null
  webhook_url: string | null
  profile_name: string | null
  profile_picture_url: string | null
  connected_at: string | null
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

// ========== SESIONES ==========

export interface WhatsAppSession {
  id: string
  organization_id: string
  instance_name: string
  remote_jid: string
  guardian_id: string | null
  family_id: string | null
  current_child_id: string | null
  is_prospect: boolean
  prospect_data: ProspectData
  session_context: SessionContext
  message_count: number
  last_message_at: string
  expires_at: string
  created_at: string
}

export interface ProspectData {
  name?: string
  email?: string
  phone?: string
  interest?: string
  children_ages?: string[]
  preferred_start_date?: string
  how_found_us?: string
  notes?: string
}

export interface SessionContext {
  last_intent?: string
  conversation_step?: string
  awaiting_response?: string
  selected_child_id?: string
  temp_data?: Record<string, unknown>
}

// ========== MENSAJES ==========

export type MessageDirection = 'inbound' | 'outbound'
export type MessageType = 'text' | 'image' | 'audio' | 'document' | 'video' | 'sticker' | 'location'
export type MessageStatus = 'received' | 'processing' | 'sent' | 'delivered' | 'read' | 'failed'

export interface WhatsAppMessage {
  id: string
  organization_id: string
  session_id: string
  instance_name: string
  remote_jid: string
  message_id: string
  direction: MessageDirection
  message_type: MessageType
  content: string | null
  media_url: string | null
  media_mimetype: string | null
  media_filename: string | null
  intent_detected: string | null
  confidence_score: number | null
  response_time_ms: number | null
  status: MessageStatus
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ========== TEMPLATES ==========

export interface WhatsAppTemplate {
  id: string
  organization_id: string
  template_key: string
  template_name: string
  content: string
  variables: string[]
  language: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type TemplateKey =
  | 'greeting'
  | 'menu'
  | 'select_child'
  | 'daily_summary'
  | 'invoice_status'
  | 'attendance'
  | 'photos'
  | 'incident'
  | 'prospect_welcome'
  | 'prospect_prices'
  | 'tour_scheduled'
  | 'after_hours'
  | 'unknown'
  | 'error'

// ========== BOT CONFIG ==========

export interface WhatsAppBotConfig {
  id: string
  organization_id: string
  bot_name: string
  welcome_message: string
  menu_message: string
  business_hours_start: string
  business_hours_end: string
  timezone: string
  after_hours_message: string
  unknown_intent_message: string
  enable_ai_responses: boolean
  enable_photo_sharing: boolean
  enable_invoice_payments: boolean
  enable_attendance_notifications: boolean
  enable_incident_notifications: boolean
  max_messages_per_hour: number
  response_delay_ms: number
  created_at: string
  updated_at: string
}

// ========== ANALYTICS ==========

export interface WhatsAppAnalytics {
  id: string
  organization_id: string
  date: string
  messages_received: number
  messages_sent: number
  unique_users: number
  new_prospects: number
  avg_response_time_ms: number | null
  intents_breakdown: Record<string, number>
  errors_count: number
  created_at: string
}

// ========== EVOLUTION API TYPES ==========

export interface EvolutionWebhookPayload {
  event: string
  instance: string
  data: EvolutionMessageData
  destination?: string
  date_time?: string
  sender?: string
  server_url?: string
  apikey?: string
}

export interface EvolutionMessageData {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  pushName?: string
  message?: {
    conversation?: string
    extendedTextMessage?: {
      text: string
    }
    imageMessage?: {
      url?: string
      mimetype?: string
      caption?: string
    }
    audioMessage?: {
      url?: string
      mimetype?: string
    }
    documentMessage?: {
      url?: string
      mimetype?: string
      fileName?: string
    }
    videoMessage?: {
      url?: string
      mimetype?: string
      caption?: string
    }
  }
  messageType?: string
  messageTimestamp?: number
}

export interface EvolutionConnectionState {
  instance: string
  state: 'open' | 'close' | 'connecting'
}

export interface EvolutionQRCode {
  pairingCode?: string
  code?: string
  base64?: string
  count?: number
}

export interface EvolutionInstanceInfo {
  instance: {
    instanceName: string
    instanceId: string
    status: string
    serverUrl: string
    apikey: string
    owner?: string
    profileName?: string
    profilePictureUrl?: string
  }
}

// ========== API REQUEST/RESPONSE TYPES ==========

export interface IdentifyRequest {
  instance: string
  remoteJid: string
}

export interface IdentifyResponse {
  type: 'parent' | 'prospect'
  organization: {
    id: string
    name: string
    instance_name: string
  }
  guardian?: {
    id: string
    name: string
    phone: string
  }
  family?: {
    id: string
    name: string
  }
  children?: Array<{
    id: string
    name: string
    classroom: string
  }>
  session: {
    id: string
    current_child_id?: string
    is_prospect: boolean
    prospect_data?: ProspectData
  }
}

export interface ChildSummaryResponse {
  child: {
    id: string
    name: string
    classroom: string
    age: string
  }
  date: string
  attendance: {
    status: string
    check_in_time: string | null
    check_out_time: string | null
    drop_off_person: string | null
    pickup_person: string | null
  }
  meals: Array<{
    type: string
    time: string
    amount: string
    notes: string | null
  }>
  nap: {
    start_time: string | null
    end_time: string | null
    duration_minutes: number | null
    quality: string | null
  } | null
  mood: {
    overall: string
    notes: string | null
  } | null
  activities: Array<{
    name: string
    time: string
    notes: string | null
  }>
  incidents: Array<{
    id: string
    type: string
    severity: string
    description: string
  }>
  photos_count: number
}

export interface InvoicesResponse {
  family: {
    id: string
    name: string
  }
  invoices: Array<{
    id: string
    invoice_number: string
    period: string
    total: number
    balance: number
    status: string
    due_date: string
    payment_url?: string
  }>
  total_balance: number
}

export interface PhotosResponse {
  child: {
    id: string
    name: string
  }
  date: string
  photos: Array<{
    id: string
    url: string
    caption: string | null
    taken_at: string
  }>
}

export interface PublicInfoResponse {
  organization: {
    id: string
    name: string
    address: string
    phone: string
    email: string
  }
  programs: Array<{
    name: string
    age_range: string
    price: string
    schedule: string
  }>
  hours: {
    open: string
    close: string
  }
  features: string[]
}

export interface CreateLeadRequest {
  instance: string
  remote_jid: string
  name: string
  email?: string
  phone: string
  interest?: string
  children_ages?: string[]
  notes?: string
  source: string
}

export interface CreateAppointmentRequest {
  instance: string
  remote_jid: string
  lead_id?: string
  name: string
  email?: string
  phone: string
  preferred_date: string
  preferred_time: string
  notes?: string
}

export interface LogMessageRequest {
  organization_id: string
  session_id: string
  instance_name: string
  remote_jid: string
  message_id: string
  direction: MessageDirection
  message_type: MessageType
  content?: string
  media_url?: string
  intent_detected?: string
  confidence_score?: number
  response_time_ms?: number
  status?: MessageStatus
  metadata?: Record<string, unknown>
}

// ========== INTENT TYPES ==========

export type IntentType =
  | 'greeting'
  | 'menu'
  | 'daily_summary'
  | 'attendance'
  | 'meals'
  | 'nap'
  | 'mood'
  | 'invoices'
  | 'pay_invoice'
  | 'photos'
  | 'incidents'
  | 'hours_vpk'
  | 'hours_sr'
  | 'info'
  | 'prices'
  | 'schedule_tour'
  | 'talk_to_human'
  | 'select_child'
  | 'yes'
  | 'no'
  | 'thanks'
  | 'unknown'

export interface IntentDetectionResult {
  intent: IntentType
  confidence: number
  entities?: {
    child_name?: string
    date?: string
    amount?: number
  }
}

// ========== FORMATTED RESPONSE TYPES ==========

export interface FormattedResponse {
  text: string
  media?: Array<{
    type: 'image' | 'document'
    url: string
    caption?: string
    filename?: string
  }>
  buttons?: Array<{
    id: string
    text: string
  }>
}

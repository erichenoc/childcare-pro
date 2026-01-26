// =====================================================
// WHATSAPP SERVICES - INDEX
// Export all WhatsApp services for easy imports
// =====================================================

export { evolutionApiService } from './evolution-api.service'
export { whatsappIdentityService } from './whatsapp-identity.service'
export { whatsappDataService } from './whatsapp-data.service'
export { whatsappMessagesService } from './whatsapp-messages.service'

// Re-export types
export type {
  WhatsAppInstance,
  WhatsAppInstanceStatus,
  WhatsAppSession,
  WhatsAppMessage,
  WhatsAppTemplate,
  WhatsAppBotConfig,
  WhatsAppAnalytics,
  MessageDirection,
  MessageType,
  MessageStatus,
  TemplateKey,
  IntentType,
  IntentDetectionResult,
  FormattedResponse,
  ProspectData,
  SessionContext,
  EvolutionWebhookPayload,
  EvolutionMessageData,
  EvolutionConnectionState,
  EvolutionQRCode,
  EvolutionInstanceInfo,
  IdentifyRequest,
  IdentifyResponse,
  ChildSummaryResponse,
  InvoicesResponse,
  PhotosResponse,
  PublicInfoResponse,
  CreateLeadRequest,
  CreateAppointmentRequest,
  LogMessageRequest,
} from '../types/whatsapp.types'

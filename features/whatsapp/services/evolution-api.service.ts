// =====================================================
// EVOLUTION API SERVICE
// Client for Evolution API (WhatsApp)
// =====================================================

import type {
  EvolutionConnectionState,
  EvolutionQRCode,
  EvolutionInstanceInfo,
} from '../types/whatsapp.types'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_BASE_URL || ''

interface CreateInstanceOptions {
  instanceName: string
  webhookUrl?: string
  webhookEvents?: string[]
}

interface SendTextOptions {
  instanceName: string
  to: string
  text: string
  delay?: number
}

interface SendMediaOptions {
  instanceName: string
  to: string
  mediaType: 'image' | 'document' | 'audio' | 'video'
  mediaUrl: string
  caption?: string
  fileName?: string
}

interface SendButtonsOptions {
  instanceName: string
  to: string
  text: string
  buttons: Array<{ id: string; text: string }>
  title?: string
}

interface EvolutionApiError {
  error: boolean
  message: string
  statusCode?: number
}

// Helper para normalizar numero de WhatsApp
function normalizePhoneNumber(phone: string): string {
  // Remover @s.whatsapp.net si existe
  let normalized = phone.replace('@s.whatsapp.net', '')
  // Remover caracteres no numericos excepto +
  normalized = normalized.replace(/[^\d+]/g, '')
  // Remover + si existe
  normalized = normalized.replace('+', '')
  return normalized
}

// Helper para hacer requests a Evolution API
async function evolutionRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${EVOLUTION_API_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    const error = data as EvolutionApiError
    throw new Error(error.message || `Evolution API error: ${response.status}`)
  }

  return data as T
}

export const evolutionApiService = {
  // ========== INSTANCE MANAGEMENT ==========

  /**
   * Crear nueva instancia de WhatsApp
   */
  async createInstance(options: CreateInstanceOptions) {
    const { instanceName, webhookUrl, webhookEvents } = options

    const payload = {
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
      webhook: {
        url: webhookUrl || `${N8N_WEBHOOK_URL}/whatsapp`,
        byEvents: false,
        base64: true,
        events: webhookEvents || [
          'MESSAGES_UPSERT',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED',
        ],
      },
    }

    return evolutionRequest<{ instance: { instanceName: string; status: string } }>(
      '/instance/create',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  /**
   * Obtener QR code para conectar WhatsApp
   */
  async getQRCode(instanceName: string): Promise<EvolutionQRCode> {
    return evolutionRequest<EvolutionQRCode>(
      `/instance/connect/${instanceName}`
    )
  },

  /**
   * Verificar estado de conexion
   */
  async getConnectionState(instanceName: string): Promise<EvolutionConnectionState> {
    return evolutionRequest<EvolutionConnectionState>(
      `/instance/connectionState/${instanceName}`
    )
  },

  /**
   * Obtener informacion de la instancia
   */
  async getInstanceInfo(instanceName: string): Promise<EvolutionInstanceInfo> {
    return evolutionRequest<EvolutionInstanceInfo>(
      `/instance/fetchInstances?instanceName=${instanceName}`
    )
  },

  /**
   * Cerrar sesion de WhatsApp (logout)
   */
  async logout(instanceName: string) {
    return evolutionRequest<{ status: string }>(
      `/instance/logout/${instanceName}`,
      { method: 'DELETE' }
    )
  },

  /**
   * Eliminar instancia completamente
   */
  async deleteInstance(instanceName: string) {
    return evolutionRequest<{ status: string }>(
      `/instance/delete/${instanceName}`,
      { method: 'DELETE' }
    )
  },

  /**
   * Reiniciar instancia
   */
  async restartInstance(instanceName: string) {
    return evolutionRequest<{ status: string }>(
      `/instance/restart/${instanceName}`,
      { method: 'PUT' }
    )
  },

  // ========== SEND MESSAGES ==========

  /**
   * Enviar mensaje de texto
   */
  async sendText(options: SendTextOptions) {
    const { instanceName, to, text, delay = 1000 } = options

    const payload = {
      number: normalizePhoneNumber(to),
      text,
      delay,
    }

    return evolutionRequest<{ key: { id: string }; status: string }>(
      `/message/sendText/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  /**
   * Enviar imagen
   */
  async sendImage(options: Omit<SendMediaOptions, 'mediaType'>) {
    return this.sendMedia({ ...options, mediaType: 'image' })
  },

  /**
   * Enviar documento
   */
  async sendDocument(options: Omit<SendMediaOptions, 'mediaType'>) {
    return this.sendMedia({ ...options, mediaType: 'document' })
  },

  /**
   * Enviar media (imagen, documento, audio, video)
   */
  async sendMedia(options: SendMediaOptions) {
    const { instanceName, to, mediaType, mediaUrl, caption, fileName } = options

    const payload = {
      number: normalizePhoneNumber(to),
      mediatype: mediaType,
      media: mediaUrl,
      caption,
      fileName,
    }

    return evolutionRequest<{ key: { id: string }; status: string }>(
      `/message/sendMedia/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  /**
   * Enviar mensaje con botones
   */
  async sendButtons(options: SendButtonsOptions) {
    const { instanceName, to, text, buttons, title = '' } = options

    const payload = {
      number: normalizePhoneNumber(to),
      title,
      description: text,
      buttons: buttons.map((b) => ({
        type: 'reply',
        reply: {
          id: b.id,
          title: b.text,
        },
      })),
    }

    return evolutionRequest<{ key: { id: string }; status: string }>(
      `/message/sendButtons/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  /**
   * Enviar lista interactiva
   */
  async sendList(
    instanceName: string,
    to: string,
    title: string,
    description: string,
    buttonText: string,
    sections: Array<{
      title: string
      rows: Array<{ id: string; title: string; description?: string }>
    }>
  ) {
    const payload = {
      number: normalizePhoneNumber(to),
      title,
      description,
      buttonText,
      sections,
    }

    return evolutionRequest<{ key: { id: string }; status: string }>(
      `/message/sendList/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  /**
   * Enviar ubicacion
   */
  async sendLocation(
    instanceName: string,
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ) {
    const payload = {
      number: normalizePhoneNumber(to),
      latitude,
      longitude,
      name,
      address,
    }

    return evolutionRequest<{ key: { id: string }; status: string }>(
      `/message/sendLocation/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  /**
   * Enviar contacto
   */
  async sendContact(
    instanceName: string,
    to: string,
    contacts: Array<{
      fullName: string
      phoneNumber: string
      organization?: string
    }>
  ) {
    const payload = {
      number: normalizePhoneNumber(to),
      contacts: contacts.map((c) => ({
        fullName: c.fullName,
        wuid: normalizePhoneNumber(c.phoneNumber),
        phoneNumber: c.phoneNumber,
        organization: c.organization,
      })),
    }

    return evolutionRequest<{ key: { id: string }; status: string }>(
      `/message/sendContact/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  // ========== PRESENCE & STATUS ==========

  /**
   * Marcar como "escribiendo..."
   */
  async sendTyping(instanceName: string, to: string) {
    const payload = {
      number: normalizePhoneNumber(to),
      presence: 'composing',
    }

    return evolutionRequest<{ status: string }>(
      `/chat/presence/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  /**
   * Marcar mensajes como leidos
   */
  async markAsRead(instanceName: string, remoteJid: string) {
    const payload = {
      readMessages: [{ remoteJid, fromMe: false, id: 'all' }],
    }

    return evolutionRequest<{ status: string }>(
      `/chat/markMessageAsRead/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  // ========== WEBHOOK MANAGEMENT ==========

  /**
   * Actualizar configuracion de webhook
   */
  async updateWebhook(
    instanceName: string,
    webhookUrl: string,
    events?: string[]
  ) {
    const payload = {
      enabled: true,
      url: webhookUrl,
      byEvents: false,
      base64: true,
      events: events || [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
      ],
    }

    return evolutionRequest<{ status: string }>(
      `/webhook/set/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  /**
   * Obtener configuracion actual de webhook
   */
  async getWebhook(instanceName: string) {
    return evolutionRequest<{ webhook: { url: string; events: string[] } }>(
      `/webhook/find/${instanceName}`
    )
  },

  // ========== UTILITIES ==========

  /**
   * Verificar si un numero tiene WhatsApp
   */
  async checkNumber(instanceName: string, phoneNumber: string) {
    const payload = {
      numbers: [normalizePhoneNumber(phoneNumber)],
    }

    return evolutionRequest<{
      result: Array<{ exists: boolean; jid: string; number: string }>
    }>(`/chat/whatsappNumbers/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Obtener foto de perfil de un numero
   */
  async getProfilePicture(instanceName: string, phoneNumber: string) {
    const payload = {
      number: normalizePhoneNumber(phoneNumber),
    }

    return evolutionRequest<{ profilePictureUrl: string | null }>(
      `/chat/fetchProfilePictureUrl/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },
}

export default evolutionApiService

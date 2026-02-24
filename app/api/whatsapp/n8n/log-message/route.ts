// =====================================================
// POST /api/whatsapp/n8n/log-message
// Log incoming/outgoing WhatsApp messages
// Called by n8n workflow for every message
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { whatsappMessagesService } from '@/features/whatsapp/services/whatsapp-messages.service'
import { z } from 'zod'
import type { MessageDirection, MessageType, MessageStatus } from '@/features/whatsapp/types/whatsapp.types'

const N8N_API_KEY = process.env.N8N_WEBHOOK_SECRET || process.env.WHATSAPP_API_KEY || ''

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  // Require API key in all environments
  if (!N8N_API_KEY) {
    console.warn('[WhatsApp API] N8N_WEBHOOK_SECRET or WHATSAPP_API_KEY not configured')
    return false
  }
  return apiKey === N8N_API_KEY
}

const logMessageSchema = z.object({
  organization_id: z.string().uuid(),
  session_id: z.string().uuid(),
  instance_name: z.string().min(1),
  remote_jid: z.string().min(1),
  message_id: z.string().min(1),
  direction: z.enum(['inbound', 'outbound']),
  message_type: z.enum(['text', 'image', 'audio', 'document', 'video', 'sticker', 'location']),
  content: z.string().optional(),
  media_url: z.string().url().optional(),
  intent_detected: z.string().optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  response_time_ms: z.number().optional(),
  status: z.enum(['received', 'processing', 'sent', 'delivered', 'read', 'failed']).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = logMessageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    const message = await whatsappMessagesService.logMessage({
      organization_id: data.organization_id,
      session_id: data.session_id,
      instance_name: data.instance_name,
      remote_jid: data.remote_jid,
      message_id: data.message_id,
      direction: data.direction as MessageDirection,
      message_type: data.message_type as MessageType,
      content: data.content,
      media_url: data.media_url,
      intent_detected: data.intent_detected,
      confidence_score: data.confidence_score,
      response_time_ms: data.response_time_ms,
      status: data.status as MessageStatus,
      metadata: data.metadata,
    })

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Failed to log message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message_id: message.id,
        logged_at: message.created_at,
      },
    })
  } catch (error) {
    console.error('[WhatsApp API] Log message error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

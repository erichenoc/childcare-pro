// =====================================================
// POST /api/whatsapp/n8n/identify
// Identify organization and contact by instance + remoteJid
// Called by n8n workflow when message is received
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { whatsappIdentityService } from '@/features/whatsapp/services/whatsapp-identity.service'
import { z } from 'zod'

const identifySchema = z.object({
  instance: z.string().min(1, 'Instance name is required'),
  remoteJid: z.string().min(1, 'Remote JID is required'),
})

// n8n uses API key authentication
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

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse and validate body
    const body = await request.json()
    const validation = identifySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { instance, remoteJid } = validation.data

    // 3. Identify contact
    const result = await whatsappIdentityService.identify(instance, remoteJid)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      )
    }

    // 4. Return identification result
    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('[WhatsApp API] Identify error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

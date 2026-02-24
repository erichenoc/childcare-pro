// =====================================================
// GET /api/whatsapp/n8n/incidents
// Get pending incidents for a child
// Called by n8n workflow to check for unnotified incidents
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { whatsappDataService } from '@/features/whatsapp/services/whatsapp-data.service'

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

export async function GET(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const childId = searchParams.get('child_id')

    if (!organizationId || !childId) {
      return NextResponse.json(
        { success: false, error: 'organization_id and child_id are required' },
        { status: 400 }
      )
    }

    const result = await whatsappDataService.getPendingIncidents(organizationId, childId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Error fetching incidents' },
        { status: 500 }
      )
    }

    const incidents = result.data || []

    // Format for WhatsApp if there are incidents
    const formatted = incidents.length > 0
      ? {
          text: incidents
            .map((inc) => {
              const severityEmoji = inc.severity === 'high' ? '🔴' : inc.severity === 'medium' ? '🟡' : '🟢'
              return `${severityEmoji} *${inc.type}*\n${inc.description}`
            })
            .join('\n\n'),
        }
      : { text: 'No hay incidentes pendientes' }

    return NextResponse.json({
      success: true,
      data: {
        incidents,
        has_pending: incidents.length > 0,
      },
      formatted,
    })
  } catch (error) {
    console.error('[WhatsApp API] Incidents error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

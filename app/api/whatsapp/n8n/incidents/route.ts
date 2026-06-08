// =====================================================
// GET /api/whatsapp/n8n/incidents
// Get pending incidents for a child
// Called by n8n workflow to check for unnotified incidents
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { verifyN8nSecret } from '@/shared/lib/n8n-auth'
import { whatsappDataService } from '@/features/whatsapp/services/whatsapp-data.service'


export async function GET(request: NextRequest) {
  try {
    if (!verifyN8nSecret(request)) {
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

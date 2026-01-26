// =====================================================
// GET /api/whatsapp/n8n/child-summary
// Get daily summary for a child
// Called by n8n workflow when parent requests summary
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { whatsappDataService } from '@/features/whatsapp/services/whatsapp-data.service'
import { whatsappMessagesService } from '@/features/whatsapp/services/whatsapp-messages.service'

const N8N_API_KEY = process.env.N8N_WEBHOOK_SECRET || process.env.WHATSAPP_API_KEY || ''

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.NODE_ENV === 'development' && !N8N_API_KEY) return true
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
    const date = searchParams.get('date') // Optional, defaults to today
    const format = searchParams.get('format') || 'raw' // 'raw' or 'whatsapp'

    if (!organizationId || !childId) {
      return NextResponse.json(
        { success: false, error: 'organization_id and child_id are required' },
        { status: 400 }
      )
    }

    const result = await whatsappDataService.getChildSummary(
      organizationId,
      childId,
      date || undefined
    )

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Summary not found' },
        { status: 404 }
      )
    }

    // Return formatted for WhatsApp or raw data
    if (format === 'whatsapp') {
      const formatted = whatsappMessagesService.formatChildSummary(result.data)
      return NextResponse.json({
        success: true,
        data: result.data,
        formatted,
      })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('[WhatsApp API] Child summary error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// GET /api/whatsapp/n8n/invoices
// Get family invoices for WhatsApp
// Called by n8n workflow when parent requests invoice status
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { whatsappDataService } from '@/features/whatsapp/services/whatsapp-data.service'
import { whatsappMessagesService } from '@/features/whatsapp/services/whatsapp-messages.service'

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
    const familyId = searchParams.get('family_id')
    const format = searchParams.get('format') || 'raw'

    if (!organizationId || !familyId) {
      return NextResponse.json(
        { success: false, error: 'organization_id and family_id are required' },
        { status: 400 }
      )
    }

    const result = await whatsappDataService.getInvoices(organizationId, familyId)

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invoices not found' },
        { status: 404 }
      )
    }

    if (format === 'whatsapp') {
      const formatted = whatsappMessagesService.formatInvoices(result.data)
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
    console.error('[WhatsApp API] Invoices error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

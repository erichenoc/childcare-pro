// =====================================================
// GET /api/whatsapp/n8n/photos
// Get recent photos of a child
// Called by n8n workflow when parent requests photos
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { whatsappDataService } from '@/features/whatsapp/services/whatsapp-data.service'

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
    const date = searchParams.get('date') // Optional

    if (!organizationId || !childId) {
      return NextResponse.json(
        { success: false, error: 'organization_id and child_id are required' },
        { status: 400 }
      )
    }

    const result = await whatsappDataService.getPhotos(
      organizationId,
      childId,
      date || undefined
    )

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Photos not found' },
        { status: 404 }
      )
    }

    const photosData = result.data

    // Format response with media for WhatsApp
    const formatted = {
      text: `📸 *Fotos de ${photosData.child.name}* - ${photosData.date}\n\n${photosData.photos.length > 0 ? `${photosData.photos.length} foto(s) del día` : 'No hay fotos de hoy'}`,
      media: photosData.photos.map((photo) => ({
        type: 'image' as const,
        url: photo.url,
        caption: photo.caption || undefined,
      })),
    }

    return NextResponse.json({
      success: true,
      data: photosData,
      formatted,
    })
  } catch (error) {
    console.error('[WhatsApp API] Photos error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

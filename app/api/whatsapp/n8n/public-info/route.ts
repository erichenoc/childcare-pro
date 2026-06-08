// =====================================================
// GET /api/whatsapp/n8n/public-info
// Get public information for prospects
// Called by n8n workflow for non-registered contacts
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

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organization_id is required' },
        { status: 400 }
      )
    }

    const result = await whatsappDataService.getPublicInfo(organizationId)

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Organization not found' },
        { status: 404 }
      )
    }

    const info = result.data

    // Format programs list for WhatsApp
    const programsList = info.programs
      .map((p) => `📚 *${p.name}*\n   Edades: ${p.age_range}\n   Precio: ${p.price}\n   Horario: ${p.schedule}`)
      .join('\n\n')

    const featuresList = info.features.map((f) => `✅ ${f}`).join('\n')

    const formatted = {
      text: `📋 *${info.organization.name}*

${programsList || 'Consulta nuestros programas'}

🕐 *Horario:* ${info.hours.open} - ${info.hours.close}

✨ *Incluye:*
${featuresList}

📍 ${info.organization.address}
📞 ${info.organization.phone}
📧 ${info.organization.email}

¿Te gustaría agendar una visita para conocernos?`,
    }

    return NextResponse.json({
      success: true,
      data: info,
      formatted,
    })
  } catch (error) {
    console.error('[WhatsApp API] Public info error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// GET /api/whatsapp/n8n/attendance
// Get current attendance status for a child
// Called by n8n workflow when parent asks about attendance
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

    const result = await whatsappDataService.getAttendanceStatus(organizationId, childId)

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Attendance not found' },
        { status: 404 }
      )
    }

    // Format for WhatsApp response
    const statusMessages: Record<string, string> = {
      present: 'En el centro',
      checked_out: 'Ya salió',
      absent: 'Ausente',
      not_checked_in: 'No ha llegado',
    }

    const formattedText = `👶 *Estado de asistencia*

Estado: ${statusMessages[result.data.status] || result.data.status}
${result.data.check_in_time ? `✅ Entrada: ${result.data.check_in_time}` : ''}
${result.data.check_out_time ? `🚪 Salida: ${result.data.check_out_time}` : ''}`

    return NextResponse.json({
      success: true,
      data: result.data,
      formatted: {
        text: formattedText.trim(),
      },
    })
  } catch (error) {
    console.error('[WhatsApp API] Attendance error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

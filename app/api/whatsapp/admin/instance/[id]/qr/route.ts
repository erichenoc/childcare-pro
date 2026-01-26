// =====================================================
// GET /api/whatsapp/admin/instance/[id]/qr
// Get QR code for WhatsApp connection
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { verifyUserAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { evolutionApiService } from '@/features/whatsapp/services/evolution-api.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyUserAuth()
    if (isAuthError(auth)) return auth.response

    const { id } = await params
    const supabase = await createClient()

    // Get instance and verify ownership
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (instanceError || !instance) {
      return NextResponse.json(
        { success: false, error: 'Instance not found' },
        { status: 404 }
      )
    }

    // Get QR from Evolution API
    const qrResult = await evolutionApiService.getQRCode(instance.instance_name)

    // Update instance with QR if available
    if (qrResult.base64) {
      await supabase
        .from('whatsapp_instances')
        .update({
          qr_code_base64: qrResult.base64,
          status: 'qr_pending',
        })
        .eq('id', id)
    }

    return NextResponse.json({
      success: true,
      data: {
        instance_id: id,
        instance_name: instance.instance_name,
        qr_code: qrResult.base64 || null,
        pairing_code: qrResult.pairingCode || null,
        status: instance.status,
      },
    })
  } catch (error) {
    console.error('[WhatsApp Admin] Get QR error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

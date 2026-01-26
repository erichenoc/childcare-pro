// =====================================================
// DELETE /api/whatsapp/admin/instance/[id]/disconnect
// Disconnect WhatsApp instance (logout)
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { verifyUserAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { evolutionApiService } from '@/features/whatsapp/services/evolution-api.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Logout from Evolution API
    try {
      await evolutionApiService.logout(instance.instance_name)
    } catch (error) {
      console.warn('[WhatsApp Admin] Evolution logout failed:', error)
      // Continue anyway to update local state
    }

    // Update database
    await supabase
      .from('whatsapp_instances')
      .update({
        status: 'disconnected',
        phone_number: null,
        qr_code_base64: null,
      })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      data: {
        instance_id: id,
        status: 'disconnected',
        message: 'Instance disconnected successfully',
      },
    })
  } catch (error) {
    console.error('[WhatsApp Admin] Disconnect error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

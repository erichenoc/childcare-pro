// =====================================================
// GET /api/whatsapp/admin/instance/[id]/status
// Get connection status for WhatsApp instance
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { verifyUserAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { evolutionApiService } from '@/features/whatsapp/services/evolution-api.service'
import type { WhatsAppInstanceStatus } from '@/features/whatsapp/types/whatsapp.types'

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

    // Get status from Evolution API
    const connectionState = await evolutionApiService.getConnectionState(instance.instance_name)

    // Map Evolution state to our status
    const stateMap: Record<string, WhatsAppInstanceStatus> = {
      open: 'connected',
      close: 'disconnected',
      connecting: 'connecting',
    }

    const newStatus = stateMap[connectionState.state] || 'disconnected'

    // Update database if status changed
    if (newStatus !== instance.status) {
      const updateData: Record<string, unknown> = {
        status: newStatus,
      }

      if (newStatus === 'connected') {
        updateData.connected_at = new Date().toISOString()
        updateData.last_seen_at = new Date().toISOString()
      }

      await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('id', id)
    }

    // Get instance info if connected
    let profileInfo = null
    if (newStatus === 'connected') {
      try {
        const instanceInfo = await evolutionApiService.getInstanceInfo(instance.instance_name)
        profileInfo = {
          name: instanceInfo.instance?.profileName,
          picture_url: instanceInfo.instance?.profilePictureUrl,
        }

        // Update profile info in database
        if (profileInfo.name || profileInfo.picture_url) {
          await supabase
            .from('whatsapp_instances')
            .update({
              profile_name: profileInfo.name,
              profile_picture_url: profileInfo.picture_url,
            })
            .eq('id', id)
        }
      } catch {
        // Ignore error getting profile info
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        instance_id: id,
        instance_name: instance.instance_name,
        status: newStatus,
        phone_number: instance.phone_number,
        profile_name: profileInfo?.name || instance.profile_name,
        profile_picture_url: profileInfo?.picture_url || instance.profile_picture_url,
        connected_at: instance.connected_at,
        last_seen_at: instance.last_seen_at,
      },
    })
  } catch (error) {
    console.error('[WhatsApp Admin] Get status error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

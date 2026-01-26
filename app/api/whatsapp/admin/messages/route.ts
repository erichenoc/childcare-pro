// =====================================================
// GET /api/whatsapp/admin/messages
// Get WhatsApp messages for admin dashboard
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { verifyUserAuth, isAuthError } from '@/shared/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUserAuth()
    if (isAuthError(auth)) return auth.response

    const { searchParams } = new URL(request.url)
    const instanceName = searchParams.get('instance_name')
    const remoteJid = searchParams.get('remote_jid')
    const direction = searchParams.get('direction') // 'inbound' or 'outbound'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const supabase = await createClient()

    let query = supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (instanceName) {
      query = query.eq('instance_name', instanceName)
    }

    if (remoteJid) {
      query = query.eq('remote_jid', remoteJid)
    }

    if (direction) {
      query = query.eq('direction', direction)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: messages, count, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        messages: messages || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: (count || 0) > offset + limit,
        },
      },
    })
  } catch (error) {
    console.error('[WhatsApp Admin] Get messages error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

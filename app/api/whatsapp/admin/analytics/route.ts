// =====================================================
// GET /api/whatsapp/admin/analytics
// Get WhatsApp analytics for admin dashboard
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { verifyUserAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { whatsappMessagesService } from '@/features/whatsapp/services/whatsapp-messages.service'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUserAuth()
    if (isAuthError(auth)) return auth.response

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date()
    let start: Date

    if (startDate) {
      start = new Date(startDate)
    } else {
      start = new Date()
      switch (period) {
        case '30d':
          start.setDate(start.getDate() - 30)
          break
        case '90d':
          start.setDate(start.getDate() - 90)
          break
        default:
          start.setDate(start.getDate() - 7)
      }
    }

    const supabase = await createClient()

    // Get message stats
    const messageStats = await whatsappMessagesService.getMessageStats(
      auth.organizationId,
      start.toISOString(),
      end.toISOString()
    )

    // Get session stats
    const { count: totalSessions } = await supabase
      .from('whatsapp_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    const { count: prospectSessions } = await supabase
      .from('whatsapp_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)
      .eq('is_prospect', true)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    // Get daily breakdown
    const { data: dailyData } = await supabase
      .from('whatsapp_analytics')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0])
      .order('date', { ascending: true })

    // Get instance stats
    const { data: instances } = await supabase
      .from('whatsapp_instances')
      .select('status')
      .eq('organization_id', auth.organizationId)

    const instanceStats = {
      total: instances?.length || 0,
      connected: instances?.filter((i) => i.status === 'connected').length || 0,
      disconnected: instances?.filter((i) => i.status !== 'connected').length || 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        summary: {
          messages_received: messageStats.total_received,
          messages_sent: messageStats.total_sent,
          unique_users: messageStats.unique_users,
          avg_response_time_ms: messageStats.avg_response_time_ms,
          total_sessions: totalSessions || 0,
          prospect_sessions: prospectSessions || 0,
          parent_sessions: (totalSessions || 0) - (prospectSessions || 0),
        },
        instances: instanceStats,
        intents: messageStats.intents_breakdown,
        daily: dailyData || [],
      },
    })
  } catch (error) {
    console.error('[WhatsApp Admin] Get analytics error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

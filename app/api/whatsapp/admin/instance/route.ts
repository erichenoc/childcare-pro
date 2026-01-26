// =====================================================
// GET/POST /api/whatsapp/admin/instance
// List and create WhatsApp instances
// Admin authenticated endpoints
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { verifyUserAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { evolutionApiService } from '@/features/whatsapp/services/evolution-api.service'
import { z } from 'zod'

const createInstanceSchema = z.object({
  instance_name: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric, underscore and dash allowed'),
  webhook_url: z.string().url().optional(),
})

// GET - List all instances for organization
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUserAuth()
    if (isAuthError(auth)) return auth.response

    const supabase = await createClient()

    const { data: instances, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: instances,
    })
  } catch (error) {
    console.error('[WhatsApp Admin] List instances error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new instance
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUserAuth()
    if (isAuthError(auth)) return auth.response

    const body = await request.json()
    const validation = createInstanceSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { instance_name, webhook_url } = validation.data
    const supabase = await createClient()

    // Check if instance name already exists for this org
    const { data: existing } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('instance_name', instance_name)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Instance name already exists' },
        { status: 409 }
      )
    }

    // Create instance in Evolution API
    const evolutionResult = await evolutionApiService.createInstance({
      instanceName: instance_name,
      webhookUrl: webhook_url,
    })

    // Save to database
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        organization_id: auth.organizationId,
        instance_name: instance_name,
        status: 'qr_pending',
        webhook_url: webhook_url || null,
      })
      .select()
      .single()

    if (dbError) {
      throw dbError
    }

    return NextResponse.json({
      success: true,
      data: {
        instance,
        evolution: evolutionResult,
      },
    })
  } catch (error) {
    console.error('[WhatsApp Admin] Create instance error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

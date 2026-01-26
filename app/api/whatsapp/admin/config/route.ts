// =====================================================
// GET/PUT /api/whatsapp/admin/config
// Get/update WhatsApp bot configuration
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { verifyUserAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { z } from 'zod'

const updateConfigSchema = z.object({
  bot_name: z.string().min(1).max(100).optional(),
  welcome_message: z.string().max(1000).optional(),
  menu_message: z.string().max(2000).optional(),
  business_hours_start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  business_hours_end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional(),
  after_hours_message: z.string().max(1000).optional(),
  unknown_intent_message: z.string().max(1000).optional(),
  enable_ai_responses: z.boolean().optional(),
  enable_photo_sharing: z.boolean().optional(),
  enable_invoice_payments: z.boolean().optional(),
  enable_attendance_notifications: z.boolean().optional(),
  enable_incident_notifications: z.boolean().optional(),
  max_messages_per_hour: z.number().min(1).max(1000).optional(),
  response_delay_ms: z.number().min(0).max(30000).optional(),
})

// GET - Get bot configuration
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUserAuth()
    if (isAuthError(auth)) return auth.response

    const supabase = await createClient()

    const { data: config, error } = await supabase
      .from('whatsapp_bot_config')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Return default config if none exists
    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          organization_id: auth.organizationId,
          bot_name: 'Asistente',
          welcome_message: 'Hola! Bienvenido. ¿En qué puedo ayudarte?',
          menu_message: '¿Qué te gustaría saber?\n\n1. Resumen del día\n2. Facturas\n3. Fotos\n4. Hablar con alguien',
          business_hours_start: '06:30',
          business_hours_end: '18:00',
          timezone: 'America/New_York',
          after_hours_message: 'Gracias por contactarnos. Nuestro horario es de 6:30 AM a 6:00 PM. Te responderemos mañana.',
          unknown_intent_message: 'No entendí tu mensaje. Escribe "menu" para ver las opciones.',
          enable_ai_responses: true,
          enable_photo_sharing: true,
          enable_invoice_payments: true,
          enable_attendance_notifications: true,
          enable_incident_notifications: true,
          max_messages_per_hour: 100,
          response_delay_ms: 1000,
          is_default: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: config,
    })
  } catch (error) {
    console.error('[WhatsApp Admin] Get config error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update bot configuration
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyUserAuth()
    if (isAuthError(auth)) return auth.response

    const body = await request.json()
    const validation = updateConfigSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Upsert configuration
    const { data: config, error } = await supabase
      .from('whatsapp_bot_config')
      .upsert({
        organization_id: auth.organizationId,
        ...validation.data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id',
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: config,
    })
  } catch (error) {
    console.error('[WhatsApp Admin] Update config error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

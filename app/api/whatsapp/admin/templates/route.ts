// =====================================================
// GET/POST/PUT /api/whatsapp/admin/templates
// Manage WhatsApp message templates
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { verifyUserAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { whatsappMessagesService } from '@/features/whatsapp/services/whatsapp-messages.service'
import { z } from 'zod'
import type { TemplateKey } from '@/features/whatsapp/types/whatsapp.types'

const VALID_TEMPLATE_KEYS: TemplateKey[] = [
  'greeting',
  'menu',
  'select_child',
  'daily_summary',
  'invoice_status',
  'attendance',
  'photos',
  'incident',
  'prospect_welcome',
  'prospect_prices',
  'tour_scheduled',
  'after_hours',
  'unknown',
  'error',
]

const createTemplateSchema = z.object({
  template_key: z.enum(VALID_TEMPLATE_KEYS as [TemplateKey, ...TemplateKey[]]),
  content: z.string().min(1).max(4000),
})

const updateTemplateSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(4000),
  is_active: z.boolean().optional(),
})

// GET - Get all templates
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUserAuth()
    if (isAuthError(auth)) return auth.response

    const templates = await whatsappMessagesService.getAllTemplates(auth.organizationId)

    // Include default templates not yet customized
    const customizedKeys = new Set(templates.map((t) => t.template_key))
    const defaults = VALID_TEMPLATE_KEYS.filter((key) => !customizedKeys.has(key)).map((key) => ({
      id: null,
      organization_id: auth.organizationId,
      template_key: key,
      template_name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      content: getDefaultTemplate(key),
      variables: getDefaultVariables(key),
      language: 'es',
      is_active: true,
      is_default: true,
      created_at: null,
      updated_at: null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        templates: [...templates.map((t) => ({ ...t, is_default: false })), ...defaults],
        available_keys: VALID_TEMPLATE_KEYS,
      },
    })
  } catch (error) {
    console.error('[WhatsApp Admin] Get templates error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create/update template
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUserAuth()
    if (isAuthError(auth)) return auth.response

    const body = await request.json()
    const validation = createTemplateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { template_key, content } = validation.data

    const template = await whatsappMessagesService.upsertTemplate(
      auth.organizationId,
      template_key,
      content
    )

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Failed to save template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template,
    })
  } catch (error) {
    console.error('[WhatsApp Admin] Create template error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update existing template
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyUserAuth()
    if (isAuthError(auth)) return auth.response

    const body = await request.json()
    const validation = updateTemplateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { id, content, is_active } = validation.data
    const supabase = await createClient()

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from('whatsapp_templates')
      .select('id')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (checkError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    const { data: template, error } = await supabase
      .from('whatsapp_templates')
      .update({
        content,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: template,
    })
  } catch (error) {
    console.error('[WhatsApp Admin] Update template error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions for default templates
function getDefaultTemplate(key: TemplateKey): string {
  const defaults: Record<TemplateKey, string> = {
    greeting: 'Hola {{name}}! Bienvenido a {{center_name}}. ¿En qué puedo ayudarte hoy?',
    menu: '¿Qué te gustaría saber?\n\n1️⃣ Resumen del día\n2️⃣ Estado de asistencia\n3️⃣ Ver facturas\n4️⃣ Ver fotos\n5️⃣ Hablar con alguien',
    select_child: 'Tienes varios hijos registrados. ¿Sobre cuál te gustaría información?\n\n{{children_list}}',
    daily_summary: '📋 *Resumen de {{child_name}}*\n\n{{summary_content}}',
    invoice_status: '💰 *Estado de cuenta*\n\n{{invoices_list}}\n\nBalance total: ${{total_balance}}',
    attendance: '👶 *Asistencia de {{child_name}}*\n\nEstado: {{status}}',
    photos: '📸 *Fotos de {{child_name}}*\n\n{{photos_count}} foto(s) disponibles',
    incident: '⚠️ *Notificación Importante*\n\n{{incident_details}}',
    prospect_welcome: '¡Hola! 👋 Gracias por contactar a {{center_name}}. ¿En qué puedo ayudarte?',
    prospect_prices: '📋 *Nuestros programas*\n\n{{programs_list}}',
    tour_scheduled: '✅ *Visita Confirmada*\n\nTe esperamos el {{date}} a las {{time}}.',
    after_hours: 'Gracias por contactarnos. Nuestro horario es de {{start_hour}} a {{end_hour}}.',
    unknown: 'No entendí tu mensaje. Escribe "menu" para ver las opciones.',
    error: 'Lo siento, hubo un problema. Por favor intenta de nuevo.',
  }

  return defaults[key] || ''
}

function getDefaultVariables(key: TemplateKey): string[] {
  const variables: Record<TemplateKey, string[]> = {
    greeting: ['name', 'center_name'],
    menu: [],
    select_child: ['children_list'],
    daily_summary: ['child_name', 'summary_content'],
    invoice_status: ['invoices_list', 'total_balance'],
    attendance: ['child_name', 'status'],
    photos: ['child_name', 'photos_count'],
    incident: ['incident_details'],
    prospect_welcome: ['center_name'],
    prospect_prices: ['programs_list'],
    tour_scheduled: ['date', 'time'],
    after_hours: ['start_hour', 'end_hour'],
    unknown: [],
    error: [],
  }

  return variables[key] || []
}

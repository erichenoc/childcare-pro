// =====================================================
// POST /api/whatsapp/n8n/create-appointment
// Schedule a tour/appointment from WhatsApp
// Called by n8n workflow when prospect wants to visit
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { z } from 'zod'

const N8N_API_KEY = process.env.N8N_WEBHOOK_SECRET || process.env.WHATSAPP_API_KEY || ''

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.NODE_ENV === 'development' && !N8N_API_KEY) return true
  return apiKey === N8N_API_KEY
}

const createAppointmentSchema = z.object({
  instance: z.string().min(1),
  remote_jid: z.string().min(1),
  lead_id: z.string().uuid().optional(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(1),
  preferred_date: z.string().min(1), // Format: YYYY-MM-DD
  preferred_time: z.string().min(1), // Format: HH:MM
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createAppointmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const supabase = await createClient()

    // 1. Get organization from instance
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('organization_id, organizations(name, address)')
      .eq('instance_name', data.instance)
      .single()

    if (instanceError || !instance) {
      return NextResponse.json(
        { success: false, error: 'Instance not found' },
        { status: 404 }
      )
    }

    // 2. Find or create lead
    let leadId = data.lead_id

    if (!leadId) {
      const { data: existingLead } = await supabase
        .from('sales_leads')
        .select('id')
        .eq('organization_id', instance.organization_id)
        .eq('phone', data.phone)
        .single()

      if (existingLead) {
        leadId = existingLead.id
      } else {
        // Create lead
        const { data: newLead, error: leadError } = await supabase
          .from('sales_leads')
          .insert({
            organization_id: instance.organization_id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            source: 'whatsapp',
            status: 'tour_scheduled',
          })
          .select()
          .single()

        if (leadError) {
          throw leadError
        }
        leadId = newLead.id
      }
    }

    // 3. Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        organization_id: instance.organization_id,
        lead_id: leadId,
        type: 'tour',
        scheduled_date: data.preferred_date,
        scheduled_time: data.preferred_time,
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
        status: 'scheduled',
        source: 'whatsapp',
      })
      .select()
      .single()

    if (appointmentError) {
      throw appointmentError
    }

    // 4. Update lead status
    await supabase
      .from('sales_leads')
      .update({ status: 'tour_scheduled' })
      .eq('id', leadId)

    const org = instance.organizations as { name: string; address: string } | null

    return NextResponse.json({
      success: true,
      data: {
        appointment,
        lead_id: leadId,
      },
      formatted: {
        text: `✅ *Visita Confirmada*

Te esperamos el *${data.preferred_date}* a las *${data.preferred_time}*.

📍 Dirección: ${org?.address || 'Por confirmar'}

Por favor llega 10 minutos antes para el registro. Si necesitas cambiar la fecha, responde a este mensaje o llama directamente.

¡Te esperamos, ${data.name}! 👋`,
      },
    })
  } catch (error) {
    console.error('[WhatsApp API] Create appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

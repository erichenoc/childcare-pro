// =====================================================
// POST /api/whatsapp/n8n/create-lead
// Create a new sales lead from WhatsApp prospect
// Called by n8n workflow when prospect provides info
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { verifyN8nSecret } from '@/shared/lib/n8n-auth'
// Service-role: org is resolved server-side from the trusted whatsapp_instances row.
import { createServiceClient } from '@/shared/lib/supabase/service'
import { whatsappIdentityService } from '@/features/whatsapp/services/whatsapp-identity.service'
import { z } from 'zod'


const createLeadSchema = z.object({
  instance: z.string().min(1),
  remote_jid: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(1),
  interest: z.string().optional(),
  children_ages: z.array(z.string()).optional(),
  notes: z.string().optional(),
  source: z.string().default('whatsapp'),
})

export async function POST(request: NextRequest) {
  try {
    if (!verifyN8nSecret(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createLeadSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const supabase = createServiceClient()

    // 1. Get organization from instance
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('organization_id')
      .eq('instance_name', data.instance)
      .single()

    if (instanceError || !instance) {
      return NextResponse.json(
        { success: false, error: 'Instance not found' },
        { status: 404 }
      )
    }

    // 2. Check if lead already exists
    const { data: existingLead } = await supabase
      .from('sales_leads')
      .select('id')
      .eq('organization_id', instance.organization_id)
      .eq('phone', data.phone)
      .single()

    if (existingLead) {
      // Update existing lead
      const { data: updatedLead, error: updateError } = await supabase
        .from('sales_leads')
        .update({
          name: data.name,
          email: data.email,
          interest: data.interest,
          children_ages: data.children_ages,
          notes: data.notes ? `${data.notes} (WhatsApp)` : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Update session prospect data
      await whatsappIdentityService.updateProspectData(data.remote_jid, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        interest: data.interest,
        children_ages: data.children_ages,
      })

      return NextResponse.json({
        success: true,
        data: {
          lead: updatedLead,
          is_new: false,
        },
        formatted: {
          text: `✅ Hemos actualizado tu información, ${data.name}. ¡Gracias!`,
        },
      })
    }

    // 3. Create new lead
    const { data: newLead, error: createError } = await supabase
      .from('sales_leads')
      .insert({
        organization_id: instance.organization_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        source: data.source,
        interest: data.interest,
        children_ages: data.children_ages,
        notes: data.notes,
        status: 'new',
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    // Update session prospect data
    await whatsappIdentityService.updateProspectData(data.remote_jid, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      interest: data.interest,
      children_ages: data.children_ages,
    })

    return NextResponse.json({
      success: true,
      data: {
        lead: newLead,
        is_new: true,
      },
      formatted: {
        text: `✅ ¡Gracias ${data.name}! Hemos registrado tu información. Un miembro de nuestro equipo te contactará pronto.`,
      },
    })
  } catch (error) {
    console.error('[WhatsApp API] Create lead error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'

// GET - List all appointments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const leadId = searchParams.get('lead_id')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')

    let query = supabase
      .from('appointments')
      .select('*, sales_leads(*)')
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }
    if (leadId) {
      query = query.eq('lead_id', leadId)
    }
    if (fromDate) {
      query = query.gte('scheduled_date', fromDate)
    }
    if (toDate) {
      query = query.lte('scheduled_date', toDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ appointments: data })
  } catch (error) {
    console.error('Appointments API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      lead_id,
      title = 'Product Demo - ChildCare AI',
      description,
      appointment_type = 'demo',
      scheduled_date,
      scheduled_time,
      duration_minutes = 30,
      timezone = 'America/New_York',
      lead_name,
      lead_email,
      lead_phone,
      meeting_notes
    } = body

    // Validate required fields
    if (!scheduled_date || !scheduled_time) {
      return NextResponse.json(
        { error: 'scheduled_date and scheduled_time are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        lead_id,
        title,
        description,
        appointment_type,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        timezone,
        lead_name,
        lead_email,
        lead_phone,
        meeting_notes
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update lead status to demo_scheduled if lead_id provided
    if (lead_id) {
      await supabase
        .from('sales_leads')
        .update({ status: 'demo_scheduled' })
        .eq('id', lead_id)
    }

    // TODO: Send confirmation email to lead and admin
    // This would integrate with a service like Resend, SendGrid, etc.

    return NextResponse.json({ appointment: data }, { status: 201 })
  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

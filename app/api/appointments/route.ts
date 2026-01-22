import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { verifyAdminAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { createAppointmentSchema, getAppointmentsQuerySchema } from '@/shared/lib/validations'
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'

// GET - List all appointments (Admin only)
export async function GET(request: NextRequest) {
  try {
    // 🔐 AUTHENTICATION: Verify admin access
    const authResult = await verifyAdminAuth()
    if (isAuthError(authResult)) {
      console.error('[Appointments API] Unauthorized access attempt')
      return authResult.response
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // 🛡️ VALIDATION: Parse and validate query parameters
    const queryParams = {
      status: searchParams.get('status') || undefined,
      lead_id: searchParams.get('lead_id') || undefined,
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined
    }

    const validationResult = getAppointmentsQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      console.error('[Appointments API] Invalid query parameters:', validationResult.error.flatten())
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { status, lead_id: leadId, from_date: fromDate, to_date: toDate } = validationResult.data

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

    console.log('[Appointments API] Fetched', data?.length, 'appointments by admin:', authResult.user.email)

    return NextResponse.json({ appointments: data })
  } catch (error) {
    console.error('Appointments API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new appointment (Public - used by sales chat widget for demo booking)
// Note: This endpoint is intentionally public to allow appointment scheduling from the website
export async function POST(request: NextRequest) {
  // 🛡️ RATE LIMITING: Prevent spam and abuse
  const rateLimitResponse = checkRateLimit(request, RateLimits.public, 'appointments-create')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const supabase = await createClient()
    const body = await request.json()

    // 🛡️ VALIDATION: Parse and validate request body with Zod
    const validationResult = createAppointmentSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('[Appointments API] Validation failed:', validationResult.error.flatten())
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
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
    } = validationResult.data

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

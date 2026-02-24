import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { verifyAdminAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'

// GET - Get a single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = checkRateLimit(request, RateLimits.authenticated, 'appointments-id')
    if (rateLimited) return rateLimited

    const auth = await verifyAdminAuth()
    if (isAuthError(auth)) return auth.response

    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('appointments')
      .select('*, sales_leads(*)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching appointment:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ appointment: data })
  } catch (error) {
    console.error('Get appointment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update an appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = checkRateLimit(request, RateLimits.authenticated, 'appointments-id')
    if (rateLimited) return rateLimited

    const auth = await verifyAdminAuth()
    if (isAuthError(auth)) return auth.response

    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Handle status changes
    if (body.status === 'completed') {
      body.completed_at = new Date().toISOString()
    }
    if (body.status === 'cancelled') {
      body.cancelled_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating appointment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ appointment: data })
  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete an appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = checkRateLimit(request, RateLimits.strict, 'appointments-id-delete')
    if (rateLimited) return rateLimited

    const auth = await verifyAdminAuth()
    if (isAuthError(auth)) return auth.response

    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting appointment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete appointment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

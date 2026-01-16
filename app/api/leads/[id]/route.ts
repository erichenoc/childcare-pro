import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'

// GET - Get a single lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('sales_leads')
      .select('*, appointments(*)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching lead:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ lead: data })
  } catch (error) {
    console.error('Get lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update a lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // If status is being updated to converted, set converted_at
    if (body.status === 'converted') {
      body.converted_at = new Date().toISOString()
    }

    // If adding a message to conversation history
    if (body.new_message) {
      const { data: current } = await supabase
        .from('sales_leads')
        .select('conversation_history, total_messages')
        .eq('id', id)
        .single()

      if (current) {
        const history = current.conversation_history || []
        history.push(body.new_message)
        body.conversation_history = history
        body.total_messages = (current.total_messages || 0) + 1
        body.last_message_at = new Date().toISOString()
      }
      delete body.new_message
    }

    const { data, error } = await supabase
      .from('sales_leads')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lead: data })
  } catch (error) {
    console.error('Update lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('sales_leads')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting lead:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

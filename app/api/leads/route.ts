import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'

// GET - List all leads
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let query = supabase
      .from('sales_leads')
      .select('*, appointments(*)', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }
    if (source) {
      query = query.eq('source', source)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      leads: data,
      total: count,
      limit,
      offset
    })
  } catch (error) {
    console.error('Leads API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      name,
      email,
      phone,
      company_name,
      source = 'chat_widget',
      daycare_size,
      location,
      current_pain_points,
      interested_features,
      conversation_history,
      utm_source,
      utm_medium,
      utm_campaign,
      referrer_url,
      landing_page,
      notes
    } = body

    // Calculate initial lead score based on provided info
    let score = 0
    if (email) score += 20
    if (phone) score += 15
    if (company_name) score += 10
    if (daycare_size) score += 10
    if (current_pain_points?.length > 0) score += 15
    if (interested_features?.length > 0) score += 10
    if (conversation_history?.length > 3) score += 20

    // Determine priority based on score
    let priority = 'medium'
    if (score >= 70) priority = 'high'
    else if (score >= 50) priority = 'medium'
    else priority = 'low'

    const { data, error } = await supabase
      .from('sales_leads')
      .insert({
        name,
        email,
        phone,
        company_name,
        source,
        daycare_size,
        location,
        current_pain_points,
        interested_features,
        conversation_history,
        total_messages: conversation_history?.length || 0,
        last_message_at: new Date().toISOString(),
        score,
        priority,
        utm_source,
        utm_medium,
        utm_campaign,
        referrer_url,
        landing_page,
        notes
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lead: data }, { status: 201 })
  } catch (error) {
    console.error('Create lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

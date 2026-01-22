import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { verifyAdminAuth, isAuthError } from '@/shared/lib/auth-helpers'
import { createLeadSchema, getLeadsQuerySchema } from '@/shared/lib/validations'
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'
import { AuditLogger } from '@/shared/lib/audit-logger'

// GET - List all leads (Admin only)
export async function GET(request: NextRequest) {
  try {
    // 🔐 AUTHENTICATION: Verify admin access
    const authResult = await verifyAdminAuth()
    if (isAuthError(authResult)) {
      console.error('[Leads API] Unauthorized access attempt')
      return authResult.response
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // 🛡️ VALIDATION: Parse and validate query parameters
    const queryParams = {
      status: searchParams.get('status') || undefined,
      source: searchParams.get('source') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined
    }

    const validationResult = getLeadsQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      console.error('[Leads API] Invalid query parameters:', validationResult.error.flatten())
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { status, source, limit, offset, sortBy, sortOrder } = validationResult.data

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

    console.log('[Leads API] Fetched', data?.length, 'leads by admin:', authResult.user.email)

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

// POST - Create a new lead (Public - used by chat widget)
// Note: This endpoint is intentionally public to allow lead capture from the website
export async function POST(request: NextRequest) {
  // 🛡️ RATE LIMITING: Prevent spam and abuse
  const rateLimitResponse = checkRateLimit(request, RateLimits.public, 'leads-create')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const supabase = await createClient()
    const body = await request.json()

    // 🛡️ VALIDATION: Parse and validate request body with Zod
    const validationResult = createLeadSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('[Leads API] Validation failed:', validationResult.error.flatten())
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
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
      utm_source,
      utm_medium,
      utm_campaign,
      referrer_url,
      landing_page,
      notes
    } = validationResult.data

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

    console.log('[Leads API] New lead created:', data.id, 'from source:', source)

    // 📝 AUDIT: Log lead creation
    await AuditLogger.leadCreated(data.id, source || 'unknown', request.headers)

    return NextResponse.json({ lead: data }, { status: 201 })
  } catch (error) {
    console.error('Create lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

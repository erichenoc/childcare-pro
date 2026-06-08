import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/shared/lib/supabase/server'
import { provisionOrganizationForUser } from '@/shared/lib/onboarding'
import { checkRateLimit, RateLimits } from '@/shared/lib/rate-limiter'

const bodySchema = z.object({
  orgName: z.string().min(1).max(120),
  orgPhone: z.string().max(40).optional(),
})

/**
 * POST /api/onboarding/organization
 * Creates a new organization (tenant) and makes the authenticated caller its
 * owner. Robust, server-side replacement for the previous client-side flow:
 * atomic, RLS-safe (service-role), and independent of localStorage / email
 * confirmation timing. Idempotent — calling again returns the existing org.
 */
export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request, RateLimits.strict, 'onboarding-org')
  if (rateLimited) return rateLimited

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.errors },
      { status: 400 }
    )
  }

  // Profile details come from the verified auth user's metadata (set at signUp),
  // never from arbitrary request input.
  const meta = (user.user_metadata || {}) as Record<string, string>
  const firstName = meta.first_name || meta.name?.split(' ')[0] || 'Owner'
  const lastName = meta.last_name || meta.name?.split(' ').slice(1).join(' ') || ''

  try {
    const result = await provisionOrganizationForUser({
      userId: user.id,
      email: user.email || '',
      firstName,
      lastName,
      orgName: parsed.data.orgName,
      orgEmail: user.email,
      orgPhone: parsed.data.orgPhone ?? null,
    })

    return NextResponse.json({
      organizationId: result.organizationId,
      created: result.created,
    })
  } catch (error) {
    console.error('[onboarding] provisioning failed:', error)
    return NextResponse.json(
      { error: 'Could not create organization' },
      { status: 500 }
    )
  }
}

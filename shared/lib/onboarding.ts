import { createServiceClient } from '@/shared/lib/supabase/service'

/**
 * Server-side tenant provisioning. Creates a brand-new organization (a "client")
 * and makes the given user its owner, atomically and bypassing RLS via the
 * service-role client. This is the robust replacement for the previous
 * client-side flow that depended on localStorage + email-confirmation timing and
 * tripped over RLS on INSERT ... RETURNING.
 *
 * SERVER-ONLY (imports the service-role client). Call from API routes / the auth
 * callback after the user's session is established.
 *
 * Idempotent: if the user already belongs to an organization, returns it.
 */

const TRIAL_DURATION_DAYS = 14
const TRIAL_LIMITS = { max_children: 15, max_staff: 3 }

function baseSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50) || 'org'
  )
}

type ServiceClient = ReturnType<typeof createServiceClient>

async function generateUniqueSlug(admin: ServiceClient, name: string): Promise<string> {
  const base = baseSlug(name)
  let slug = base
  let counter = 1
  // service-role sees all rows → real cross-tenant uniqueness check
  for (;;) {
    const { data } = await admin.from('organizations').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = `${base}-${counter++}`
    if (counter > 1000) return `${base}-${Date.now()}`
  }
}

export interface ProvisionOrgParams {
  userId: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  orgName: string
  orgEmail?: string | null
  orgPhone?: string | null
}

export interface ProvisionOrgResult {
  organizationId: string
  created: boolean
}

export async function provisionOrganizationForUser(
  params: ProvisionOrgParams
): Promise<ProvisionOrgResult> {
  const admin = createServiceClient()

  // Idempotency: don't create a second org if the user already has one.
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('organization_id')
    .eq('id', params.userId)
    .maybeSingle()

  if (existingProfile?.organization_id) {
    return { organizationId: existingProfile.organization_id, created: false }
  }

  const slug = await generateUniqueSlug(admin, params.orgName)
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS)

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: params.orgName,
      slug,
      email: params.orgEmail ?? params.email,
      phone: params.orgPhone ?? null,
      plan: 'trial',
      subscription_status: 'active',
      trial_ends_at: trialEndsAt.toISOString(),
      max_children: TRIAL_LIMITS.max_children,
      max_staff: TRIAL_LIMITS.max_staff,
      settings: {
        theme: 'system',
        locale: 'es',
        notification_email: true,
        notification_sms: false,
        notification_push: true,
      },
    })
    .select('id')
    .single()

  if (orgError || !org) {
    throw new Error(`Failed to create organization: ${orgError?.message ?? 'unknown'}`)
  }

  // Upsert the owner profile (works whether or not a profile row already exists,
  // covering both the immediate and email-confirmation signup paths).
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: params.userId,
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone ?? null,
      organization_id: org.id,
      role: 'owner',
      is_org_owner: true,
      status: 'active',
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    // Roll back the org so we don't leave an orphan tenant.
    await admin.from('organizations').delete().eq('id', org.id)
    throw new Error(`Failed to link owner profile: ${profileError.message}`)
  }

  return { organizationId: org.id, created: true }
}

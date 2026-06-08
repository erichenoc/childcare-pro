import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { provisionOrganizationForUser } from '@/shared/lib/onboarding'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      const user = session.user
      const metadata = (user.user_metadata || {}) as Record<string, string>

      // Does the user already belong to an organization?
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.organization_id) {
        const firstName =
          metadata.first_name ||
          metadata.full_name?.split(' ')[0] ||
          metadata.name?.split(' ')[0] ||
          'Owner'
        const lastName =
          metadata.last_name ||
          metadata.full_name?.split(' ').slice(1).join(' ') ||
          metadata.name?.split(' ').slice(1).join(' ') ||
          ''

        // Each new user gets their OWN organization (tenant). We NEVER drop a new
        // user into an existing organization — that would be a cross-tenant breach.
        // Email/password signups carry the daycare name in metadata; OAuth users get
        // an auto-named org they can rename in Settings.
        const orgName =
          metadata.pending_org_name ||
          `${firstName}${lastName ? ' ' + lastName : ''}`.trim() ||
          (user.email ? user.email.split('@')[0] : 'Mi Guardería')

        try {
          await provisionOrganizationForUser({
            userId: user.id,
            email: user.email || '',
            firstName,
            lastName,
            orgName,
            orgEmail: user.email,
            orgPhone: metadata.pending_org_phone ?? null,
          })
        } catch (provisionError) {
          console.error('[auth/callback] org provisioning failed:', provisionError)
        }
      }
    }
  }

  // Redirect to dashboard after sign in
  return NextResponse.redirect(`${origin}/dashboard`)
}

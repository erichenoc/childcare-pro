import { createClient } from '@/shared/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/family-portal'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Verify user is a guardian with portal access
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: guardian } = await supabase
          .from('guardians')
          .select('id, has_portal_access')
          .eq('portal_user_id', user.id)
          .eq('has_portal_access', true)
          .single()

        if (guardian) {
          // Update last login
          await supabase
            .from('guardians')
            .update({ portal_last_login: new Date().toISOString() })
            .eq('id', guardian.id)

          return NextResponse.redirect(`${origin}${next}`)
        }
      }

      // No portal access - sign out and redirect to login with error
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/family-portal/login?error=no_access`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/family-portal/login?error=auth_failed`)
}

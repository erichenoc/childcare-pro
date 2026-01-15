import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const DEMO_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

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
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single()

      // Create profile if it doesn't exist (OAuth users)
      if (!profile) {
        const user = session.user
        const metadata = user.user_metadata || {}

        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email!,
          first_name: metadata.full_name?.split(' ')[0] || metadata.name?.split(' ')[0] || 'Usuario',
          last_name: metadata.full_name?.split(' ').slice(1).join(' ') || metadata.name?.split(' ').slice(1).join(' ') || '',
          avatar_url: metadata.avatar_url || metadata.picture || null,
          organization_id: DEMO_ORG_ID,
          role: 'teacher',
          status: 'active',
        })
      }
    }
  }

  // Redirect to dashboard after sign in
  return NextResponse.redirect(`${origin}/dashboard`)
}

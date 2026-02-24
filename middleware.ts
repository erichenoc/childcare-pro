import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Feature requirements for premium routes (duplicated from plan-config for edge runtime)
const PROFESSIONAL_ROUTES = [
  '/dashboard/communication',
  '/dashboard/reports',
  '/dashboard/incidents',
  '/dashboard/immunizations',
  '/dashboard/documents',
  '/dashboard/food-program',
  '/dashboard/learning',
  '/dashboard/programs',
  '/dashboard/admissions',
]

const ENTERPRISE_ROUTES = [
  '/dashboard/accounting',
  '/dashboard/compliance',
]

const PLAN_HIERARCHY: Record<string, number> = {
  cancelled: 0,
  starter: 1,
  trial: 2, // trial gets professional features
  professional: 2,
  enterprise: 3,
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect to login if not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect old /chat routes to dashboard
  if (request.nextUrl.pathname.startsWith('/chat')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Plan-based route protection (only for authenticated dashboard routes)
  if (user && isProtectedRoute) {
    const pathname = request.nextUrl.pathname

    // Check if route requires a specific plan
    const needsProfessional = PROFESSIONAL_ROUTES.some(route => pathname.startsWith(route))
    const needsEnterprise = ENTERPRISE_ROUTES.some(route => pathname.startsWith(route))

    if (needsProfessional || needsEnterprise) {
      // Get user's organization plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('plan, trial_ends_at')
          .eq('id', profile.organization_id)
          .single()

        if (org) {
          let planLevel = PLAN_HIERARCHY[org.plan || 'cancelled'] ?? 0

          // Check if trial has expired
          if (org.plan === 'trial' && org.trial_ends_at) {
            const trialEnd = new Date(org.trial_ends_at)
            if (trialEnd < new Date()) {
              planLevel = 0 // Expired trial = cancelled
            }
          }

          const requiredLevel = needsEnterprise ? 3 : 2

          if (planLevel < requiredLevel) {
            // Redirect to settings billing tab with upgrade message
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/settings'
            url.searchParams.set('tab', 'billing')
            url.searchParams.set('upgrade', needsEnterprise ? 'enterprise' : 'professional')
            return NextResponse.redirect(url)
          }
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

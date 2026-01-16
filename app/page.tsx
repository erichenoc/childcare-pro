import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'
import LandingPage from './(marketing)/page'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Show landing page for non-authenticated visitors
  return <LandingPage />
}

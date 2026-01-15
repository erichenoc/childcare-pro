import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to dashboard if authenticated, login if not
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}

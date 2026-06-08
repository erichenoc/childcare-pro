import { NextResponse } from 'next/server'
import { createServiceClient } from '@/shared/lib/supabase/service'

// Lightweight health/uptime endpoint. Safe to expose: returns only coarse
// status booleans, never secrets or data. Use it for uptime monitors and
// load-balancer health checks.
export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, 'ok' | 'down' | 'unconfigured'> = {
    database: 'down',
    stripe: process.env.STRIPE_SECRET_KEY ? 'ok' : 'unconfigured',
    email: process.env.RESEND_API_KEY ? 'ok' : 'unconfigured',
  }

  try {
    const supabase = createServiceClient()
    // Cheap round-trip against a non-sensitive table.
    const { error } = await supabase.from('keepalive').select('key').limit(1)
    checks.database = error ? 'down' : 'ok'
  } catch {
    checks.database = 'down'
  }

  const healthy = checks.database === 'ok'

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  )
}

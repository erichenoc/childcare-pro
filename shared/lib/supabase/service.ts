import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. BYPASSES Row Level Security.
 *
 * SERVER-ONLY. Never import this into a client component or expose the returned
 * client to the browser. Use ONLY in API route handlers / server actions for
 * trusted server-to-server flows (Stripe webhook, n8n WhatsApp routes, public
 * lead capture) where there is no authenticated user session to drive RLS.
 *
 * IMPORTANT: Because this bypasses RLS, every query made with this client MUST
 * explicitly scope by the organization_id that was resolved/verified on the
 * server (never trust an organization_id taken straight from the request body).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'createServiceClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

import { timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * Verifies the shared secret sent by the n8n WhatsApp workflows.
 *
 * Security properties (fixes the prior substring / service-role-fallback flaws):
 *  - Requires a dedicated N8N_WEBHOOK_SECRET (or WHATSAPP_API_KEY). It NEVER
 *    falls back to SUPABASE_SERVICE_ROLE_KEY.
 *  - Fails CLOSED if the secret env var is not configured.
 *  - Uses a constant-time comparison (crypto.timingSafeEqual) on the full token,
 *    never String.includes() or a short-circuiting `===`.
 *
 * Accepts the secret via the `x-api-key` header or `Authorization: Bearer <secret>`.
 */
export function verifyN8nSecret(request: NextRequest): boolean {
  const expected = process.env.N8N_WEBHOOK_SECRET || process.env.WHATSAPP_API_KEY || ''

  // Fail closed: no secret configured => deny everything.
  if (!expected) {
    console.error('[n8n-auth] N8N_WEBHOOK_SECRET/WHATSAPP_API_KEY not configured — denying request')
    return false
  }

  const provided =
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''

  if (!provided) return false

  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(expected, 'utf8')

  // timingSafeEqual throws on length mismatch; guard it but still spend time.
  if (a.length !== b.length) {
    timingSafeEqual(b, b)
    return false
  }

  return timingSafeEqual(a, b)
}

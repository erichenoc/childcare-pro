/**
 * Authentication helpers for API routes
 *
 * Provides reusable functions for verifying user authentication
 * and admin authorization in Next.js API routes.
 */

import { createClient } from '@/shared/lib/supabase/server'
import { NextResponse } from 'next/server'

export interface AuthResult {
  user: {
    id: string
    email: string
  }
  isAdmin: boolean
}

export interface AuthError {
  response: NextResponse
  error: string
}

/**
 * Verify that a request is from an authenticated admin user.
 * Checks both the hardcoded super admin email and the system_admins table.
 *
 * @returns AuthResult on success, AuthError on failure
 */
export async function verifyAdminAuth(): Promise<AuthResult | AuthError> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      error: 'Not authenticated',
    }
  }

  // Check if user is super admin
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
  const isSuperAdmin = superAdminEmail && user.email === superAdminEmail

  if (isSuperAdmin) {
    return {
      user: { id: user.id, email: user.email || '' },
      isAdmin: true,
    }
  }

  // Check system_admins table
  const { data: adminData } = await supabase
    .from('system_admins')
    .select('id')
    .eq('email', user.email)
    .eq('is_active', true)
    .single()

  if (adminData) {
    return {
      user: { id: user.id, email: user.email || '' },
      isAdmin: true,
    }
  }

  return {
    response: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }),
    error: 'Not an admin',
  }
}

/**
 * Verify that a request is from an authenticated user.
 * Returns user info and their organization.
 */
export async function verifyUserAuth(): Promise<{
  user: { id: string; email: string }
  organizationId: string
} | AuthError> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      error: 'Not authenticated',
    }
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return {
      response: NextResponse.json({ error: 'User has no organization' }, { status: 403 }),
      error: 'No organization',
    }
  }

  return {
    user: { id: user.id, email: user.email || '' },
    organizationId: profile.organization_id,
  }
}

/**
 * Type guard to check if result is an error
 */
export function isAuthError(result: unknown): result is AuthError {
  return typeof result === 'object' && result !== null && 'response' in result && 'error' in result
}

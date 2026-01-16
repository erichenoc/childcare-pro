import { createClient } from '@/shared/lib/supabase/client'

// Cache for organization ID to avoid repeated queries
let cachedOrgId: string | null = null
let cacheExpiry: number = 0

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get the current user's organization ID
 * Uses caching to reduce database queries
 */
export async function getCurrentOrgId(): Promise<string | null> {
  // Check cache first
  if (cachedOrgId && Date.now() < cacheExpiry) {
    return cachedOrgId
  }

  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    cachedOrgId = null
    return null
  }

  // Get user's profile to find organization_id
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (error || !profile?.organization_id) {
    cachedOrgId = null
    return null
  }

  // Update cache
  cachedOrgId = profile.organization_id
  cacheExpiry = Date.now() + CACHE_DURATION

  return cachedOrgId
}

/**
 * Clear the cached organization ID
 * Call this on logout or when organization changes
 */
export function clearOrgIdCache(): void {
  cachedOrgId = null
  cacheExpiry = 0
}

/**
 * Set the cached organization ID
 * Useful when we already know the org ID to avoid extra queries
 */
export function setOrgIdCache(orgId: string): void {
  cachedOrgId = orgId
  cacheExpiry = Date.now() + CACHE_DURATION
}

/**
 * Check if user has an organization
 */
export async function hasOrganization(): Promise<boolean> {
  const orgId = await getCurrentOrgId()
  return orgId !== null
}

/**
 * Require organization ID or throw error
 * Use this in services that require an organization
 */
export async function requireOrgId(): Promise<string> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('No organization found. Please complete your organization setup.')
  }
  return orgId
}

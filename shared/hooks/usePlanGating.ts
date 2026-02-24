'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/shared/lib/supabase/client'
import { hasFeatureAccess, NAV_FEATURE_MAP, calculateMonthlyPrice } from '@/shared/lib/plan-config'
import type { SubscriptionPlanType } from '@/shared/types/database.types'

interface PlanGatingState {
  plan: SubscriptionPlanType | null
  isLoading: boolean
  activeChildCount: number
  /** Check if a feature key (from NAV_FEATURE_MAP values) is accessible */
  canAccess: (feature: string) => boolean
  /** Check if a nav item key (sidebar key) is accessible */
  canAccessNav: (navKey: string) => boolean
  /** Current monthly price based on plan and child count */
  currentMonthlyPrice: number
}

let cachedPlan: SubscriptionPlanType | null = null
let cachedChildCount: number | null = null
let cacheTimestamp = 0
const CACHE_TTL = 60_000 // 1 minute

export function usePlanGating(): PlanGatingState {
  const [plan, setPlan] = useState<SubscriptionPlanType | null>(cachedPlan)
  const [activeChildCount, setActiveChildCount] = useState(cachedChildCount ?? 0)
  const [isLoading, setIsLoading] = useState(!cachedPlan)

  useEffect(() => {
    const now = Date.now()
    if (cachedPlan && now - cacheTimestamp < CACHE_TTL) {
      setPlan(cachedPlan)
      setActiveChildCount(cachedChildCount ?? 0)
      setIsLoading(false)
      return
    }

    async function loadPlanData() {
      try {
        const supabase = createClient()

        // Get current user's organization
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()

        if (!profile?.organization_id) return

        // Get organization plan and child count in parallel
        const [orgResult, childCountResult] = await Promise.all([
          supabase
            .from('organizations')
            .select('plan, trial_ends_at')
            .eq('id', profile.organization_id)
            .single(),
          supabase
            .from('children')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', profile.organization_id)
            .eq('status', 'active'),
        ])

        if (orgResult.data) {
          let orgPlan = orgResult.data.plan as SubscriptionPlanType

          // Check if trial is still valid
          if (orgPlan === 'trial' && orgResult.data.trial_ends_at) {
            const trialEnd = new Date(orgResult.data.trial_ends_at)
            if (trialEnd < new Date()) {
              orgPlan = 'cancelled'
            }
          }

          cachedPlan = orgPlan
          setPlan(orgPlan)
          cacheTimestamp = Date.now()
        }

        const count = childCountResult.count ?? 0
        cachedChildCount = count
        setActiveChildCount(count)
      } catch (error) {
        console.error('Error loading plan data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPlanData()
  }, [])

  const canAccess = useCallback(
    (feature: string) => hasFeatureAccess(plan, feature),
    [plan]
  )

  const canAccessNav = useCallback(
    (navKey: string) => {
      const feature = NAV_FEATURE_MAP[navKey]
      if (!feature) return true // If not mapped, allow access
      return hasFeatureAccess(plan, feature)
    },
    [plan]
  )

  const currentMonthlyPrice = plan && plan !== 'trial' && plan !== 'cancelled'
    ? calculateMonthlyPrice(plan as 'starter' | 'professional' | 'enterprise', activeChildCount)
    : 0

  return {
    plan,
    isLoading,
    activeChildCount,
    canAccess,
    canAccessNav,
    currentMonthlyPrice,
  }
}

/**
 * Invalidate the plan cache (call after plan changes)
 */
export function invalidatePlanCache() {
  cachedPlan = null
  cachedChildCount = null
  cacheTimestamp = 0
}

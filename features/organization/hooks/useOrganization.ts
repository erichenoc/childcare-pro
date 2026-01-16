'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { organizationService, type Organization, type OrganizationSettings } from '../services/organization.service'
import { subscriptionService, type SubscriptionDetails } from '../services/subscription.service'
import type { SubscriptionPlanType } from '@/shared/types/database.types'

interface UseOrganizationState {
  organization: Organization | null
  subscription: SubscriptionDetails | null
  isLoading: boolean
  error: Error | null
}

interface UseOrganizationReturn extends UseOrganizationState {
  // Organization actions
  refetch: () => Promise<void>
  updateOrg: (updates: Partial<Organization>) => Promise<void>
  updateSettings: (settings: Partial<OrganizationSettings>) => Promise<void>
  updateLogo: (logoUrl: string) => Promise<void>

  // Computed values
  isActive: boolean
  isTrial: boolean
  trialDaysRemaining: number
  currentPlan: SubscriptionPlanType | null
  limits: { children: { current: number; max: number }; staff: { current: number; max: number } } | null

  // Feature flags
  canAddChild: boolean
  canAddStaff: boolean
}

export function useOrganization(): UseOrganizationReturn {
  const [state, setState] = useState<UseOrganizationState>({
    organization: null,
    subscription: null,
    isLoading: true,
    error: null,
  })

  const [limits, setLimits] = useState<{
    children: { current: number; max: number }
    staff: { current: number; max: number }
  } | null>(null)

  // Fetch organization data
  const fetchOrganization = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const org = await organizationService.getCurrentUserOrg()

      if (!org) {
        setState(prev => ({
          ...prev,
          organization: null,
          subscription: null,
          isLoading: false,
        }))
        return
      }

      // Fetch subscription details and limits in parallel
      const [subscriptionDetails, orgLimits] = await Promise.all([
        subscriptionService.getDetails(org.id),
        organizationService.checkLimits(org.id),
      ])

      setState({
        organization: org,
        subscription: subscriptionDetails,
        isLoading: false,
        error: null,
      })

      setLimits(orgLimits)
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }))
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchOrganization()
  }, [fetchOrganization])

  // Update organization
  const updateOrg = useCallback(async (updates: Partial<Organization>) => {
    if (!state.organization) return

    try {
      const updated = await organizationService.update(state.organization.id, updates)
      setState(prev => ({ ...prev, organization: updated }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [state.organization])

  // Update settings
  const updateSettings = useCallback(async (settings: Partial<OrganizationSettings>) => {
    if (!state.organization) return

    try {
      const updated = await organizationService.updateSettings(state.organization.id, settings)
      setState(prev => ({ ...prev, organization: updated }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [state.organization])

  // Update logo
  const updateLogo = useCallback(async (logoUrl: string) => {
    if (!state.organization) return

    try {
      const updated = await organizationService.updateLogo(state.organization.id, logoUrl)
      setState(prev => ({ ...prev, organization: updated }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }))
      throw error
    }
  }, [state.organization])

  // Computed values
  const isActive = useMemo(() => {
    return state.subscription?.isActive ?? false
  }, [state.subscription])

  const isTrial = useMemo(() => {
    return state.subscription?.isTrial ?? false
  }, [state.subscription])

  const trialDaysRemaining = useMemo(() => {
    if (!isTrial) return 0
    return state.subscription?.daysRemaining ?? 0
  }, [isTrial, state.subscription])

  const currentPlan = useMemo(() => {
    return state.organization?.plan ?? null
  }, [state.organization])

  const canAddChild = useMemo(() => {
    if (!isActive || !limits) return false
    return limits.children.current < limits.children.max
  }, [isActive, limits])

  const canAddStaff = useMemo(() => {
    if (!isActive || !limits) return false
    return limits.staff.current < limits.staff.max
  }, [isActive, limits])

  return {
    // State
    organization: state.organization,
    subscription: state.subscription,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    refetch: fetchOrganization,
    updateOrg,
    updateSettings,
    updateLogo,

    // Computed
    isActive,
    isTrial,
    trialDaysRemaining,
    currentPlan,
    limits,

    // Feature flags
    canAddChild,
    canAddStaff,
  }
}

// Simple hook to get organization ID only (for use in services)
export function useOrgId(): string | null {
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrgId() {
      try {
        const org = await organizationService.getCurrentUserOrg()
        setOrgId(org?.id ?? null)
      } catch {
        setOrgId(null)
      }
    }
    fetchOrgId()
  }, [])

  return orgId
}

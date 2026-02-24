/**
 * Central Plan Configuration
 *
 * Single source of truth for all subscription plan data:
 * - Per-child pricing with monthly minimums
 * - Feature access by plan tier
 * - Route/navigation gating
 * - Plan limits
 */

import type { SubscriptionPlanType } from '@/shared/types/database.types'

// ==========================================
// PRICING MODEL: Per-child/month with minimums
// ==========================================

export interface PlanPricing {
  perChild: number       // dollars per child per month
  minimum: number        // minimum monthly charge in dollars
  annualDiscount: number  // fraction discount for annual (e.g. 0.17 = 17% off)
}

export const PLAN_PRICING: Record<'starter' | 'professional' | 'enterprise', PlanPricing> = {
  starter: {
    perChild: 1.50,
    minimum: 29,
    annualDiscount: 0.17,
  },
  professional: {
    perChild: 2.50,
    minimum: 49,
    annualDiscount: 0.17,
  },
  enterprise: {
    perChild: 3.50,
    minimum: 99,
    annualDiscount: 0.17,
  },
}

/**
 * Calculate monthly price for a plan based on child count
 * Formula: max(childCount * perChildRate, minimumMonthly)
 */
export function calculateMonthlyPrice(
  plan: 'starter' | 'professional' | 'enterprise',
  childCount: number
): number {
  const pricing = PLAN_PRICING[plan]
  const calculated = childCount * pricing.perChild
  return Math.max(calculated, pricing.minimum)
}

/**
 * Calculate annual price (with discount)
 */
export function calculateAnnualPrice(
  plan: 'starter' | 'professional' | 'enterprise',
  childCount: number
): { annual: number; monthlyEquivalent: number; savings: number } {
  const monthly = calculateMonthlyPrice(plan, childCount)
  const fullYear = monthly * 12
  const annual = Math.round(fullYear * (1 - PLAN_PRICING[plan].annualDiscount))
  const monthlyEquivalent = Math.round((annual / 12) * 100) / 100

  return {
    annual,
    monthlyEquivalent,
    savings: fullYear - annual,
  }
}

// ==========================================
// PLAN FEATURES & FEATURE GATING
// ==========================================

/** Features available per plan tier */
export const PLAN_FEATURES = {
  starter: [
    'children',
    'families',
    'staff',
    'classrooms',
    'attendance',
    'billing',
    'daily_activities',
    'notifications',
    'settings',
    'ai_support',
  ],
  professional: [
    // All starter features
    'children',
    'families',
    'staff',
    'classrooms',
    'attendance',
    'billing',
    'daily_activities',
    'notifications',
    'settings',
    'ai_support',
    // Professional additions
    'communication',
    'reports',
    'incidents',
    'immunizations',
    'documents',
    'food_program',
    'learning',
    'dcf_ratios',
    'programs',
    'admissions',
  ],
  enterprise: [
    // All professional features
    'children',
    'families',
    'staff',
    'classrooms',
    'attendance',
    'billing',
    'daily_activities',
    'notifications',
    'settings',
    'ai_support',
    'communication',
    'reports',
    'incidents',
    'immunizations',
    'documents',
    'food_program',
    'learning',
    'dcf_ratios',
    'programs',
    'admissions',
    // Enterprise additions
    'accounting',
    'multi_location',
    'api_access',
    'custom_branding',
    'compliance',
  ],
} as const

/** Map sidebar nav keys to feature keys for gating */
export const NAV_FEATURE_MAP: Record<string, string> = {
  dashboard: 'children',         // Always accessible
  children: 'children',
  families: 'families',
  staff: 'staff',
  classrooms: 'classrooms',
  attendance: 'attendance',
  billing: 'billing',
  dailyActivities: 'daily_activities',
  notifications: 'notifications',
  settings: 'settings',
  // Professional features
  communication: 'communication',
  reports: 'reports',
  incidents: 'incidents',
  immunizations: 'immunizations',
  documents: 'documents',
  foodProgram: 'food_program',
  learning: 'learning',
  programs: 'programs',
  admissions: 'admissions',
  // Enterprise features
  accounting: 'accounting',
}

/** Map dashboard routes to feature keys for middleware protection */
export const ROUTE_FEATURE_MAP: Record<string, string> = {
  '/dashboard/communication': 'communication',
  '/dashboard/reports': 'reports',
  '/dashboard/incidents': 'incidents',
  '/dashboard/immunizations': 'immunizations',
  '/dashboard/documents': 'documents',
  '/dashboard/food-program': 'food_program',
  '/dashboard/learning': 'learning',
  '/dashboard/programs': 'programs',
  '/dashboard/admissions': 'admissions',
  '/dashboard/accounting': 'accounting',
  '/dashboard/compliance': 'compliance',
}

/**
 * Check if a plan has access to a specific feature
 */
export function hasFeatureAccess(
  plan: SubscriptionPlanType | string | null | undefined,
  feature: string
): boolean {
  // Trial gets all professional features
  if (plan === 'trial') {
    return PLAN_FEATURES.professional.includes(feature as never)
  }

  if (!plan || plan === 'cancelled') return false

  const planKey = plan as keyof typeof PLAN_FEATURES
  const features = PLAN_FEATURES[planKey]
  if (!features) return false

  return features.includes(feature as never)
}

/**
 * Get the minimum plan required for a feature
 */
export function getMinimumPlan(feature: string): 'starter' | 'professional' | 'enterprise' | null {
  if (PLAN_FEATURES.starter.includes(feature as never)) return 'starter'
  if (PLAN_FEATURES.professional.includes(feature as never)) return 'professional'
  if (PLAN_FEATURES.enterprise.includes(feature as never)) return 'enterprise'
  return null
}

// ==========================================
// PLAN DISPLAY DATA (for UI)
// ==========================================

export interface PlanDisplayInfo {
  name: string
  description: string
  perChild: string
  minimum: string
  features: string[]
  popular: boolean
  cta: string
}

export const PLAN_DISPLAY: Record<'starter' | 'professional' | 'enterprise', PlanDisplayInfo> = {
  starter: {
    name: 'Starter',
    description: 'Perfect for small home daycares',
    perChild: '$1.50',
    minimum: '$29',
    features: [
      'Check-in/Check-out System',
      'Automated Billing & Invoicing',
      'Daily Activity Reports',
      'AI Support Assistant',
      'Staff & Classroom Management',
      'Notifications Center',
    ],
    popular: false,
    cta: 'Start Free Trial',
  },
  professional: {
    name: 'Professional',
    description: 'For growing childcare centers',
    perChild: '$2.50',
    minimum: '$49',
    features: [
      'Everything in Starter',
      'DCF Ratio Tracking',
      'Parent Communication Portal',
      'Advanced Reports & Analytics',
      'Immunization Tracking',
      'CACFP Food Program',
      'Incident Management',
      'Document Management',
      'Learning Milestones',
      'Admissions & Waitlist',
    ],
    popular: true,
    cta: 'Start Free Trial',
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For multi-location operations',
    perChild: '$3.50',
    minimum: '$99',
    features: [
      'Everything in Professional',
      'Full Accounting Module',
      'Multi-Location Management',
      'DCF Compliance Suite',
      'API Access & Integrations',
      'Custom Branding',
      'Dedicated Onboarding',
      'Priority Support',
    ],
    popular: false,
    cta: 'Start Free Trial',
  },
}

// ==========================================
// TRIAL CONFIGURATION
// ==========================================

export const TRIAL_CONFIG = {
  durationDays: 14,
  planLevel: 'professional' as const, // Trial gets professional features
  maxChildren: 999,
  maxStaff: 999,
}

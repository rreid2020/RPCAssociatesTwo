import { useEffect, useMemo, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { FeatureAccessKey, SubscriptionPlan, SUBSCRIPTION_PLANS } from './types'
import type { WorkspaceEntitlements } from '../../services/billing/types'
import { getWorkspaceEntitlements } from '../../services/billing/billingService'

function forceEnterpriseAccess (): boolean {
  // Temporary rollout mode: everyone gets enterprise access unless explicitly disabled.
  return import.meta.env.VITE_FORCE_ENTERPRISE_ACCESS !== 'false'
}

/**
 * Hook to get the user's current subscription plan
 * Returns 'free' by default if no subscription is set
 */
export function useSubscription(): SubscriptionPlan {
  const { user } = useUser()

  return useMemo(() => {
    if (!user) return 'FREE'

    if (forceEnterpriseAccess()) {
      return 'ENTERPRISE'
    }

    const metadata = user.publicMetadata as Record<string, unknown> | undefined
    const rawPlan = String(metadata?.subscriptionPlan || '').trim().toUpperCase()
    const legacyMap: Record<string, SubscriptionPlan> = {
      FREE: 'FREE',
      BASIC: 'PROFESSIONAL',
      PROFESSIONAL: 'PROFESSIONAL',
      TAX_INTELLIGENCE: 'TAX_INTELLIGENCE',
      ENTERPRISE: 'ENTERPRISE'
    }
    const plan = legacyMap[rawPlan]

    // Validate that the plan exists
    if (plan && plan in SUBSCRIPTION_PLANS) {
      return plan
    }

    // Default to free if no valid plan is set
    return 'FREE'
  }, [user])
}

/**
 * Hook to check if a user has access to a specific feature
 */
export function useFeatureAccess(feature: FeatureAccessKey): boolean {
  const plan = useSubscription()
  const { getToken } = useAuth()
  const [entitlements, setEntitlements] = useState<WorkspaceEntitlements | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const next = await getWorkspaceEntitlements(getToken)
        if (mounted) {
          setEntitlements(next)
        }
      } catch {
        if (mounted) {
          setEntitlements(null)
        }
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [getToken])

  const planConfig = SUBSCRIPTION_PLANS[plan]

  if (entitlements) {
    if (feature === 'workingPapers') {
      return entitlements.canAccessWorkingPapers
    }
    if (feature === 'integrations') {
      return entitlements.canUseQBOIntegration || entitlements.canUseGoogleSheetsIntegration
    }
    if (feature === 'taxgpt' || feature === 'taxgptPremium') {
      return entitlements.canAccessTaxGPT
    }
  }

  return planConfig.features[feature] ?? false
}

/**
 * Hook to get the full subscription plan configuration
 */
export function useSubscriptionPlan() {
  const plan = useSubscription()
  return SUBSCRIPTION_PLANS[plan]
}

import { useMemo } from 'react'
import { useUser } from '@clerk/clerk-react'
import { SubscriptionPlan, SUBSCRIPTION_PLANS } from './types'

/**
 * Hook to get the user's current subscription plan
 * Returns 'free' by default if no subscription is set
 */
export function useSubscription(): SubscriptionPlan {
  const { user } = useUser()

  return useMemo(() => {
    if (!user) return 'free'

    const metadata = user.publicMetadata as Record<string, unknown> | undefined
    const plan = metadata?.subscriptionPlan as SubscriptionPlan | undefined

    // Validate that the plan exists
    if (plan && plan in SUBSCRIPTION_PLANS) {
      return plan
    }

    // Default to free if no valid plan is set
    return 'free'
  }, [user])
}

/**
 * Hook to check if a user has access to a specific feature
 */
export function useFeatureAccess(feature: keyof typeof SUBSCRIPTION_PLANS.free.features): boolean {
  const plan = useSubscription()
  const planConfig = SUBSCRIPTION_PLANS[plan]

  return planConfig.features[feature] ?? false
}

/**
 * Hook to get the full subscription plan configuration
 */
export function useSubscriptionPlan() {
  const plan = useSubscription()
  return SUBSCRIPTION_PLANS[plan]
}

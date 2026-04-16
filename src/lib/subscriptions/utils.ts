import { SubscriptionPlan, SUBSCRIPTION_PLANS } from './types'

/**
 * Get subscription plan from user metadata
 */
export function getSubscriptionPlan(metadata: Record<string, unknown> | undefined): SubscriptionPlan {
  const plan = metadata?.subscriptionPlan as SubscriptionPlan | undefined

  if (plan && plan in SUBSCRIPTION_PLANS) {
    return plan
  }

  return 'free'
}

/**
 * Check if a plan has access to a specific feature
 */
export function hasFeatureAccess(
  plan: SubscriptionPlan,
  feature: keyof typeof SUBSCRIPTION_PLANS.free.features
): boolean {
  const planConfig = SUBSCRIPTION_PLANS[plan]
  return planConfig.features[feature] ?? false
}

/**
 * Format subscription price for display
 */
export function formatSubscriptionPrice(price: number | null): string {
  if (price === null) return 'Free'
  return `$${price.toFixed(2)}/month`
}

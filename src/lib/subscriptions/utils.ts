import { FeatureAccessKey, SubscriptionPlan, SUBSCRIPTION_PLANS } from './types'

function forceEnterpriseAccess (): boolean {
  return import.meta.env.VITE_FORCE_ENTERPRISE_ACCESS !== 'false'
}

/**
 * Get subscription plan from user metadata
 */
export function getSubscriptionPlan(metadata: Record<string, unknown> | undefined): SubscriptionPlan {
  if (forceEnterpriseAccess()) {
    return 'ENTERPRISE'
  }

  const rawPlan = String(metadata?.subscriptionPlan || '').trim().toUpperCase()
  const legacyMap: Record<string, SubscriptionPlan> = {
    FREE: 'FREE',
    BASIC: 'PROFESSIONAL',
    PROFESSIONAL: 'PROFESSIONAL',
    TAX_INTELLIGENCE: 'TAX_INTELLIGENCE',
    ENTERPRISE: 'ENTERPRISE'
  }
  const plan = legacyMap[rawPlan]

  if (plan && plan in SUBSCRIPTION_PLANS) {
    return plan
  }

  return 'FREE'
}

/**
 * Check if a plan has access to a specific feature
 */
export function hasFeatureAccess(
  plan: SubscriptionPlan,
  feature: FeatureAccessKey
): boolean {
  const planConfig = SUBSCRIPTION_PLANS[plan]
  return planConfig.features[feature] ?? false
}

/**
 * Format subscription price for display
 */
export function formatSubscriptionPrice(price: number | null): string {
  if (price === null || price <= 0) return 'Free'
  return `$${price.toFixed(2)}/month`
}

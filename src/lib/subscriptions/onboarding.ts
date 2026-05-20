const SUBSCRIPTION_ONBOARDING_COMPLETE_KEY = 'subscription:onboarding:complete:v1'

export function isSubscriptionOnboardingComplete (): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(SUBSCRIPTION_ONBOARDING_COMPLETE_KEY) === 'true'
}

export function markSubscriptionOnboardingComplete (): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SUBSCRIPTION_ONBOARDING_COMPLETE_KEY, 'true')
}


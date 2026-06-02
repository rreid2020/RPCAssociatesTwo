import { portalFetch } from '../portalApi'

export type OnboardingStatus = {
  required: boolean
  hasAccount: boolean
  hasCompletedProfile: boolean
}

export const ONBOARDING_REQUIRED_PATH = '/portal/subscription?onboarding=1'
export const POST_AUTH_PATH = '/portal/post-auth'
export const ROLLOUT_BYPASS_ENABLED =
  import.meta.env.MODE !== 'test' &&
  import.meta.env.VITE_FORCE_ENTERPRISE_ACCESS !== 'false'

const ONBOARDING_BYPASS_PATHS = new Set([
  '/portal/subscription',
  '/portal/accounting/join',
  POST_AUTH_PATH
])

const defaultStatus: OnboardingStatus = {
  required: true,
  hasAccount: false,
  hasCompletedProfile: false
}

export async function getOnboardingStatus (
  getToken: () => Promise<string | null>
): Promise<OnboardingStatus> {
  try {
    const response = await portalFetch<{ onboarding: Partial<OnboardingStatus> }>(
      '/v1/accounting/onboarding-status',
      getToken
    )
    return {
      required: Boolean(response.onboarding?.required),
      hasAccount: Boolean(response.onboarding?.hasAccount),
      hasCompletedProfile: Boolean(response.onboarding?.hasCompletedProfile)
    }
  } catch {
    return defaultStatus
  }
}

export function resolvePostAuthPath (status: OnboardingStatus): string {
  if (ROLLOUT_BYPASS_ENABLED) return '/portal/dashboard'
  return status.required ? ONBOARDING_REQUIRED_PATH : '/portal/dashboard'
}

export function shouldBypassOnboardingGate (pathname: string): boolean {
  return ONBOARDING_BYPASS_PATHS.has(pathname)
}

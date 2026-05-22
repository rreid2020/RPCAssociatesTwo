import { portalFetch } from '../portalApi'

export type OnboardingStatus = {
  required: boolean
  hasWorkspace: boolean
  hasCompletedProfile: boolean
  primaryWorkspaceId: string | null
  completedWorkspaceId: string | null
}

export const ONBOARDING_REQUIRED_PATH = '/portal/subscription?onboarding=1'
export const POST_AUTH_PATH = '/portal/post-auth'
export const ROLLOUT_BYPASS_ENABLED = import.meta.env.VITE_FORCE_ENTERPRISE_ACCESS !== 'false'

const ONBOARDING_BYPASS_PATHS = new Set([
  '/portal/subscription',
  '/portal/accounting/join',
  POST_AUTH_PATH
])

const defaultStatus: OnboardingStatus = {
  required: true,
  hasWorkspace: false,
  hasCompletedProfile: false,
  primaryWorkspaceId: null,
  completedWorkspaceId: null
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
      hasWorkspace: Boolean(response.onboarding?.hasWorkspace),
      hasCompletedProfile: Boolean(response.onboarding?.hasCompletedProfile),
      primaryWorkspaceId: response.onboarding?.primaryWorkspaceId || null,
      completedWorkspaceId: response.onboarding?.completedWorkspaceId || null
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

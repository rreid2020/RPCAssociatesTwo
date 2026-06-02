import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getOnboardingStatus, resolvePostAuthPath, shouldBypassOnboardingGate } from '../../src/lib/onboarding/state'

const mockedPortalFetch = vi.hoisted(() => vi.fn())

vi.mock('../../src/lib/portalApi', () => ({
  portalFetch: mockedPortalFetch
}))

describe('onboarding state contracts', () => {
  beforeEach(() => {
    mockedPortalFetch.mockReset()
  })

  it('routes incomplete users into onboarding', async () => {
    mockedPortalFetch.mockResolvedValue({
      onboarding: {
        required: true,
        hasAccount: true,
        hasCompletedProfile: false
      }
    })

    const status = await getOnboardingStatus(async () => 'token')
    expect(status.required).toBe(true)
    expect(resolvePostAuthPath(status)).toBe('/portal/subscription?onboarding=1')
  })

  it('routes complete users to dashboard', async () => {
    mockedPortalFetch.mockResolvedValue({
      onboarding: {
        required: false,
        hasAccount: true,
        hasCompletedProfile: true
      }
    })

    const status = await getOnboardingStatus(async () => 'token')
    expect(status.required).toBe(false)
    expect(resolvePostAuthPath(status)).toBe('/portal/dashboard')
  })

  it('fails safely when onboarding status API is unavailable', async () => {
    mockedPortalFetch.mockRejectedValue(new Error('network'))

    const status = await getOnboardingStatus(async () => 'token')
    expect(status.required).toBe(true)
    expect(resolvePostAuthPath(status)).toBe('/portal/subscription?onboarding=1')
  })

  it('keeps explicit bypass paths', () => {
    expect(shouldBypassOnboardingGate('/portal/subscription')).toBe(true)
    expect(shouldBypassOnboardingGate('/portal/accounting/join')).toBe(true)
    expect(shouldBypassOnboardingGate('/portal/dashboard')).toBe(false)
  })
})

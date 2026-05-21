import { describe, expect, it } from 'vitest'
import { buildNavigationSections } from '../../src/platform/navigation/navigationRegistry'

describe('navigation registry', () => {
  it('keeps billing item visible only when permission exists', () => {
    const hidden = buildNavigationSections({
      workspaceType: 'business',
      onboardingComplete: true,
      features: { workingPapers: true, integrations: true },
      permissions: ['workspace.manage']
    })
    const shown = buildNavigationSections({
      workspaceType: 'business',
      onboardingComplete: true,
      features: { workingPapers: true, integrations: true },
      permissions: ['workspace.manage', 'billing.read']
    })

    const hiddenBilling = hidden.flatMap((section) => section.items).find((item) => item.to === '/portal/billing/subscription')
    const shownBilling = shown.flatMap((section) => section.items).find((item) => item.to === '/portal/billing/subscription')

    expect(hiddenBilling).toBeDefined()
    expect(shownBilling).toBeDefined()
  })

  it('hides working papers links when onboarding is incomplete', () => {
    const sections = buildNavigationSections({
      workspaceType: 'firm',
      onboardingComplete: false,
      features: { workingPapers: true, integrations: true },
      permissions: ['engagement.read', 'working_papers.read']
    })
    const links = sections.flatMap((section) => section.items).map((item) => item.to)
    expect(links.some((link) => link.startsWith('/portal/accounting/working-papers'))).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { isValidEngagementLifecycleTransition } from '../../api/server/services/governance/lifecycleContracts.js'
import { financialFixtures } from '../utils/financial-fixtures'

describe('financial governance lifecycle contracts', () => {
  it('allows in_progress to under_review transition', () => {
    expect(isValidEngagementLifecycleTransition('in_progress', 'under_review')).toBe(true)
  })

  it('prevents signed_off from reverting to in_progress', () => {
    expect(isValidEngagementLifecycleTransition('signed_off', 'in_progress')).toBe(false)
  })

  it('keeps deterministic fixture totals', () => {
    const totalCurrent = financialFixtures.simpleTrialBalance.reduce((sum, row) => sum + row.current, 0)
    expect(totalCurrent).toBe(69000)
  })
})


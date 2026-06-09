import { describe, expect, it } from 'vitest'
import {
  buildEngagementSubPath,
  parseEngagementIdFromPathname
} from '../../src/modules/accounting/routing/engagementPaths'

describe('engagement route path helpers', () => {
  it('parses engagement ids from nested engagement URLs', () => {
    expect(
      parseEngagementIdFromPathname('/portal/accounting/working-papers/engagements/abc-123/execution')
    ).toBe('abc-123')
  })

  it('ignores reserved engagement route segments', () => {
    expect(
      parseEngagementIdFromPathname('/portal/accounting/working-papers/engagements/execution')
    ).toBeNull()
  })

  it('builds stable engagement subpaths', () => {
    expect(buildEngagementSubPath('abc-123', 'trial-balance')).toBe(
      '/portal/accounting/working-papers/engagements/abc-123/trial-balance'
    )
  })
})

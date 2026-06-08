import { describe, expect, it } from 'vitest'
import {
  hasUnrestrictedEngagementAccess
} from '../../api/server/services/authz/engagementAccessPolicy.js'

describe('engagement access policy', () => {
  it('grants unrestricted engagement access to owners and admins only', () => {
    expect(hasUnrestrictedEngagementAccess('owner')).toBe(true)
    expect(hasUnrestrictedEngagementAccess('admin')).toBe(true)
    expect(hasUnrestrictedEngagementAccess('manager')).toBe(false)
    expect(hasUnrestrictedEngagementAccess('employee')).toBe(false)
  })
})

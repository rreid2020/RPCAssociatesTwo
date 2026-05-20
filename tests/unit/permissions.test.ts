import { describe, expect, it } from 'vitest'
import { hasScopedPermission, roleHasPermission } from '../../src/lib/permissions'
import { tenantFixtures } from '../fixtures/tenant-fixtures'

describe('permission policy contracts', () => {
  it('grants firm admin workspace management', () => {
    expect(roleHasPermission('firm_admin', 'workspace.manage')).toBe(true)
  })

  it('denies client engagement management', () => {
    expect(roleHasPermission('client', 'engagement.manage')).toBe(false)
  })

  it('requires engagement scope for engagement-level permissions', () => {
    const scope = { ...tenantFixtures.firmWorkspaceScope, engagementId: null }
    expect(hasScopedPermission('manager', 'engagement.manage', scope)).toBe(false)
  })

  it('allows reviewer signoff when scope is present', () => {
    expect(hasScopedPermission('reviewer', 'signoff.perform', tenantFixtures.businessWorkspaceScope)).toBe(true)
  })
})


import { describe, expect, it } from 'vitest'
import {
  hasPermission,
  mapClerkOrganizationRoleToPlatformRole,
  mapWorkspaceRoleToPlatformRole
} from '../../api/server/services/authz/rolePermissions.js'

describe('workspace role mapping contracts', () => {
  it('maps workspace owner/admin to firm_admin platform role', () => {
    expect(mapWorkspaceRoleToPlatformRole('owner')).toBe('firm_admin')
    expect(mapWorkspaceRoleToPlatformRole('admin')).toBe('firm_admin')
  })

  it('maps clerk organization roles to platform roles', () => {
    expect(mapClerkOrganizationRoleToPlatformRole('org:admin')).toBe('firm_admin')
    expect(mapClerkOrganizationRoleToPlatformRole('org:member')).toBe('staff')
  })

  it('retains billing manage for firm admin role', () => {
    expect(hasPermission('firm_admin', 'billing.manage')).toBe(true)
    expect(hasPermission('staff', 'billing.manage')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { roleHasPermission } from '../../src/lib/permissions'
import type { PermissionKey } from '../../src/lib/permissions/types'
import { buildNavigationSections } from '../../src/platform/navigation/navigationRegistry'
import {
  hasPermission,
  listPermissionsForRole,
  mapWorkspaceRoleToPlatformRole
} from '../../api/server/services/authz/rolePermissions.js'

const COMPANY_PROFILE_PATHS = [
  '/portal/accounting/company-profile',
  '/portal/accounting/company-profile/employees',
  '/portal/accounting/company-profile/entities',
  '/portal/accounting/company-profile/roles-and-permissions'
] as const

const COMPANY_PROFILE_ROUTE_PERMISSIONS: PermissionKey[] = [
  'workspace.manage',
  'workspace.invite',
  'rbac.read'
]

function employeePermissionSnapshot () {
  const platformRole = mapWorkspaceRoleToPlatformRole('employee')
  return {
    platformRole,
    permissions: listPermissionsForRole(platformRole)
  }
}

describe('employee company profile access', () => {
  const { platformRole, permissions } = employeePermissionSnapshot()

  it('maps organization employee role to staff without business profile admin permissions', () => {
    expect(platformRole).toBe('staff')
    expect(hasPermission(platformRole, 'workspace.manage')).toBe(false)
    expect(hasPermission(platformRole, 'workspace.invite')).toBe(false)
    expect(hasPermission(platformRole, 'rbac.read')).toBe(false)
    expect(hasPermission(platformRole, 'rbac.manage')).toBe(false)
  })

  it('denies permission guard checks used by business/firm profile routes', () => {
    for (const permission of COMPANY_PROFILE_ROUTE_PERMISSIONS) {
      expect(permissions.includes(permission)).toBe(false)
      expect(roleHasPermission('staff', permission)).toBe(false)
    }
  })

  it('hides all business/firm profile navigation links for employee permissions', () => {
    const sections = buildNavigationSections({
      workspaceType: 'business',
      profileBusinessType: 'corporation',
      workspaceRole: 'employee',
      onboardingComplete: true,
      features: { workingPapers: true, integrations: true },
      permissions
    })

    const links = sections.flatMap((section) => section.items).map((item) => item.to)
    for (const path of COMPANY_PROFILE_PATHS) {
      expect(links).not.toContain(path)
    }
  })

  it('still exposes engagement routes for employee portal access', () => {
    const sections = buildNavigationSections({
      workspaceType: 'business',
      profileBusinessType: 'corporation',
      workspaceRole: 'employee',
      onboardingComplete: true,
      features: { workingPapers: true, integrations: true },
      permissions
    })

    const links = sections.flatMap((section) => section.items).map((item) => item.to)
    expect(links).toContain('/portal/accounting/working-papers/engagements')
    expect(hasPermission(platformRole, 'engagement.read')).toBe(true)
  })
})

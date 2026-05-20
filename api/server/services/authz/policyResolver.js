import { hasPermission } from './rolePermissions.js'
import { assertEngagementScope, assertWorkspaceScope } from './tenantScope.js'

export function assertWorkspacePermission ({ role, permission, scope }) {
  assertWorkspaceScope(scope)
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}

export function assertEngagementPermission ({ role, permission, scope }) {
  assertWorkspaceScope(scope)
  assertEngagementScope(scope)
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}


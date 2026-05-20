import { roleHasPermission } from './policies'
import type { PermissionKey, PlatformRole } from './types'

export interface TenantScope {
  organizationId?: string | null
  workspaceId?: string | null
  engagementId?: string | null
}

export function canAccessWorkspaceScope (role: PlatformRole, scope: TenantScope): boolean {
  if (!scope.workspaceId) return false
  return roleHasPermission(role, 'engagement.read')
}

export function hasScopedPermission (role: PlatformRole, permission: PermissionKey, scope: TenantScope): boolean {
  if (!roleHasPermission(role, permission)) return false
  if (permission.startsWith('workspace.')) return Boolean(scope.workspaceId)
  if (permission.startsWith('engagement.') || permission.startsWith('working_papers.') || permission.startsWith('review_notes.') || permission.startsWith('signoff.')) {
    return Boolean(scope.workspaceId && scope.engagementId)
  }
  return true
}


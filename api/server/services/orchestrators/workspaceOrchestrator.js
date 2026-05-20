import { fetchWorkspaceInvites, fetchWorkspaceMembers } from '../repositories/workspaceRepository.js'
import { hasPermission } from '../authz/rolePermissions.js'

export async function getWorkspaceTeamSnapshot (pool, workspaceContext) {
  const members = await fetchWorkspaceMembers(pool, workspaceContext.id)
  const invites = await fetchWorkspaceInvites(pool, workspaceContext.id)
  return {
    workspace: workspaceContext,
    members,
    invites
  }
}

export function canRoleInviteMembers (role) {
  return hasPermission(role, 'workspace.invite')
}


import { callPortalApi, type TokenProvider } from '../api/client'
import type { AccountingWorkspaceSummary } from '../../types/accounting'

export interface WorkspaceInviteInput {
  email?: string | null
  role: string
}

export async function listWorkspaces (getToken: TokenProvider): Promise<AccountingWorkspaceSummary[]> {
  const data = await callPortalApi<{ workspaces: any[] }>('/v1/accounting/workspaces', getToken)
  return (data.workspaces || []).map((row) => ({
    id: row.id,
    name: row.name,
    workspaceType: row.workspace_type || 'business',
    role: row.role
  }))
}

export async function listWorkspaceMembers (workspaceId: string, getToken: TokenProvider): Promise<any[]> {
  const data = await callPortalApi<{ members: any[] }>(`/v1/accounting/workspaces/${workspaceId}/members`, getToken)
  return data.members || []
}

export async function listWorkspaceInvites (workspaceId: string, getToken: TokenProvider): Promise<any[]> {
  const data = await callPortalApi<{ invites: any[] }>(`/v1/accounting/workspaces/${workspaceId}/invites`, getToken)
  return data.invites || []
}

export async function createWorkspaceInvite (
  workspaceId: string,
  payload: WorkspaceInviteInput,
  getToken: TokenProvider
): Promise<any> {
  const data = await callPortalApi<{ invite: any }>(`/v1/accounting/workspaces/${workspaceId}/invites`, getToken, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return data.invite
}


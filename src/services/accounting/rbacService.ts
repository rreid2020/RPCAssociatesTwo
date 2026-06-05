import { callPortalApi, type TokenProvider } from '../api/client'

export type RbacPermissionEntry = {
  key: string
}

export type RbacSystemRole = {
  role: string
  label: string
  platformRole: string
  permissions: string[]
}

export type RbacCustomRole = {
  role_name: string
  source_role: string
  display_name: string
  is_system: boolean
  permissions: string[]
}

export type RbacMemberAccess = {
  clerk_user_id: string
  role: string
  status: string
  custom_roles: string[]
}

export type OrganizationRbacSnapshot = {
  workspace: {
    id: string
    organization_id: string
    role: string
  }
  catalog: {
    permissions: RbacPermissionEntry[]
    systemRoles: RbacSystemRole[]
  }
  customRoles: RbacCustomRole[]
  members: RbacMemberAccess[]
}

export async function fetchOrganizationRbac (getToken: TokenProvider) {
  return callPortalApi<OrganizationRbacSnapshot>('/v1/accounting/organization/rbac', getToken)
}

export async function upsertOrganizationCustomRole (
  getToken: TokenProvider,
  roleName: string,
  payload: {
    sourceRole: string
    displayName: string
    permissions: string[]
  }
) {
  return callPortalApi<{ role: Record<string, unknown> }>(
    `/v1/accounting/organization/rbac/roles/${encodeURIComponent(roleName)}`,
    getToken,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    }
  )
}

export async function deleteOrganizationCustomRole (getToken: TokenProvider, roleName: string) {
  return callPortalApi<{ role: Record<string, unknown> }>(
    `/v1/accounting/organization/rbac/roles/${encodeURIComponent(roleName)}`,
    getToken,
    { method: 'DELETE' }
  )
}

export async function updateOrganizationMemberRbac (
  getToken: TokenProvider,
  memberUserId: string,
  payload: {
    role?: string
    customRoles?: string[]
  }
) {
  return callPortalApi<{ member: RbacMemberAccess }>(
    `/v1/accounting/organization/rbac/members/${encodeURIComponent(memberUserId)}`,
    getToken,
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }
  )
}

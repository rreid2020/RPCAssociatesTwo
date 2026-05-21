import { useWorkspaceAuthorization } from './WorkspaceAuthorizationProvider'

export function usePermission (permission: string): boolean {
  const { permissions } = useWorkspaceAuthorization()
  return permissions.includes(permission)
}

import { useAccountAuthorization } from './AccountAuthorizationProvider'

export function usePermission (permission: string): boolean {
  const { permissions } = useAccountAuthorization()
  return permissions.includes(permission)
}

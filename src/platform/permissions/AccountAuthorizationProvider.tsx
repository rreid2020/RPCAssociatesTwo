import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { portalFetch } from '../../lib/portalApi'
import { useAccountContext } from '../account/AccountContextProvider'
import { ROLE_PERMISSIONS } from '../../lib/permissions/policies'
import type { PermissionKey, PlatformRole } from '../../lib/permissions/types'

type AccountAuthorizationState = {
  workspaceRole: string | null
  platformRole: string | null
  customRoles: string[]
  permissions: string[]
  loading: boolean
  refresh: () => Promise<void>
}

const AccountAuthorizationContext = createContext<AccountAuthorizationState | null>(null)

function mapWorkspaceRoleToPlatformRole (workspaceRole: string | null | undefined): PlatformRole {
  const normalized = String(workspaceRole || '').trim().toLowerCase()
  if (normalized === 'owner' || normalized === 'admin') return 'firm_admin'
  if (normalized === 'manager') return 'manager'
  if (normalized === 'employee' || normalized === 'preparer' || normalized === 'reviewer') return 'staff'
  if (normalized === 'client' || normalized === 'read_only') return 'external_read_only'
  return 'staff'
}

function fallbackAuthorizationFromAccountRole (workspaceRole: string | null | undefined) {
  const platformRole = mapWorkspaceRoleToPlatformRole(workspaceRole)
  return {
    workspaceRole: workspaceRole || null,
    platformRole,
    customRoles: [] as string[],
    permissions: [...ROLE_PERMISSIONS[platformRole]] as PermissionKey[]
  }
}

export const AccountAuthorizationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { account } = useAccountContext()
  const [workspaceRole, setWorkspaceRole] = useState<string | null>(null)
  const [platformRole, setPlatformRole] = useState<string | null>(null)
  const [customRoles, setCustomRoles] = useState<string[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setWorkspaceRole(null)
      setPlatformRole(null)
      setCustomRoles([])
      setPermissions([])
      return
    }
    setLoading(true)
    try {
      const data = await portalFetch<{
        workspace: { role: string }
        authorization: { platformRole: string; customRoles: string[]; permissions: string[] }
      }>('/v1/accounting/permissions', getToken)
      setWorkspaceRole(data.workspace?.role || null)
      setPlatformRole(data.authorization?.platformRole || null)
      setCustomRoles(data.authorization?.customRoles || [])
      setPermissions(data.authorization?.permissions || [])
    } catch {
      const fallback = fallbackAuthorizationFromAccountRole(account?.role)
      if (fallback.permissions.length > 0) {
        setWorkspaceRole(fallback.workspaceRole)
        setPlatformRole(fallback.platformRole)
        setCustomRoles(fallback.customRoles)
        setPermissions(fallback.permissions)
      } else {
        setWorkspaceRole(null)
        setPlatformRole(null)
        setCustomRoles([])
        setPermissions([])
      }
    } finally {
      setLoading(false)
    }
  }, [account?.role, getToken, isLoaded, isSignedIn])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!isSignedIn || permissions.length > 0) return
    const fallback = fallbackAuthorizationFromAccountRole(account?.role)
    if (fallback.permissions.length === 0) return
    setWorkspaceRole(fallback.workspaceRole)
    setPlatformRole(fallback.platformRole)
    setCustomRoles(fallback.customRoles)
    setPermissions(fallback.permissions)
  }, [account?.role, isSignedIn, permissions.length])

  const value = useMemo(() => ({
    workspaceRole,
    platformRole,
    customRoles,
    permissions,
    loading,
    refresh
  }), [customRoles, loading, permissions, platformRole, refresh, workspaceRole])

  return (
    <AccountAuthorizationContext.Provider value={value}>
      {children}
    </AccountAuthorizationContext.Provider>
  )
}

export function useAccountAuthorization () {
  const context = useContext(AccountAuthorizationContext)
  if (!context) {
    throw new Error('useAccountAuthorization must be used within AccountAuthorizationProvider')
  }
  return context
}

/** @deprecated Use useAccountAuthorization */
export const useWorkspaceAuthorization = useAccountAuthorization

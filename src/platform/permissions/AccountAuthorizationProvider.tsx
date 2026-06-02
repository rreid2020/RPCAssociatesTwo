import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { portalFetch } from '../../lib/portalApi'

type AccountAuthorizationState = {
  workspaceRole: string | null
  platformRole: string | null
  customRoles: string[]
  permissions: string[]
  loading: boolean
  refresh: () => Promise<void>
}

const AccountAuthorizationContext = createContext<AccountAuthorizationState | null>(null)

export const AccountAuthorizationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
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
      setWorkspaceRole(null)
      setPlatformRole(null)
      setCustomRoles([])
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [getToken, isLoaded, isSignedIn])

  useEffect(() => {
    void refresh()
  }, [refresh])

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

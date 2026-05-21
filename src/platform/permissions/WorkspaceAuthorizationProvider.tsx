import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { portalFetch } from '../../lib/portalApi'
import { useWorkspaceState } from '../workspace/useWorkspaceState'

type WorkspaceAuthorizationState = {
  workspaceId: string | null
  workspaceRole: string | null
  platformRole: string | null
  customRoles: string[]
  permissions: string[]
  loading: boolean
  refresh: () => Promise<void>
}

const WorkspaceAuthorizationContext = createContext<WorkspaceAuthorizationState | null>(null)

export const WorkspaceAuthorizationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { getToken } = useAuth()
  const { workspaceId } = useWorkspaceState()
  const [workspaceRole, setWorkspaceRole] = useState<string | null>(null)
  const [platformRole, setPlatformRole] = useState<string | null>(null)
  const [customRoles, setCustomRoles] = useState<string[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!workspaceId) {
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
      }>(`/v1/accounting/workspaces/${workspaceId}/permissions`, getToken)
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
  }, [getToken, workspaceId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(() => ({
    workspaceId,
    workspaceRole,
    platformRole,
    customRoles,
    permissions,
    loading,
    refresh
  }), [customRoles, loading, permissions, platformRole, refresh, workspaceId, workspaceRole])

  return (
    <WorkspaceAuthorizationContext.Provider value={value}>
      {children}
    </WorkspaceAuthorizationContext.Provider>
  )
}

export function useWorkspaceAuthorization () {
  const context = useContext(WorkspaceAuthorizationContext)
  if (!context) {
    throw new Error('useWorkspaceAuthorization must be used within WorkspaceAuthorizationProvider')
  }
  return context
}

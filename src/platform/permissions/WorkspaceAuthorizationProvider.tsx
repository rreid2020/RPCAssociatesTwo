import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { workspaceId, setWorkspaceId } = useWorkspaceState()
  const [workspaceRole, setWorkspaceRole] = useState<string | null>(null)
  const [platformRole, setPlatformRole] = useState<string | null>(null)
  const [customRoles, setCustomRoles] = useState<string[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const lastWorkspaceValidationAtRef = useRef<number>(0)

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

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    const now = Date.now()
    if (now - lastWorkspaceValidationAtRef.current < 15000) return
    lastWorkspaceValidationAtRef.current = now
    let mounted = true
    const validateWorkspaceSelection = async () => {
      try {
        const data = await portalFetch<{ workspaces: Array<{ id: string }> }>('/v1/accounting/workspaces', getToken)
        if (!mounted) return
        const workspaceIds = (data.workspaces || []).map((workspace) => String(workspace.id))
        if (workspaceIds.length === 0) {
          if (workspaceId) setWorkspaceId(null)
          return
        }
        if (!workspaceId || !workspaceIds.includes(workspaceId)) {
          setWorkspaceId(workspaceIds[0])
        }
      } catch {
        // Keep current selection when workspace list cannot be loaded.
      }
    }
    void validateWorkspaceSelection()
    return () => {
      mounted = false
    }
  }, [getToken, isLoaded, isSignedIn, setWorkspaceId, workspaceId])

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

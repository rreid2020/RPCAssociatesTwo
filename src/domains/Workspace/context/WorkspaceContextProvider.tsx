import { createContext, FC, ReactNode, useContext, useMemo, useState } from 'react'
import { ACCOUNTING_WORKSPACE_STORAGE_KEY } from '../../../lib/portalApi'

type WorkspaceContextValue = {
  workspaceId: string | null
  setWorkspaceId: (workspaceId: string | null) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function readInitialWorkspaceId (): string | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(ACCOUNTING_WORKSPACE_STORAGE_KEY)
  return value && value.trim() ? value.trim() : null
}

export const WorkspaceContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(() => readInitialWorkspaceId())

  const setWorkspaceId = (nextWorkspaceId: string | null) => {
    setWorkspaceIdState(nextWorkspaceId)
    if (typeof window === 'undefined') return
    if (!nextWorkspaceId) {
      window.localStorage.removeItem(ACCOUNTING_WORKSPACE_STORAGE_KEY)
      return
    }
    window.localStorage.setItem(ACCOUNTING_WORKSPACE_STORAGE_KEY, nextWorkspaceId)
  }

  const value = useMemo(() => ({ workspaceId, setWorkspaceId }), [workspaceId])
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspaceContext (): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspaceContext must be used within WorkspaceContextProvider')
  return context
}

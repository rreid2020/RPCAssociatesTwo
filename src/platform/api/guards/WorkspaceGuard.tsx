import { FC, ReactNode, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useWorkspaceState } from '../../workspace/useWorkspaceState'
import { useWorkspaceAuthorization } from '../../permissions/WorkspaceAuthorizationProvider'
import { ROLLOUT_BYPASS_ENABLED } from '../../../lib/onboarding/state'

type WorkspaceGuardProps = {
  children: ReactNode
}

const BYPASS_PATHS = new Set([
  '/portal/subscription',
  '/portal/post-auth',
  '/portal/accounting/join'
])

const WorkspaceGuard: FC<WorkspaceGuardProps> = ({ children }) => {
  const { workspaceId } = useWorkspaceState()
  const { loading } = useWorkspaceAuthorization()
  const location = useLocation()
  const bypass = useMemo(() => BYPASS_PATHS.has(location.pathname), [location.pathname])

  if (bypass) return <>{children}</>

  if (ROLLOUT_BYPASS_ENABLED) {
    if (!workspaceId && loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-sm text-text-light">Loading portal…</p>
        </div>
      )
    }
    return <>{children}</>
  }

  if (!workspaceId) {
    return <Navigate to="/portal/subscription?onboarding=1" replace />
  }

  return <>{children}</>
}

export default WorkspaceGuard

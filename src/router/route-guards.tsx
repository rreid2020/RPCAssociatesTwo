import { FC, ReactNode, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import { portalFetch } from '../lib/portalApi'

interface ProtectedRouteProps {
  children: ReactNode
}

const onboardingBypassPaths = new Set([
  '/portal/subscription',
  '/portal/accounting/join'
])

const OnboardingGate: FC<ProtectedRouteProps> = ({ children }) => {
  const { getToken } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  const shouldBypass = useMemo(() => onboardingBypassPaths.has(location.pathname), [location.pathname])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (shouldBypass) {
        if (mounted) setChecking(false)
        return
      }
      try {
        const data = await portalFetch<{ workspaces: any[] }>('/v1/accounting/workspaces', getToken)
        const rows = data.workspaces || []
        const hasWorkspace = rows.length > 0
        const hasCompletedProfile = rows.some((workspace) => Boolean(workspace.profile_onboarding_completed_at))
        if (!hasWorkspace || !hasCompletedProfile) {
          navigate('/portal/subscription?onboarding=1', { replace: true })
          return
        }
      } catch {
        // Don't block protected routes if onboarding check fails.
      } finally {
        if (mounted) setChecking(false)
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [getToken, navigate, shouldBypass])

  if (checking) {
    return <p className="p-4 text-sm text-text-light">Loading...</p>
  }
  return <>{children}</>
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => (
  <>
    <SignedOut>
      <Navigate to="/portal/sign-in" replace />
    </SignedOut>
    <SignedIn>
      <OnboardingGate>{children}</OnboardingGate>
    </SignedIn>
  </>
)


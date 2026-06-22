import { FC, ReactNode, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import PageLoadingSkeleton from '../../../shared/loading/PageLoadingSkeleton'
import {
  getOnboardingStatus,
  ONBOARDING_REQUIRED_PATH,
  ROLLOUT_BYPASS_ENABLED,
  shouldBypassOnboardingGate
} from '../../../lib/onboarding/state'

type Props = {
  children: ReactNode
}

const OnboardingGuard: FC<Props> = ({ children }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  const shouldBypass = useMemo(() => shouldBypassOnboardingGate(location.pathname), [location.pathname])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setChecking(false)
      return
    }

    let mounted = true
    setChecking(true)

    const run = async () => {
      if (shouldBypass || ROLLOUT_BYPASS_ENABLED) {
        if (mounted) setChecking(false)
        return
      }
      try {
        const status = await getOnboardingStatus(getToken)
        if (!mounted) return
        if (status.required) {
          navigate(ONBOARDING_REQUIRED_PATH, { replace: true })
          return
        }
      } catch {
        if (!mounted) return
        navigate(ONBOARDING_REQUIRED_PATH, { replace: true })
        return
      } finally {
        if (mounted) setChecking(false)
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [getToken, isLoaded, isSignedIn, location.pathname, navigate, shouldBypass])

  if (!isLoaded || !isSignedIn) {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-md">
          <PageLoadingSkeleton variant="default" />
        </div>
      </div>
    )
  }
  return <>{children}</>
}

export default OnboardingGuard

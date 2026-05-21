import { FC, ReactNode, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { getOnboardingStatus, ONBOARDING_REQUIRED_PATH, shouldBypassOnboardingGate } from '../../../lib/onboarding/state'

type Props = {
  children: ReactNode
}

const OnboardingGuard: FC<Props> = ({ children }) => {
  const { getToken } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  const shouldBypass = useMemo(() => shouldBypassOnboardingGate(location.pathname), [location.pathname])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (shouldBypass) {
        if (mounted) setChecking(false)
        return
      }
      try {
        const status = await getOnboardingStatus(getToken)
        if (status.required) {
          navigate(ONBOARDING_REQUIRED_PATH, { replace: true })
          return
        }
      } catch {
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
  }, [getToken, navigate, shouldBypass])

  if (checking) {
    return <p className="p-4 text-sm text-text-light">Loading...</p>
  }
  return <>{children}</>
}

export default OnboardingGuard

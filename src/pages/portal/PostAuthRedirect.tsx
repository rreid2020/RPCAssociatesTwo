import { FC, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { getOnboardingStatus, resolvePostAuthPath } from '../../lib/onboarding/state'
import { portalFetch } from '../../lib/portalApi'

const PostAuthRedirect: FC = () => {
  const navigate = useNavigate()
  const { isLoaded, isSignedIn, getToken } = useAuth()

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    let mounted = true
    const run = async () => {
      // Auto-apply pending workspace invites created through Clerk email invitations.
      try {
        await portalFetch('/v1/accounting/invites/accept-pending', getToken, { method: 'POST' })
      } catch {}
      const status = await getOnboardingStatus(getToken)
      if (!mounted) return
      navigate(resolvePostAuthPath(status), { replace: true })
    }
    void run()
    return () => {
      mounted = false
    }
  }, [getToken, isLoaded, isSignedIn, navigate])

  if (!isLoaded) {
    return <p className="p-4 text-sm text-text-light">Loading...</p>
  }

  if (!isSignedIn) {
    return <Navigate to="/portal/sign-in" replace />
  }

  return <p className="p-4 text-sm text-text-light">Finalizing sign-in...</p>
}

export default PostAuthRedirect

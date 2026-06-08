import { FC, useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { getOnboardingStatus, resolvePostAuthPath } from '../../lib/onboarding/state'
import { portalFetch } from '../../lib/portalApi'

const PostAuthRedirect: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { isLoaded: isUserLoaded, user } = useUser()
  const params = new URLSearchParams(location.search)
  const nextParam = params.get('next')
  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : null
  const modeParam = params.get('mode')

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isUserLoaded) return
    let mounted = true
    const run = async () => {
      if (user?.publicMetadata?.must_change_password === true && location.pathname !== '/portal/change-password') {
        navigate('/portal/change-password', { replace: true })
        return
      }
      // Auto-apply pending workspace invites created through Clerk email invitations.
      try {
        await portalFetch('/v1/accounting/invites/accept-pending', getToken, { method: 'POST' })
      } catch {}
      if (nextPath) {
        if (!mounted) return
        navigate(nextPath, { replace: true })
        return
      }
      const status = await getOnboardingStatus(getToken)
      if (!mounted) return
      navigate(resolvePostAuthPath(status), { replace: true })
    }
    void run()
    return () => {
      mounted = false
    }
  }, [getToken, isLoaded, isSignedIn, isUserLoaded, location.pathname, navigate, nextPath, user?.publicMetadata?.must_change_password])

  if (!isLoaded) {
    return <p className="p-4 text-sm text-text-light">Loading...</p>
  }

  if (!isSignedIn) {
    const params = new URLSearchParams(location.search)
    const inviteTicket = params.get('__clerk_ticket') || params.get('ticket')
    if (inviteTicket) {
      return <Navigate to={`/portal/sign-up${location.search || ''}`} replace />
    }
    if (modeParam === 'create') {
      return <Navigate to={`/portal/sign-up${location.search || ''}`} replace />
    }
    if (nextPath) {
      return <Navigate to={`/portal/sign-in?next=${encodeURIComponent(nextPath)}`} replace />
    }
    return <Navigate to="/portal/sign-in" replace />
  }

  return <p className="p-4 text-sm text-text-light">Finalizing sign-in...</p>
}

export default PostAuthRedirect

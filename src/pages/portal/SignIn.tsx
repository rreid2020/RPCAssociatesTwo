import { FC, useEffect, useState } from 'react'
import { useSignIn, useClerk, useAuth } from '@clerk/clerk-react'
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom'
import SEO from '../../components/SEO'
import AxiomWordmark from '../../components/AxiomWordmark'

const SignIn: FC = () => {
  const { signIn, isLoaded } = useSignIn()
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth()
  const { setActive } = useClerk()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [awaitingEmailCode, setAwaitingEmailCode] = useState(false)
  const modeParam = searchParams.get('mode')
  const nextParam = searchParams.get('next')
  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : null
  const postAuthPath = nextPath
    ? `/portal/post-auth?next=${encodeURIComponent(nextPath)}`
    : '/portal/post-auth'

  useEffect(() => {
    if (modeParam === 'create') {
      navigate(`/portal/sign-up${location.search || ''}`, { replace: true })
      return
    }
    const inviteTicket = searchParams.get('__clerk_ticket') || searchParams.get('ticket')
    if (inviteTicket) {
      navigate(`/portal/sign-up${location.search || ''}`, { replace: true })
      return
    }
    if (isAuthLoaded && isSignedIn) {
      navigate(postAuthPath)
    }
  }, [isAuthLoaded, isSignedIn, location.search, modeParam, navigate, postAuthPath, searchParams])

  const goPostAuth = () => {
    navigate(postAuthPath)
  }

  const handleOAuthSignIn = async (strategy: 'oauth_github') => {
    if (!isLoaded) {
      setError('Authentication system is not ready. Please try again.')
      return
    }

    const origin = window.location.origin
    const ssoCallback = `${origin}/sso-callback`
    const afterAuth = `${origin}${postAuthPath}`

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        // Must match a route that mounts <AuthenticateWithRedirectCallback /> (App.tsx)
        redirectUrl: ssoCallback,
        redirectUrlComplete: afterAuth,
      })
    } catch (err: unknown) {
      const e = err as { errors?: { message: string }[] }
      console.error('OAuth sign in error:', err)
      setError(e.errors?.[0]?.message || 'Failed to sign in. Please try again.')
    }
  }

  const handleEmailCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return
    setError('')
    setIsLoading(true)
    try {
      const res = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code
      })
      if (res.status === 'complete' && res.createdSessionId) {
        await setActive({ session: res.createdSessionId })
        goPostAuth()
        return
      }
      setError('Verification incomplete. Please try again.')
    } catch (err: unknown) {
      const e = err as { errors?: { message: string }[] }
      setError(e.errors?.[0]?.message || 'Invalid code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all required fields')
      return
    }

    if (!isLoaded) {
      setError('Authentication system is not ready. Please try again.')
      return
    }

    setIsLoading(true)
    setAwaitingEmailCode(false)

    try {
      const result = await signIn.create({
        identifier: email,
        password
      })

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        goPostAuth()
        return
      }

      if (result.status === 'needs_second_factor' && result.supportedSecondFactors) {
        const emailCodeFactor = result.supportedSecondFactors.find(
          (f) => f.strategy === 'email_code' && 'emailAddressId' in f
        ) as { strategy: string; emailAddressId: string } | undefined
        if (emailCodeFactor) {
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId
          })
          setAwaitingEmailCode(true)
          return
        }
        setError('This account requires an extra sign-in step we do not support here yet. Try social sign-in or contact support.')
        return
      }

      setError('Sign in is not complete. Please try again or use a social provider.')
    } catch (err: unknown) {
      const e = err as { errors?: { message: string; code?: string }[] }
      setError(e.errors?.[0]?.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SEO
        title="Sign In | Client Portal"
        description="Sign in to access the Axiom Client Portal"
        canonical="/portal/sign-in"
      />
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <AxiomWordmark size="lg" centered blendOnBackground className="mb-4" />
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Sign In</h1>
            <p className="text-text-light">Access your client portal</p>
          </div>

          <div className="bg-white p-8 rounded-lg border border-border shadow-sm">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            {awaitingEmailCode ? (
              <form onSubmit={handleEmailCode} className="space-y-4">
                <p className="text-sm text-text">
                  A verification code was sent to your email. Enter it below to finish signing in
                  (this can appear when you sign in from a new device).
                </p>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-text mb-1">
                    Verification code
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => { setCode(e.target.value) }}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="w-full btn btn--primary"
                >
                  {isLoading ? 'Verifying...' : 'Verify and continue'}
                </button>
                <button
                  type="button"
                  className="w-full text-sm text-text-light hover:text-primary-dark"
                  onClick={() => { setAwaitingEmailCode(false); setCode('') }}
                >
                  Back to email and password
                </button>
              </form>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    onClick={() => { void handleOAuthSignIn('oauth_github') }}
                    disabled={isLoading || !isLoaded}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-md shadow-sm bg-white text-text hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    Continue with GitHub
                  </button>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-text-light">or</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value) }}
                      required
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-text mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value) }}
                      required
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isLoaded}
                    className="w-full btn btn--primary"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-text-light">
                Don&apos;t have an account?{' '}
                <Link
                  to={nextPath ? `/portal/select-plan?next=${encodeURIComponent(nextPath)}` : '/portal/select-plan'}
                  className="text-primary-dark font-medium hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-text-light hover:text-primary-dark">
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default SignIn

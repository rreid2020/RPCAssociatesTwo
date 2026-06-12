import { FC, useEffect, useState } from 'react'
import { useSignUp, useClerk, useAuth } from '@clerk/clerk-react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import SEO from '../../components/SEO'
import AxiomWordmark from '../../components/AxiomWordmark'
import { portalFetch } from '../../lib/portalApi'

const SignUp: FC = () => {
  const { signUp, isLoaded } = useSignUp()
  const { isSignedIn, isLoaded: isAuthLoaded, getToken } = useAuth()
  const { setActive } = useClerk()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const inviteTicket = searchParams.get('__clerk_ticket') || searchParams.get('ticket')
  const inviteFlow = Boolean(inviteTicket)
  const modeParam = searchParams.get('mode')
  const planParam = String(searchParams.get('plan') || '').trim().toUpperCase()
  const selectedPlanId = ['FREE', 'PROFESSIONAL', 'TAX_INTELLIGENCE', 'ENTERPRISE'].includes(planParam) ? planParam : 'FREE'
  const nextParam = searchParams.get('next')
  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : null
  const createMode = modeParam === 'create' && !inviteFlow
  const onboardingTarget = createMode && Boolean(nextPath?.includes('/portal/subscription?onboarding=1'))
  const [workspaceType, setWorkspaceType] = useState<'business' | 'firm' | 'individual'>('business')
  const isIndividualSignup = workspaceType === 'individual'
  const [workspaceName, setWorkspaceName] = useState('')
  const [companyLegalName, setCompanyLegalName] = useState('')
  const [companyOperatingName, setCompanyOperatingName] = useState('')
  const [industry, setIndustry] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [taxIdentifier, setTaxIdentifier] = useState('')
  const postAuthQuery = new URLSearchParams()
  if (nextPath) {
    postAuthQuery.set('next', nextPath)
  }
  if (modeParam === 'create') {
    postAuthQuery.set('mode', 'create')
  }
  const postAuthPath = postAuthQuery.toString()
    ? `/portal/post-auth?${postAuthQuery.toString()}`
    : '/portal/post-auth'

  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      navigate(postAuthPath)
    }
  }, [isAuthLoaded, isSignedIn, navigate, postAuthPath])

  const goPostAuth = () => {
    navigate(postAuthPath)
  }

  const normalizeCode = (value: string) => value.replace(/\D/g, '').slice(0, 6)

  const getClerkErrorMessage = (err: unknown, fallback: string) => {
    const e = err as { errors?: Array<{ code?: string; message?: string }> }
    const first = e?.errors?.[0]
    const code = String(first?.code || '')
    if (code === 'form_code_incorrect') return 'That verification code is incorrect. Check the latest email and try again.'
    if (code === 'verification_expired') return 'That verification code has expired. Click Resend code to get a fresh one.'
    if (code === 'too_many_requests') return 'Too many attempts. Please wait a moment and try again.'
    return first?.message || fallback
  }

  const buildUsernameCandidate = (value: string) => {
    const rawBase = String(value || '')
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 18)
    const base = rawBase.length >= 3 ? rawBase : 'user'
    const suffix = Date.now().toString(36).slice(-5)
    return `${base}_${suffix}`.slice(0, 24)
  }

  const activateSession = async (sessionId: string) => {
    await setActive({ session: sessionId })
    if (onboardingTarget) {
      const created = await createWorkspaceProfileForOnboarding()
      if (!created) {
        setError('Could not finish account setup. Try again from subscription onboarding.')
        return
      }
      if (isIndividualSignup) {
        navigate('/portal/post-auth', { replace: true })
        return
      }
      const target = new URLSearchParams({
        onboarding: '1',
        selectedPlan: selectedPlanId
      })
      target.set('step', 'invites')
      navigate(`/portal/subscription?${target.toString()}`)
      return
    }
    goPostAuth()
  }

  const buildWorkspaceProfilePayload = () => {
    const fullName = `${firstName} ${lastName}`.trim()
    const resolvedWorkspaceName = workspaceName.trim() || fullName || 'My workspace'

    if (isIndividualSignup) {
      return {
        name: resolvedWorkspaceName,
        workspaceType,
        profile: {
          organizationType: 'individual',
          businessType: 'individual',
          companyLegalName: fullName || resolvedWorkspaceName,
          primaryContactName: fullName || undefined,
          primaryContactEmail: email.trim() || undefined,
          onboardingCompleted: true
        }
      }
    }

    return {
      name: resolvedWorkspaceName,
      workspaceType,
      profile: {
        organizationType: workspaceType,
        companyLegalName: companyLegalName.trim(),
        companyOperatingName: companyOperatingName.trim(),
        industry: industry.trim(),
        websiteUrl: websiteUrl.trim(),
        taxIdentifier: taxIdentifier.trim(),
        primaryContactName: fullName || undefined,
        primaryContactEmail: email.trim() || undefined,
        onboardingCompleted: false
      }
    }
  }

  const createWorkspaceProfileForOnboarding = async (): Promise<string | null> => {
    const run = async () => {
      await portalFetch('/v1/accounting/account', getToken, {
        method: 'POST',
        body: JSON.stringify(buildWorkspaceProfilePayload())
      })
      await portalFetch('/v1/billing/subscription/sync', getToken, {
        method: 'POST',
        body: JSON.stringify({
          planId: selectedPlanId,
          status: 'active',
          interval: 'monthly'
        })
      })
      await portalFetch('/v1/billing/entitlements/sync', getToken, {
        method: 'POST',
        body: JSON.stringify({
          planId: selectedPlanId
        })
      })
      return 'created'
    }

    try {
      return await run()
    } catch {
      // Session propagation can lag briefly after setActive.
      await new Promise((resolve) => setTimeout(resolve, 500))
      return await run()
    }
  }

  const recoverIfVerificationAlreadyComplete = async () => {
    if (!signUp) return false
    try {
      await signUp.reload()
      if (signUp.status === 'complete' && signUp.createdSessionId) {
        await setActive({ session: signUp.createdSessionId })
        goPostAuth()
        return true
      }
      if (signUp.status === 'complete') {
        setNotice('Your email is already verified. Please sign in to continue.')
        navigate('/portal/sign-in')
        return true
      }
    } catch {}
    return false
  }

  const handleOAuthSignUp = async (strategy: 'oauth_github') => {
    if (!isLoaded || !signUp) {
      setError('Authentication system is not ready. Please try again.')
      return
    }

    const origin = window.location.origin
    const ssoCallback = `${origin}/sso-callback`
    const afterAuth = `${origin}${postAuthPath}`

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: ssoCallback,
        redirectUrlComplete: afterAuth,
      })
    } catch (err: unknown) {
      const e = err as { errors?: { message: string }[] }
      console.error('OAuth sign up error:', err)
      setError(e.errors?.[0]?.message || 'Failed to sign up. Please try again.')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signUp) return
    const normalizedCode = normalizeCode(code)
    if (normalizedCode.length !== 6) {
      setError('Enter the 6-digit verification code from your email.')
      return
    }
    setError('')
    setNotice('')
    setIsLoading(true)
    try {
      const res = await signUp.attemptEmailAddressVerification({ code: normalizedCode })
      const verifiedSessionId = res.createdSessionId || signUp.createdSessionId
      if (res.status === 'complete' && verifiedSessionId) {
        await activateSession(verifiedSessionId)
        return
      }
      if (res.status === 'complete' && !res.createdSessionId) {
        setNotice('Email verified. Please sign in to continue.')
        navigate('/portal/sign-in')
        return
      }
      const requiredFields = Array.isArray((res as { requiredFields?: string[] }).requiredFields)
        ? (res as { requiredFields?: string[] }).requiredFields || []
        : []
      const suffix = requiredFields.length > 0 ? ` Missing fields: ${requiredFields.join(', ')}` : ''
      setError(`Verification is not complete yet (status: ${res.status}).${suffix}`)
    } catch (err: unknown) {
      console.error('Sign-up verification failed:', err)
      const recovered = await recoverIfVerificationAlreadyComplete()
      if (recovered) return
      setError(getClerkErrorMessage(err, 'Invalid or expired code.'))
    } finally {
      setIsLoading(false)
    }
  }

  const resendCode = async () => {
    if (!isLoaded || !signUp) return
    setError('')
    setNotice('')
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setCode('')
      setNotice('A new verification code has been sent to your email.')
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, 'Could not resend code.'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')

    if (!email || !password || !firstName || !lastName) {
      if (inviteFlow) {
        if (!password || !firstName || !lastName) {
          setError('Please fill in all required fields')
          return
        }
      } else {
        setError('Please fill in all required fields')
        return
      }
    }

    if (createMode) {
      const fullName = `${firstName} ${lastName}`.trim()
      if (isIndividualSignup) {
        if (!workspaceName.trim() && !fullName) {
          setError('Enter your name or a workspace display name.')
          return
        }
      } else if (!workspaceName.trim() || !companyLegalName.trim()) {
        setError('Workspace name and company/firm legal name are required.')
        return
      }
    }

    if (inviteFlow && !inviteTicket) {
      setError('Invitation ticket missing. Please reopen the invite email link.')
      return
    }

    if (!isLoaded || !signUp) {
      setError('Authentication system is not ready. Please try again.')
      return
    }

    setIsLoading(true)

    try {
      const result = inviteFlow
        ? await signUp.create({
            strategy: 'ticket',
            ticket: inviteTicket as string,
            password,
            firstName,
            lastName,
            username: buildUsernameCandidate(email || 'invited')
          })
        : await signUp.create({
            emailAddress: email,
            password,
            firstName,
            lastName,
            username: buildUsernameCandidate(email)
          })

      if (result.status === 'complete' && result.createdSessionId) {
        await activateSession(result.createdSessionId)
        return
      }

      if (!inviteFlow) {
        // Email verification required (Clerk default for new accounts)
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setVerifying(true)
      } else {
        setError(`Invitation signup is not complete yet (status: ${result.status}). Please retry from the invite email.`)
      }
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, 'Failed to create account. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SEO
        title="Sign Up | Client Portal"
        description="Create an account to access the Axiom Client Portal"
        canonical="/portal/sign-up"
      />
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <AxiomWordmark size="lg" centered blendOnBackground className="mb-4" />
            <h1 className="text-3xl font-bold text-primary-dark mb-2">
              {inviteFlow ? 'Accept Workspace Invite' : 'Create Account'}
            </h1>
            <p className="text-text-light">
              {inviteFlow
                ? 'Set your password to join the invited workspace.'
                : 'Get started with the client portal'}
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg border border-border shadow-sm">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700" role="alert">
                {error}
              </div>
            )}
            {notice && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800" role="status">
                {notice}
              </div>
            )}
            {inviteFlow && (
              <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-md text-sm text-accent">
                You are completing an email invitation. Use your real name and choose a password to continue.
              </div>
            )}

            <div
              id="clerk-captcha"
              className="mb-4 flex min-h-0 justify-center"
              data-cl-theme="light"
              data-cl-size="flexible"
            />

            {verifying ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <p className="text-sm text-text">
                  We sent a verification code to <strong>{email}</strong>. Enter it below to finish
                  creating your account.
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
                    onChange={(e) => { setCode(normalizeCode(e.target.value)) }}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !isLoaded || normalizeCode(code).length !== 6}
                  className="w-full btn btn--primary"
                >
                  {isLoading ? 'Verifying...' : 'Verify and continue'}
                </button>
                <button
                  type="button"
                  className="w-full text-sm text-accent font-medium hover:underline"
                  onClick={() => { void resendCode() }}
                >
                  Resend code
                </button>
                <button
                  type="button"
                  className="w-full text-sm text-text-light"
                  onClick={() => { setVerifying(false); setCode('') }}
                >
                  Use a different email
                </button>
              </form>
            ) : (
              <>
                {!inviteFlow && (
                  <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    onClick={() => { void handleOAuthSignUp('oauth_github') }}
                    disabled={isLoading || !isLoaded}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-md shadow-sm bg-white text-text hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    Continue with GitHub
                  </button>
                  </div>
                )}

                {!inviteFlow && (
                  <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-text-light">or</span>
                  </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {createMode && (
                    <>
                      <div>
                        <h2 className="text-base font-semibold text-primary-dark">
                          {isIndividualSignup ? 'Account profile' : 'Company / Firm Profile'}
                        </h2>
                        <p className="text-xs text-text-light mt-1">
                          {isIndividualSignup
                            ? 'Create a personal workspace for individual tax research and filing support.'
                            : 'This profile is created immediately after account setup and before employee invites.'}
                        </p>
                      </div>
                      <div className={isIndividualSignup ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                        <div>
                          <label htmlFor="workspaceType" className="block text-sm font-medium text-text mb-1">
                            Account type
                          </label>
                          <select
                            id="workspaceType"
                            value={workspaceType}
                            onChange={(e) => { setWorkspaceType(e.target.value as 'business' | 'firm' | 'individual') }}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="individual">Individual</option>
                            <option value="business">Business</option>
                            <option value="firm">Accounting firm</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="workspaceName" className="block text-sm font-medium text-text mb-1">
                            {isIndividualSignup ? 'Workspace display name' : 'Workspace name'}
                          </label>
                          <input
                            id="workspaceName"
                            type="text"
                            value={workspaceName}
                            onChange={(e) => { setWorkspaceName(e.target.value) }}
                            placeholder={isIndividualSignup ? 'e.g. My tax workspace' : undefined}
                            required={!isIndividualSignup}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                          {isIndividualSignup && (
                            <p className="mt-1 text-xs text-text-light">
                              Optional. If left blank, your name will be used.
                            </p>
                          )}
                        </div>
                      </div>
                      {!isIndividualSignup && (
                        <>
                          <div>
                            <label htmlFor="companyLegalName" className="block text-sm font-medium text-text mb-1">
                              Company/Firm legal name
                            </label>
                            <input
                              id="companyLegalName"
                              type="text"
                              value={companyLegalName}
                              onChange={(e) => { setCompanyLegalName(e.target.value) }}
                              required
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="companyOperatingName" className="block text-sm font-medium text-text mb-1">
                                Operating name
                              </label>
                              <input
                                id="companyOperatingName"
                                type="text"
                                value={companyOperatingName}
                                onChange={(e) => { setCompanyOperatingName(e.target.value) }}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label htmlFor="industry" className="block text-sm font-medium text-text mb-1">
                                Industry
                              </label>
                              <input
                                id="industry"
                                type="text"
                                value={industry}
                                onChange={(e) => { setIndustry(e.target.value) }}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="websiteUrl" className="block text-sm font-medium text-text mb-1">
                                Website
                              </label>
                              <input
                                id="websiteUrl"
                                type="url"
                                value={websiteUrl}
                                onChange={(e) => { setWebsiteUrl(e.target.value) }}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label htmlFor="taxIdentifier" className="block text-sm font-medium text-text mb-1">
                                Business number / Tax ID
                              </label>
                              <input
                                id="taxIdentifier"
                                type="text"
                                value={taxIdentifier}
                                onChange={(e) => { setTaxIdentifier(e.target.value) }}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-text mb-1">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => { setFirstName(e.target.value) }}
                        required
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-text mb-1">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => { setLastName(e.target.value) }}
                        required
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  {!inviteFlow && (
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
                  )}

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
                      minLength={8}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <p className="mt-1 text-xs text-text-light">Must be at least 8 characters</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isLoaded}
                    className="w-full btn btn--primary"
                  >
                    {isLoading
                      ? (inviteFlow ? 'Completing invite...' : 'Creating account...')
                      : (inviteFlow ? 'Set password and continue' : 'Create Account')}
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-text-light">
                Already have an account?{' '}
                <Link
                  to={`/portal/sign-in?next=${encodeURIComponent(nextPath || '/portal/select-plan')}`}
                  className="text-primary-dark font-medium hover:underline"
                >
                  Sign in
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

export default SignUp

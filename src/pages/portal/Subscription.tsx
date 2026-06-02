import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import { useSubscription, useSubscriptionPlan } from '../../lib/subscriptions/hooks'
import { SUBSCRIPTION_PLANS } from '../../lib/subscriptions/types'
import { formatSubscriptionPrice } from '../../lib/subscriptions/utils'
import { portalFetch } from '../../lib/portalApi'
import { useAccountContext } from '../../platform/account/AccountContextProvider'
import { createAccount } from '../../services/accounting/accountService'

type InviteDraft = {
  email: string
  role: string
}

type InviteSendSummary = {
  sentAt: string
  emails: string[]
} | null

type WorkspaceProfileDraft = {
  companyLegalName: string
  companyOperatingName: string
  industry: string
  websiteUrl: string
  taxIdentifier: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone: string
  addressLine1: string
  addressLine2: string
  city: string
  provinceState: string
  postalCode: string
  countryCode: string
}

const defaultProfileDraft: WorkspaceProfileDraft = {
  companyLegalName: '',
  companyOperatingName: '',
  industry: '',
  websiteUrl: '',
  taxIdentifier: '',
  primaryContactName: '',
  primaryContactEmail: '',
  primaryContactPhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  provinceState: '',
  postalCode: '',
  countryCode: 'CA'
}

const Subscription: FC = () => {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const currentPlan = useSubscription()
  const currentPlanConfig = useSubscriptionPlan()
  const forceEnterpriseAccess = import.meta.env.VITE_FORCE_ENTERPRISE_ACCESS !== 'false'
  const onboardingRequested = searchParams.get('onboarding') === '1'
  const requestedStep = String(searchParams.get('step') || '').toLowerCase()
  const startAtInvites = onboardingRequested && requestedStep === 'invites'
  const selectedPlan = (searchParams.get('selectedPlan') || '').toUpperCase()
  const planStepRequired = onboardingRequested && selectedPlan.length > 0
  const { account, loading: loadingAccount, refreshAccount } = useAccountContext()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [newAccountType, setNewAccountType] = useState<'business' | 'firm'>('business')
  const [newAccountName, setNewAccountName] = useState('')
  const [profileDraft, setProfileDraft] = useState<WorkspaceProfileDraft>(defaultProfileDraft)
  const [inviteDrafts, setInviteDrafts] = useState<InviteDraft[]>([{ email: '', role: 'manager' }])
  const [inviteSendSummary, setInviteSendSummary] = useState<InviteSendSummary>(null)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [planStepConfirmed, setPlanStepConfirmed] = useState(false)
  const accountNameInputRef = useRef<HTMLInputElement | null>(null)
  const companyLegalNameInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (account && !account.isPersonal && account.profileOnboardingCompletedAt) {
      setOnboardingStep(3)
    } else if (account && !account.isPersonal) {
      setOnboardingStep((current) => (current < 2 ? 2 : current))
    }
  }, [account])

  useEffect(() => {
    if (!startAtInvites) return
    setOnboardingStep((current) => (current < 2 ? 2 : current))
  }, [startAtInvites])

  useEffect(() => {
    if (planStepRequired && forceEnterpriseAccess) {
      setPlanStepConfirmed(true)
      return
    }
    if (!planStepRequired) {
      setPlanStepConfirmed(true)
      return
    }
    setPlanStepConfirmed(false)
  }, [forceEnterpriseAccess, planStepRequired])

  const showPlanStep = planStepRequired && !planStepConfirmed
  const showAccountStep = planStepConfirmed && !startAtInvites && onboardingStep <= 1
  const showInviteStep = planStepConfirmed && onboardingStep === 2
  const showCompleteStep = planStepConfirmed && onboardingStep >= 3

  const loadCompanyProfile = useCallback(async () => {
    try {
      const data = await portalFetch<{ profile: any | null }>('/v1/accounting/company-profile', getToken)
      const profile = data.profile
      if (!profile) return
      setProfileDraft({
        companyLegalName: profile.company_legal_name || '',
        companyOperatingName: profile.company_operating_name || '',
        industry: profile.industry || '',
        websiteUrl: profile.website_url || '',
        taxIdentifier: profile.tax_identifier || '',
        primaryContactName: profile.primary_contact_name || '',
        primaryContactEmail: profile.primary_contact_email || '',
        primaryContactPhone: profile.primary_contact_phone || '',
        addressLine1: profile.address_line1 || '',
        addressLine2: profile.address_line2 || '',
        city: profile.city || '',
        provinceState: profile.province_state || '',
        postalCode: profile.postal_code || '',
        countryCode: profile.country_code || 'CA'
      })
      if (profile.onboarding_completed_at) {
        setOnboardingStep(3)
      }
    } catch {
      // Ignore profile load failures during initial setup.
    }
  }, [getToken])

  useEffect(() => {
    if (!account || account.isPersonal) return
    void loadCompanyProfile()
  }, [account, loadCompanyProfile])

  const saveCompanyProfile = async (onboardingCompleted: boolean) => {
    return await portalFetch<{ profile: any }>('/v1/accounting/company-profile', getToken, {
      method: 'PUT',
      body: JSON.stringify({
        organizationType: newAccountType,
        companyLegalName: profileDraft.companyLegalName,
        companyOperatingName: profileDraft.companyOperatingName,
        industry: profileDraft.industry,
        websiteUrl: profileDraft.websiteUrl,
        taxIdentifier: profileDraft.taxIdentifier,
        primaryContactName: profileDraft.primaryContactName,
        primaryContactEmail: profileDraft.primaryContactEmail,
        primaryContactPhone: profileDraft.primaryContactPhone,
        addressLine1: profileDraft.addressLine1,
        addressLine2: profileDraft.addressLine2,
        city: profileDraft.city,
        provinceState: profileDraft.provinceState,
        postalCode: profileDraft.postalCode,
        countryCode: profileDraft.countryCode,
        onboardingCompleted
      })
    })
  }

  const applySelectedPlan = async () => {
    if (!selectedPlan) return
    await portalFetch('/v1/billing/subscription/sync', getToken, {
      method: 'POST',
      body: JSON.stringify({
        planId: selectedPlan,
        status: 'active',
        interval: 'monthly'
      })
    })
    await portalFetch('/v1/billing/entitlements/sync', getToken, {
      method: 'POST',
      body: JSON.stringify({
        planId: selectedPlan
      })
    })
  }

  const onCreateAccount = async () => {
    const resolvedAccountName = String(newAccountName || accountNameInputRef.current?.value || '').trim()
    const resolvedCompanyLegalName = String(profileDraft.companyLegalName || companyLegalNameInputRef.current?.value || '').trim()

    if (!resolvedAccountName) {
      setError('Business or firm name is required.')
      return
    }
    if (!resolvedCompanyLegalName) {
      setError('Company/Firm legal name is required.')
      return
    }
    if (resolvedAccountName !== newAccountName) {
      setNewAccountName(resolvedAccountName)
    }
    if (resolvedCompanyLegalName !== profileDraft.companyLegalName) {
      setProfileDraft((current) => ({ ...current, companyLegalName: resolvedCompanyLegalName }))
    }
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      await createAccount(getToken, {
        name: resolvedAccountName,
        workspaceType: newAccountType,
        profile: {
          organizationType: newAccountType,
          companyLegalName: resolvedCompanyLegalName,
          companyOperatingName: profileDraft.companyOperatingName,
          industry: profileDraft.industry,
          websiteUrl: profileDraft.websiteUrl,
          taxIdentifier: profileDraft.taxIdentifier,
          primaryContactName: profileDraft.primaryContactName,
          primaryContactEmail: profileDraft.primaryContactEmail,
          primaryContactPhone: profileDraft.primaryContactPhone,
          addressLine1: profileDraft.addressLine1,
          addressLine2: profileDraft.addressLine2,
          city: profileDraft.city,
          provinceState: profileDraft.provinceState,
          postalCode: profileDraft.postalCode,
          countryCode: profileDraft.countryCode,
          onboardingCompleted: false
        }
      })
      await applySelectedPlan()
      await refreshAccount()
      setOnboardingStep(2)
      setNotice('Company/firm profile saved. Continue to invite employees.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create account')
    } finally {
      setSaving(false)
    }
  }

  const onSendInviteEmails = async () => {
    if (!account || account.isPersonal) return
    const validInvites = inviteDrafts
      .map((draft) => ({ email: draft.email.trim().toLowerCase(), role: draft.role }))
      .filter((draft) => draft.email.length > 0)

    if (validInvites.length === 0) {
      setError('Add at least one employee email before sending invites.')
      return
    }

    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const sentEmails: string[] = []
      for (const invite of validInvites) {
        await portalFetch<{ invite: any }>(
          '/v1/accounting/organization/invites',
          getToken,
          {
            method: 'POST',
            body: JSON.stringify(invite)
          }
        )
        sentEmails.push(invite.email)
      }
      setOnboardingStep(3)
      setNotice('Clerk invite emails sent. Employees will be added automatically after they create/sign in to their account.')
      setInviteSendSummary({
        sentAt: new Date().toISOString(),
        emails: sentEmails
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send one or more employee invites')
    } finally {
      setSaving(false)
    }
  }

  const onCompleteOnboarding = () => {
    if (!account || account.isPersonal) {
      setError('Create your business or firm profile first.')
      return
    }
    void (async () => {
      setSaving(true)
      setError(null)
      setNotice(null)
      try {
        await saveCompanyProfile(true)
        setOnboardingStep(3)
        await refreshAccount()
        navigate('/portal/accounting/company-profile', { replace: true })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not complete onboarding')
      } finally {
        setSaving(false)
      }
    })()
  }

  return (
    <>
      <SEO
        title="Subscription | Client Portal"
        description="Manage your Axiom Client Portal subscription"
        canonical="/portal/subscription"
      />
      <ClientPortalShell>
        <div>
          <h1 className="text-3xl font-bold text-primary-dark mb-6">Subscription</h1>

          <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-3 mb-6">
            <p className="text-sm text-accent font-medium">
              {forceEnterpriseAccess
                ? 'Temporary Access Mode: Enterprise enabled for all signed-in users during rollout/testing.'
                : 'Subscription entitlements are resolved from your organization account.'}
            </p>
          </div>

          {(onboardingRequested || !account?.profileOnboardingCompletedAt) && (
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm mb-8 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-primary-dark">Company/Firm Onboarding</h2>
                <p className="text-sm text-text-light mt-1">
                  Complete this guided setup to configure your organization and invite employees.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}
              {notice && (
                <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                  {notice}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  {planStepRequired && (
                  <div className={`rounded-lg border px-3 py-2 ${planStepConfirmed ? 'border-accent bg-accent/5' : 'border-border'}`}>
                    Plan + payment
                  </div>
                )}
                <div className={`rounded-lg border px-3 py-2 ${onboardingStep >= 1 ? 'border-accent bg-accent/5' : 'border-border'}`}>
                  Step 1: Company/firm profile
                </div>
                <div className={`rounded-lg border px-3 py-2 ${onboardingStep >= 2 ? 'border-accent bg-accent/5' : 'border-border'}`}>
                  Step 2: Employee invites
                </div>
                <div className={`rounded-lg border px-3 py-2 ${onboardingStep >= 3 ? 'border-accent bg-accent/5' : 'border-border'}`}>
                  Step 3: Complete
                </div>
              </div>

              {loadingAccount ? (
                <p className="text-sm text-text-light">Loading onboarding data...</p>
              ) : (
                <>
                  {showPlanStep && (
                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <h3 className="font-semibold text-primary-dark">Plan and payment</h3>
                      <p className="text-sm text-text-light">
                        Selected plan: <span className="font-medium text-primary-dark">{selectedPlan}</span>
                      </p>
                      {forceEnterpriseAccess ? (
                        <p className="text-sm text-accent">
                          Development mode is enabled. Stripe checkout is bypassed and full access is active for testing.
                        </p>
                      ) : (
                        <p className="text-sm text-text-light">
                          Stripe checkout integration is available and can be connected before final production rollout.
                        </p>
                      )}
                      <button
                        type="button"
                        className="btn btn--primary text-sm py-2 px-4"
                        onClick={() => setPlanStepConfirmed(true)}
                      >
                        Continue to Company/Firm Setup
                      </button>
                    </div>
                  )}

                  {showAccountStep && (
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <h3 className="font-semibold text-primary-dark">Step 1: Set up your company or firm profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="text-sm text-text-light">
                        Organization type
                        <select
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          value={newAccountType}
                          onChange={(e) => setNewAccountType(e.target.value as 'business' | 'firm')}
                        >
                          <option value="business">Business</option>
                          <option value="firm">Accounting firm</option>
                        </select>
                      </label>
                      <label className="text-sm text-text-light">
                        Organization name
                        <input
                          ref={accountNameInputRef}
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          placeholder={newAccountType === 'firm' ? 'Example: NorthPoint CPA Firm' : 'Example: Maple Manufacturing Ltd'}
                          value={newAccountName}
                          onChange={(e) => setNewAccountName(e.target.value)}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Company/Firm legal name
                        <input
                          ref={companyLegalNameInputRef}
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          placeholder="Legal registered name"
                          value={profileDraft.companyLegalName}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, companyLegalName: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Operating name (optional)
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          placeholder="Public or trade name"
                          value={profileDraft.companyOperatingName}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, companyOperatingName: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Industry (optional)
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          placeholder="e.g. Manufacturing, Professional Services"
                          value={profileDraft.industry}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, industry: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Website (optional)
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          placeholder="https://example.com"
                          value={profileDraft.websiteUrl}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, websiteUrl: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Business number / Tax ID (optional)
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          placeholder="BN / EIN / other tax identifier"
                          value={profileDraft.taxIdentifier}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, taxIdentifier: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Primary contact name (optional)
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          value={profileDraft.primaryContactName}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, primaryContactName: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Primary contact email (optional)
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          value={profileDraft.primaryContactEmail}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, primaryContactEmail: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Primary contact phone (optional)
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          value={profileDraft.primaryContactPhone}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, primaryContactPhone: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Address line 1 (optional)
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          value={profileDraft.addressLine1}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, addressLine1: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Address line 2 (optional)
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          value={profileDraft.addressLine2}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, addressLine2: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        City (optional)
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          value={profileDraft.city}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, city: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Province/State (optional)
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          value={profileDraft.provinceState}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, provinceState: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Postal/ZIP code (optional)
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          value={profileDraft.postalCode}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, postalCode: e.target.value }))}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Country code
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          value={profileDraft.countryCode}
                          onChange={(e) => setProfileDraft((current) => ({ ...current, countryCode: e.target.value.toUpperCase() }))}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn btn--primary text-sm py-2 px-4"
                      disabled={saving}
                      onClick={() => { void onCreateAccount() }}
                    >
                      {saving ? 'Saving...' : 'Save profile'}
                    </button>
                  </div>
                  )}

                  {showInviteStep && (
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <h3 className="font-semibold text-primary-dark">Step 2: Invite employees</h3>
                    {account?.name && (
                      <p className="text-sm text-text-light">
                        Organization: <span className="font-medium text-primary-dark">{account.name}</span>
                      </p>
                    )}
                    <div className="space-y-2">
                      {inviteDrafts.map((draft, idx) => (
                        <div key={`invite-${idx}`} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            className="border border-border rounded-md px-3 py-2 text-sm md:col-span-2"
                            placeholder="employee@company.com"
                            value={draft.email}
                            onChange={(e) => {
                              setInviteDrafts((current) =>
                                current.map((row, rowIdx) => (rowIdx === idx ? { ...row, email: e.target.value } : row))
                              )
                            }}
                          />
                          <select
                            className="border border-border rounded-md px-3 py-2 text-sm"
                            value={draft.role}
                            onChange={(e) => {
                              setInviteDrafts((current) =>
                                current.map((row, rowIdx) => (rowIdx === idx ? { ...row, role: e.target.value } : row))
                              )
                            }}
                          >
                            {['admin', 'manager', 'reviewer', 'preparer', 'read_only', 'client'].map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn--secondary text-sm py-2 px-3"
                        onClick={() => setInviteDrafts((current) => [...current, { email: '', role: 'manager' }])}
                      >
                        Add Another Employee
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn--primary text-sm py-2 px-4"
                      disabled={saving || !account || account.isPersonal}
                      onClick={() => { void onSendInviteEmails() }}
                    >
                      {saving ? 'Sending...' : 'Send Invite Emails'}
                    </button>
                    {inviteSendSummary && (
                      <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                        <p className="font-medium">
                          {inviteSendSummary.emails.length} invite{inviteSendSummary.emails.length === 1 ? '' : 's'} sent successfully.
                        </p>
                        <p className="mt-1 break-words">{inviteSendSummary.emails.join(', ')}</p>
                      </div>
                    )}
                    <p className="text-xs text-text-light">
                      Clerk will email each invited employee with a secure account-setup link.
                    </p>
                    {account && (
                      <p className="text-xs text-text-light">
                        Need advanced team management? Use <Link className="underline font-medium" to="/portal/accounting/company-profile/employees">Invite Employees</Link> in Business/Firm Profile.
                      </p>
                    )}
                  </div>
                  )}

                  {showCompleteStep && (
                  <div className="rounded-lg border border-border p-4">
                    <h3 className="font-semibold text-primary-dark mb-2">Step 3: Complete onboarding</h3>
                    <p className="text-sm text-text-light mb-3">
                      Confirm setup and continue to company administration.
                    </p>
                    <button
                      type="button"
                      className="btn btn--primary text-sm py-2 px-4"
                      disabled={!account || account.isPersonal}
                      onClick={onCompleteOnboarding}
                    >
                      Complete Onboarding
                    </button>
                  </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Current Plan */}
          <div className="bg-white p-6 rounded-lg border border-border shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-primary-dark mb-4">Current Plan</h2>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary-dark">{currentPlanConfig.name}</h3>
                <p className="text-text-light">{currentPlanConfig.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-dark">
                  {formatSubscriptionPrice(currentPlanConfig.monthlyPrice)}
                </p>
                {currentPlan === 'FREE' && (
                  <p className="text-sm text-text-light mt-1">Always free for development</p>
                )}
                {currentPlan === 'ENTERPRISE' && (
                  <p className="text-sm text-accent mt-1">Full access currently enabled for rollout/testing</p>
                )}
              </div>
            </div>
          </div>

          {/* Available Plans */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-primary-dark mb-4">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
                const isCurrentPlan = plan.id === currentPlan
                return (
                  <div
                    key={plan.id}
                    className={`bg-white p-6 rounded-lg border shadow-sm ${
                      isCurrentPlan ? 'border-accent border-2' : 'border-border'
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full">
                          Current Plan
                        </span>
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-primary-dark mb-2">{plan.name}</h3>
                    <p className="text-text-light text-sm mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-primary-dark">
                        {formatSubscriptionPrice(plan.monthlyPrice)}
                      </p>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-sm">
                        {plan.features.dashboard ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-text-light">✗</span>
                        )}
                        <span className={plan.features.dashboard ? 'text-text' : 'text-text-light'}>
                          Dashboard
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {plan.features.taxgpt ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-text-light">✗</span>
                        )}
                        <span className={plan.features.taxgpt ? 'text-text' : 'text-text-light'}>
                          TaxGPT
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {plan.features.taxgptPremium ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-text-light">✗</span>
                        )}
                        <span className={plan.features.taxgptPremium ? 'text-text' : 'text-text-light'}>
                          TaxGPT Premium
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {plan.features.fileRepository ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-text-light">✗</span>
                        )}
                        <span className={plan.features.fileRepository ? 'text-text' : 'text-text-light'}>
                          File Repository
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {plan.features.workingPapers ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-text-light">✗</span>
                        )}
                        <span className={plan.features.workingPapers ? 'text-text' : 'text-text-light'}>
                          Working Papers
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        {plan.features.integrations ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-text-light">✗</span>
                        )}
                        <span className={plan.features.integrations ? 'text-text' : 'text-text-light'}>
                          Integrations
                        </span>
                      </li>
                    </ul>
                    {!isCurrentPlan && plan.id !== 'FREE' && (
                      <button
                        disabled
                        className="w-full btn btn--primary opacity-50 cursor-not-allowed"
                        title="Paid plans coming soon"
                      >
                        Coming Soon
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Note about free plan */}
          {currentPlan === 'FREE' && (
            <div className="bg-background p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-primary-dark mb-2">Free Plan Active</h3>
              <p className="text-text-light">
                You are on the free plan: Dashboard and TaxGPT are included. Upgrade to Basic for File Repository, or Professional
                and Enterprise for Working Papers and the integrations request workflow.
              </p>
            </div>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default Subscription

import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import { useSubscription, useSubscriptionPlan } from '../../lib/subscriptions/hooks'
import { SUBSCRIPTION_PLANS } from '../../lib/subscriptions/types'
import { formatSubscriptionPrice } from '../../lib/subscriptions/utils'
import { markSubscriptionOnboardingComplete } from '../../lib/subscriptions/onboarding'
import { portalFetch } from '../../lib/portalApi'

type InviteDraft = {
  email: string
  role: string
}

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
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [newWorkspaceType, setNewWorkspaceType] = useState<'business' | 'firm'>('business')
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [profileDraft, setProfileDraft] = useState<WorkspaceProfileDraft>(defaultProfileDraft)
  const [inviteDrafts, setInviteDrafts] = useState<InviteDraft[]>([{ email: '', role: 'manager' }])
  const [onboardingStep, setOnboardingStep] = useState(1)

  const loadWorkspaces = useCallback(async () => {
    setLoadingWorkspaces(true)
    try {
      const data = await portalFetch<{ workspaces: any[] }>('/v1/accounting/workspaces', getToken)
      const rows = data.workspaces || []
      setWorkspaces(rows)
      if (rows.length > 0) {
        setSelectedWorkspaceId(rows[0].id)
        setOnboardingStep((current) => (current < 2 ? 2 : current))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load workspace onboarding data')
    } finally {
      setLoadingWorkspaces(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadWorkspaces()
  }, [loadWorkspaces])

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || null,
    [workspaces, selectedWorkspaceId]
  )

  const loadWorkspaceProfile = useCallback(async (workspaceId: string) => {
    try {
      const data = await portalFetch<{ profile: any | null }>(`/v1/accounting/workspaces/${workspaceId}/profile`, getToken)
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
    if (!selectedWorkspaceId) return
    void loadWorkspaceProfile(selectedWorkspaceId)
  }, [loadWorkspaceProfile, selectedWorkspaceId])

  const saveWorkspaceProfile = async (workspaceId: string, onboardingCompleted: boolean) => {
    return await portalFetch<{ profile: any }>(`/v1/accounting/workspaces/${workspaceId}/profile`, getToken, {
      method: 'PUT',
      body: JSON.stringify({
        organizationType: newWorkspaceType,
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

  const onCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return
    if (!profileDraft.companyLegalName.trim()) {
      setError('Company/Firm legal name is required.')
      return
    }
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const created = await portalFetch<{ workspace: any }>('/v1/accounting/workspaces', getToken, {
        method: 'POST',
        body: JSON.stringify({
          name: newWorkspaceName.trim(),
          workspaceType: newWorkspaceType
        })
      })
      if (created.workspace?.id) {
        await saveWorkspaceProfile(created.workspace.id, false)
      }
      await loadWorkspaces()
      setSelectedWorkspaceId(created.workspace?.id || '')
      setOnboardingStep(2)
      setNotice('Workspace and company/firm profile saved. Continue to invite employees.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create workspace')
    } finally {
      setSaving(false)
    }
  }

  const onSendInviteEmails = async () => {
    if (!selectedWorkspaceId) return
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
      for (const invite of validInvites) {
        await portalFetch<{ invite: any }>(
          `/v1/accounting/workspaces/${selectedWorkspaceId}/invites`,
          getToken,
          {
            method: 'POST',
            body: JSON.stringify(invite)
          }
        )
      }
      setOnboardingStep(3)
      setNotice('Clerk invite emails sent. Employees will be added automatically after they create/sign in to their account.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send one or more employee invites')
    } finally {
      setSaving(false)
    }
  }

  const onCompleteOnboarding = () => {
    if (!selectedWorkspaceId) {
      setError('Select or create a workspace first.')
      return
    }
    void (async () => {
      setSaving(true)
      setError(null)
      setNotice(null)
      try {
        await saveWorkspaceProfile(selectedWorkspaceId, true)
        setOnboardingStep(3)
        markSubscriptionOnboardingComplete()
        navigate('/portal/accounting/workspaces', { replace: true })
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
                : 'Workspace entitlement mode is active. Access is resolved from workspace subscription state.'}
            </p>
          </div>

          {(onboardingRequested || workspaces.length === 0) && (
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm mb-8 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-primary-dark">Company/Firm Onboarding</h2>
                <p className="text-sm text-text-light mt-1">
                  Complete this guided setup to configure your organization and invite employees into workspaces.
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
                <div className={`rounded-lg border px-3 py-2 ${onboardingStep >= 1 ? 'border-accent bg-accent/5' : 'border-border'}`}>
                  Step 1: Workspace setup
                </div>
                <div className={`rounded-lg border px-3 py-2 ${onboardingStep >= 2 ? 'border-accent bg-accent/5' : 'border-border'}`}>
                  Step 2: Employee invites
                </div>
                <div className={`rounded-lg border px-3 py-2 ${onboardingStep >= 3 ? 'border-accent bg-accent/5' : 'border-border'}`}>
                  Step 3: Complete
                </div>
              </div>

              {loadingWorkspaces ? (
                <p className="text-sm text-text-light">Loading onboarding data...</p>
              ) : (
                <>
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <h3 className="font-semibold text-primary-dark">Step 1: Set up workspace and company/firm profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="text-sm text-text-light">
                        Workspace type
                        <select
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          value={newWorkspaceType}
                          onChange={(e) => setNewWorkspaceType(e.target.value as 'business' | 'firm')}
                        >
                          <option value="business">Business workspace</option>
                          <option value="firm">Accounting firm workspace</option>
                        </select>
                      </label>
                      <label className="text-sm text-text-light">
                        Workspace name
                        <input
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                          placeholder={newWorkspaceType === 'firm' ? 'Example: NorthPoint CPA Firm' : 'Example: Maple Manufacturing Ltd'}
                          value={newWorkspaceName}
                          onChange={(e) => setNewWorkspaceName(e.target.value)}
                        />
                      </label>
                      <label className="text-sm text-text-light">
                        Company/Firm legal name
                        <input
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
                      disabled={saving || !newWorkspaceName.trim() || !profileDraft.companyLegalName.trim()}
                      onClick={() => { void onCreateWorkspace() }}
                    >
                      {saving ? 'Saving...' : 'Create Workspace'}
                    </button>
                  </div>

                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <h3 className="font-semibold text-primary-dark">Step 2: Invite employees to workspace</h3>
                    <label className="text-sm text-text-light block">
                      Active workspace
                      <select
                        className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
                        value={selectedWorkspaceId}
                        onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                        disabled={workspaces.length === 0}
                      >
                        {workspaces.length === 0 && <option value="">Create workspace first</option>}
                        {workspaces.map((workspace) => (
                          <option key={workspace.id} value={workspace.id}>
                            {workspace.name} ({workspace.workspace_type || 'business'})
                          </option>
                        ))}
                      </select>
                    </label>
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
                      disabled={saving || !selectedWorkspaceId}
                      onClick={() => { void onSendInviteEmails() }}
                    >
                      {saving ? 'Sending...' : 'Send Invite Emails'}
                    </button>
                    <p className="text-xs text-text-light">
                      Clerk will email each invited employee with a secure account-setup link.
                    </p>
                    {activeWorkspace && (
                      <p className="text-xs text-text-light">
                        Need advanced team management? Use <Link className="underline font-medium" to="/portal/accounting/workspaces">Workspace Administration</Link>.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h3 className="font-semibold text-primary-dark mb-2">Step 3: Complete onboarding</h3>
                    <p className="text-sm text-text-light mb-3">
                      Confirm setup and continue to workspace administration.
                    </p>
                    <button
                      type="button"
                      className="btn btn--primary text-sm py-2 px-4"
                      disabled={!selectedWorkspaceId}
                      onClick={onCompleteOnboarding}
                    >
                      Complete Onboarding
                    </button>
                  </div>
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

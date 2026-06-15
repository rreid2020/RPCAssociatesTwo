import { FC } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import { useAccountContext } from '../../platform/account/AccountContextProvider'
import { getSubscriptionPlan } from '../../lib/subscriptions/utils'
import { SUBSCRIPTION_PLANS } from '../../lib/subscriptions/types'
import { isDevFreeAccessMode } from '../../lib/subscriptions/planBenefits'

function workspaceTypeLabel (businessType: string | null | undefined): string {
  if (businessType === 'individual') return 'Individual'
  if (businessType === 'firm') return 'Accounting firm'
  if (businessType === 'business') return 'Business'
  return 'Not set'
}

const Profile: FC = () => {
  const { user } = useUser()
  const { account, profile, loading } = useAccountContext()
  const plan = getSubscriptionPlan(user?.publicMetadata as Record<string, unknown> | undefined)
  const planName = SUBSCRIPTION_PLANS[plan].name
  const devFreeAccess = isDevFreeAccessMode()

  const displayName = user?.fullName || user?.emailAddresses?.[0]?.emailAddress || 'User'
  const email = user?.emailAddresses?.[0]?.emailAddress || ''
  const companyLegalName = String(profile?.company_legal_name || profile?.companyLegalName || '').trim()
  const primaryContactPhone = String(profile?.primary_contact_phone || profile?.primaryContactPhone || '').trim()

  return (
    <>
      <SEO
        title="Profile | Client Portal"
        description="View and manage your Axiom Client Portal account profile."
        canonical="/portal/profile"
      />
      <ClientPortalShell>
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">Profile</h1>
          <p className="text-sm text-text-light mb-6">
            Your account identity, workspace details, and portal access.
          </p>

          {devFreeAccess && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Development access is enabled. Full portal features are currently available at no charge while we are in dev.
            </div>
          )}

          <div className="space-y-6">
            <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-primary-dark">Account</h2>
              <div className="mt-4 flex items-center gap-4">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={displayName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-dark text-xl font-semibold text-white">
                    {user?.firstName?.[0] || email[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <p className="text-lg font-medium text-text">{displayName}</p>
                  <p className="text-sm text-text-light">{email}</p>
                </div>
              </div>
              <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-text-light">First name</dt>
                  <dd className="mt-1 font-medium text-text">{user?.firstName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-text-light">Last name</dt>
                  <dd className="mt-1 font-medium text-text">{user?.lastName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-text-light">Workspace role</dt>
                  <dd className="mt-1 font-medium text-text capitalize">{account?.role || '—'}</dd>
                </div>
                <div>
                  <dt className="text-text-light">Plan</dt>
                  <dd className="mt-1 font-medium text-text">
                    {devFreeAccess ? 'Free (full access during development)' : planName}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-primary-dark">Workspace</h2>
              {loading ? (
                <p className="mt-3 text-sm text-text-light">Loading workspace profile...</p>
              ) : (
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-text-light">Workspace name</dt>
                    <dd className="mt-1 font-medium text-text">{account?.name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-text-light">Account type</dt>
                    <dd className="mt-1 font-medium text-text">{workspaceTypeLabel(account?.businessType)}</dd>
                  </div>
                  <div>
                    <dt className="text-text-light">Legal / profile name</dt>
                    <dd className="mt-1 font-medium text-text">{companyLegalName || displayName}</dd>
                  </div>
                  <div>
                    <dt className="text-text-light">Primary phone</dt>
                    <dd className="mt-1 font-medium text-text">{primaryContactPhone || '—'}</dd>
                  </div>
                </dl>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {account?.businessType !== 'individual' && (
                  <Link
                    to="/portal/accounting/company-profile"
                    className="inline-flex items-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-primary-dark hover:bg-background"
                  >
                    Business / firm profile
                  </Link>
                )}
                <Link
                  to="/portal/subscription"
                  className="inline-flex items-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-primary-dark hover:bg-background"
                >
                  Subscription
                </Link>
              </div>
            </section>
          </div>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default Profile

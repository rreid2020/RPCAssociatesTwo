import { FC } from 'react'
import ClientPortalShell from '../../../components/ClientPortalShell'
import SEO from '../../../components/SEO'
import { useWorkspaceBilling } from '../hooks/useWorkspaceBilling'

const BillingSettingsPage: FC = () => {
  const { loading, error, overview } = useWorkspaceBilling()

  return (
    <>
      <SEO title="Billing Settings | Client Portal" description="Workspace billing settings and payment configuration." canonical="/portal/billing/settings" />
      <ClientPortalShell>
        <h1 className="text-3xl font-bold text-primary-dark mb-6">Billing Settings</h1>
        {loading && <p className="text-sm text-text-light">Loading billing settings...</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
        {overview && (
          <div className="rounded-lg border border-border bg-white p-6 shadow-sm space-y-2">
            <p><span className="font-medium">Current plan:</span> {overview.subscription.planId}</p>
            <p><span className="font-medium">Status:</span> {overview.subscription.status}</p>
            <p><span className="font-medium">Interval:</span> {overview.subscription.interval}</p>
            <p className="text-sm text-text-light">Stripe billing portal and payment method management are scaffolded and ready for backend activation.</p>
          </div>
        )}
      </ClientPortalShell>
    </>
  )
}

export default BillingSettingsPage

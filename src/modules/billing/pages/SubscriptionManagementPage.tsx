import { FC } from 'react'
import ClientPortalShell from '../../../components/ClientPortalShell'
import SEO from '../../../components/SEO'
import { useWorkspaceBilling } from '../hooks/useWorkspaceBilling'
import PlanComparisonPanel from '../components/PlanComparisonPanel'
import UpgradePromptCard from '../components/UpgradePromptCard'

const SubscriptionManagementPage: FC = () => {
  const { loading, error, overview } = useWorkspaceBilling()

  return (
    <>
      <SEO title="Subscription Management | Client Portal" description="Upgrade, downgrade, and manage your subscription." canonical="/portal/billing/subscription" />
      <ClientPortalShell>
        <h1 className="text-3xl font-bold text-primary-dark mb-6">Subscription Management</h1>
        {loading && <p className="text-sm text-text-light mb-4">Loading subscription details...</p>}
        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}
        {overview && (
          <div className="rounded-lg border border-border bg-white p-4 shadow-sm mb-6">
            <p className="text-sm text-text-light">Workspace subscription</p>
            <p className="text-xl font-semibold text-primary-dark">{overview.subscription.planId}</p>
            <p className="text-sm text-text-light mt-1">Status: {overview.subscription.status}</p>
          </div>
        )}
        <PlanComparisonPanel />
        <div className="mt-6">
          <UpgradePromptCard
            title="Upgrade to unlock premium features"
            description="Working Papers, advanced integrations, and higher limits are available on paid plans."
          />
        </div>
      </ClientPortalShell>
    </>
  )
}

export default SubscriptionManagementPage

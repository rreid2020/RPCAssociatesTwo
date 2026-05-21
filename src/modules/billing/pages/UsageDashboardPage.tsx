import { FC } from 'react'
import ClientPortalShell from '../../../components/ClientPortalShell'
import SEO from '../../../components/SEO'
import { useWorkspaceBilling } from '../hooks/useWorkspaceBilling'
import UsageSummaryCard from '../components/UsageSummaryCard'

const UsageDashboardPage: FC = () => {
  const { loading, error, overview } = useWorkspaceBilling()

  return (
    <>
      <SEO title="Usage Dashboard | Client Portal" description="Track workspace usage against subscription limits." canonical="/portal/billing/usage" />
      <ClientPortalShell>
        <h1 className="text-3xl font-bold text-primary-dark mb-6">Usage Dashboard</h1>
        {loading && <p className="text-sm text-text-light">Loading usage metrics...</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
        {overview && <UsageSummaryCard usage={overview.usage} entitlements={overview.entitlements} />}
      </ClientPortalShell>
    </>
  )
}

export default UsageDashboardPage

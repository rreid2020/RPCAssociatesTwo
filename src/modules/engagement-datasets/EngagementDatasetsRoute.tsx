import { useAuth } from '@clerk/clerk-react'
import ClientPortalShell from '../../components/ClientPortalShell'
import EngagementDatasetsPage from './pages/EngagementDatasetsPage'

const EngagementDatasetsRoute = () => {
  const { getToken } = useAuth()
  return (
    <ClientPortalShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark">Engagement datasets</h1>
          <p className="text-sm text-text-light mt-2">
            Import ad-hoc spreadsheets, map columns interactively, and build saved analysis views on engagement data.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
          <EngagementDatasetsPage getToken={getToken} />
        </div>
      </div>
    </ClientPortalShell>
  )
}

export default EngagementDatasetsRoute

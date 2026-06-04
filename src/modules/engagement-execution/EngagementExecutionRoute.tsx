import { useAuth } from '@clerk/clerk-react'
import ClientPortalShell from '../../components/ClientPortalShell'
import EngagementExecutionPage from './pages/EngagementExecutionPage'

const EngagementExecutionRoute = () => {
  const { getToken } = useAuth()
  return (
    <ClientPortalShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark">Engagement execution</h1>
          <p className="text-sm text-text-light mt-2">
            Checklists, procedures, and execution phase — separate from legacy review flow status.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
          <EngagementExecutionPage getToken={getToken} />
        </div>
      </div>
    </ClientPortalShell>
  )
}

export default EngagementExecutionRoute

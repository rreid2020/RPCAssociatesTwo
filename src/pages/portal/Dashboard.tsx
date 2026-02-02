import { FC } from 'react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'

const Dashboard: FC = () => {
  return (
    <>
      <SEO
        title="Dashboard | Client Portal"
        description="View your account status, open items, and upcoming milestones in the RPC Associates Client Portal."
        canonical="/portal/dashboard"
      />
      <ClientPortalShell>
        <div>
          <h1 className="text-3xl font-bold text-primary-dark mb-6">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
              <h3 className="text-sm font-medium text-text-light mb-2">Open Items</h3>
              <p className="text-3xl font-bold text-primary-dark">0</p>
              <p className="text-sm text-text-light mt-2">Items requiring your attention</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
              <h3 className="text-sm font-medium text-text-light mb-2">Upcoming Deadlines</h3>
              <p className="text-3xl font-bold text-primary-dark">0</p>
              <p className="text-sm text-text-light mt-2">Important dates ahead</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
              <h3 className="text-sm font-medium text-text-light mb-2">Active Projects</h3>
              <p className="text-3xl font-bold text-primary-dark">0</p>
              <p className="text-sm text-text-light mt-2">Projects in progress</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
            <h2 className="text-xl font-semibold text-primary-dark mb-4">Recent Activity</h2>
            <p className="text-text-light">No recent activity to display.</p>
          </div>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default Dashboard

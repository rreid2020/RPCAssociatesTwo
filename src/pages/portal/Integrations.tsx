import { FC } from 'react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'

const Integrations: FC = () => {
  return (
    <>
      <SEO
        title="Integrations | Client Portal"
        description="Connect your accounting apps and streamline data flow in the RPC Associates Client Portal."
        canonical="/portal/integrations"
      />
      <ClientPortalShell>
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-3xl font-bold text-primary-dark">Integrations</h1>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              Coming Soon
            </span>
          </div>
          
          <div className="bg-white p-8 rounded-lg border border-border shadow-sm text-center">
            <svg className="h-12 w-12 text-text-light mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-primary-dark mb-2">Integrations Coming Soon</h2>
            <p className="text-text-light max-w-md mx-auto">
              Connect QuickBooks, Xero, banking apps, and other business tools for seamless data synchronization and automated reporting.
            </p>
          </div>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default Integrations

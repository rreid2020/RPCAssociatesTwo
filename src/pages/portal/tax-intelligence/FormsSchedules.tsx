import { FC } from 'react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'

const FormsSchedules: FC = () => {
  return (
    <>
      <SEO title="Forms & Schedules | Tax Intelligence" description="Structured forms and schedules workspace." canonical="/app/tax-intelligence/forms-schedules" />
      <ClientPortalShell>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primary-dark">Forms &amp; Schedules</h1>
          <div className="bg-white p-4 border border-border rounded-lg shadow-sm">
            <p className="text-sm text-text-light">
              Forms and schedules scaffolding is ready. This module will host deterministic line-level mappings for CRA schedules in upcoming iterations.
            </p>
          </div>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default FormsSchedules

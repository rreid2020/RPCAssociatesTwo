import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { getTaxBasePath } from './path'

const Optimization: FC = () => {
  const location = useLocation()
  const basePath = getTaxBasePath(location.pathname)

  return (
    <>
      <SEO title="Optimization | Tax Intelligence" description="Tax optimization workspace." canonical="/app/tax-intelligence/optimization" />
      <ClientPortalShell>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primary-dark">Optimization</h1>
          <p className="text-sm text-text-light">
            Optimization compares scenario outcomes while keeping deterministic calculations as source of truth.
          </p>
          <div className="bg-white p-4 border border-border rounded-lg shadow-sm space-y-2">
            <p className="text-sm text-text">
              Start with scenario creation, then compare taxable income and estimated payable deltas.
            </p>
            <Link to={`${basePath}/scenarios`} className="text-sm font-medium text-accent hover:underline">
              Open scenarios workspace
            </Link>
          </div>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default Optimization

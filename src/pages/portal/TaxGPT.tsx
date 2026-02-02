import { FC } from 'react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'

const TaxGPT: FC = () => {
  return (
    <>
      <SEO
        title="TaxGPT | Client Portal"
        description="AI-powered tax research and guidance with instant answers to complex tax questions."
        canonical="/portal/taxgpt"
      />
      <ClientPortalShell>
        <div>
          <h1 className="text-3xl font-bold text-primary-dark mb-6">TaxGPT</h1>
          
          <div className="bg-white p-6 rounded-lg border border-border shadow-sm mb-6">
            <p className="text-text-light mb-4">
              TaxGPT will be integrated here. This module provides AI-powered tax research, document analysis, 
              form guidance, and tax planning assistance.
            </p>
            <p className="text-sm text-text-light">
              The TaxGPT application is located in <code className="bg-background px-2 py-1 rounded">client-portal/taxgpt-web</code> 
              and will be integrated into this portal shell.
            </p>
          </div>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default TaxGPT

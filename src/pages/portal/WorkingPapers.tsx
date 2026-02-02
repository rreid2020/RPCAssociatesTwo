import { FC } from 'react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'

const WorkingPapers: FC = () => {
  return (
    <>
      <SEO
        title="Working Papers | Client Portal"
        description="Centralized collaboration on workpapers and checklists in the RPC Associates Client Portal."
        canonical="/portal/working-papers"
      />
      <ClientPortalShell>
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-3xl font-bold text-primary-dark">Working Papers</h1>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              Coming Soon
            </span>
          </div>
          
          <div className="bg-white p-8 rounded-lg border border-border shadow-sm text-center">
            <svg className="h-12 w-12 text-text-light mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-primary-dark mb-2">Working Papers Coming Soon</h2>
            <p className="text-text-light max-w-md mx-auto">
              Digital workpapers, collaborative checklists, contextual notes, and template library will be available here soon.
            </p>
          </div>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default WorkingPapers

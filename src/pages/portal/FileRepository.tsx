import { FC } from 'react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'

const FileRepository: FC = () => {
  return (
    <>
      <SEO
        title="File Repository | Client Portal"
        description="Secure document sharing and organization in the RPC Associates Client Portal."
        canonical="/portal/files"
      />
      <ClientPortalShell>
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-3xl font-bold text-primary-dark">File Repository</h1>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              Coming Soon
            </span>
          </div>
          
          <div className="bg-white p-8 rounded-lg border border-border shadow-sm text-center">
            <svg className="h-12 w-12 text-text-light mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <h2 className="text-xl font-semibold text-primary-dark mb-2">File Repository Coming Soon</h2>
            <p className="text-text-light max-w-md mx-auto">
              Secure document sharing, organized folders, version control, and quick sharing with your RPC team will be available here soon.
            </p>
          </div>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default FileRepository

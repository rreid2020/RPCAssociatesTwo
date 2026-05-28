import { FC } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import { useFeatureAccess } from '../../lib/subscriptions/hooks'
import { getTaxgptWebUrl } from '../../lib/portalApi'
import UpgradePrompt from '../../components/UpgradePrompt'

const TaxGPT: FC = () => {
  const { isLoaded } = useAuth()
  const hasAccess = useFeatureAccess('taxgpt')
  const url = getTaxgptWebUrl().trim().replace(/\/$/, '')

  return (
    <>
      <SEO
        title="TaxGPT | Client Portal"
        description="AI-powered tax research and guidance with instant answers to complex tax questions."
        canonical="/portal/taxgpt"
      />
      <ClientPortalShell>
        <div>
          <h1 className="text-3xl font-bold text-primary-dark mb-2">TaxGPT</h1>
          <p className="text-text-light mb-6">AI tax research, document help, and form guidance.</p>

          {!hasAccess ? (
            <UpgradePrompt feature="TaxGPT" />
          ) : !url ? (
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
              <p className="text-text-light mb-2">
                The TaxGPT web app URL is not configured. Set <code className="bg-background px-2 py-0.5 rounded">VITE_TAXGPT_WEB_URL</code> in
                the frontend environment to the deployed taxgpt-web origin (for example, your <code className="bg-background px-2 py-0.5 rounded">taxgpt-web</code> site).
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-text-light mb-4 max-w-3xl">
                TaxGPT opens in a secure window below. Use the same Clerk sign-in you use for this portal. If the embedded app asks you to
                sign in, complete sign-in and return here as needed. Deep integration can share session cookies when both apps use the same
                Clerk instance and allowed domains.
              </p>
              {isLoaded ? (
                <div className="w-full min-h-[70vh] border border-border rounded-lg overflow-hidden bg-white shadow-sm">
                  <iframe title="TaxGPT" src={url} className="w-full h-[min(80vh,900px)] border-0" />
                </div>
              ) : (
                <p className="text-text-light">Loading&hellip;</p>
              )}
            </>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default TaxGPT

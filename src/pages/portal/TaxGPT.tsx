import { FC, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import UpgradePrompt from '../../components/UpgradePrompt'
import { fetchTaxgptStatus } from '../../domains/taxgpt'
import ChatInterface from '../../modules/taxgpt/components/ChatInterface'
import { useFeatureAccess } from '../../lib/subscriptions/hooks'

const TaxGPT: FC = () => {
  const { getToken, isLoaded } = useAuth()
  const hasAccess = useFeatureAccess('taxgpt')
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasAccess || !isLoaded) return
    let mounted = true
    const run = async () => {
      try {
        const status = await fetchTaxgptStatus(getToken)
        if (mounted) {
          setConfigured(status.configured)
          setStatusError(null)
        }
      } catch (e) {
        if (mounted) {
          setConfigured(false)
          setStatusError(e instanceof Error ? e.message : 'Could not verify TaxGPT status')
        }
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [getToken, hasAccess, isLoaded])

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
          ) : !isLoaded || configured === null ? (
            <p className="text-text-light">Loading TaxGPT…</p>
          ) : !configured ? (
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm space-y-2">
              <p className="text-text">
                TaxGPT chat is not configured on the API server yet.
              </p>
              <p className="text-sm text-text-light">
                Set <code className="bg-background px-2 py-0.5 rounded">OPENAI_API_KEY</code> on the API
                component, then redeploy the API service.
              </p>
              {statusError && <p className="text-sm text-red-700">{statusError}</p>}
            </div>
          ) : (
            <ChatInterface />
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default TaxGPT

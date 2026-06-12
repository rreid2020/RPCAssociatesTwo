import { FC, lazy, Suspense, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import UpgradePrompt from '../../components/UpgradePrompt'
import { fetchTaxgptStatus } from '../../domains/taxgpt'
import type { TaxgptCorpusStats } from '../../domains/taxgpt'
import { useFeatureAccess } from '../../lib/subscriptions/hooks'
import PageLoadingSkeleton from '../../shared/loading/PageLoadingSkeleton'

const ChatInterface = lazy(async () => await import('../../modules/taxgpt/components/ChatInterface'))
const chatInterfacePreload = import('../../modules/taxgpt/components/ChatInterface')

const TaxGPT: FC = () => {
  const { getToken, isLoaded } = useAuth()
  const hasAccess = useFeatureAccess('taxgpt')
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [corpus, setCorpus] = useState<TaxgptCorpusStats | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusReloadKey, setStatusReloadKey] = useState(0)

  useEffect(() => {
    if (!hasAccess || !isLoaded) return
    let mounted = true
    const run = async () => {
      setConfigured(null)
      setCorpus(null)
      setStatusError(null)
      try {
        const [status] = await Promise.all([
          fetchTaxgptStatus(getToken),
          chatInterfacePreload
        ])
        if (mounted) {
          setConfigured(status.configured)
          setCorpus(status.corpus)
        }
      } catch (e) {
        if (mounted) {
          setConfigured(null)
          setCorpus(null)
          setStatusError(e instanceof Error ? e.message : 'Could not verify TaxGPT status')
        }
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [getToken, hasAccess, isLoaded, statusReloadKey])

  return (
    <>
      <SEO
        title="Axiom TaxGPT | Client Portal"
        description="AI-powered tax research and guidance with instant answers to complex tax questions."
        canonical="/portal/taxgpt"
      />
      <ClientPortalShell>
        <div>
          {!hasAccess ? (
            <UpgradePrompt feature="TaxGPT" />
          ) : !isLoaded || (configured === null && !statusError) ? (
            <div className="py-8">
              <PageLoadingSkeleton variant="default" />
            </div>
          ) : statusError ? (
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm space-y-3">
              <p className="text-text font-medium">Could not load TaxGPT right now.</p>
              <p className="text-sm text-red-700">{statusError}</p>
              <p className="text-sm text-text-light">
                This is usually a temporary API or database connection issue. If it keeps happening,
                confirm the API component has <code className="bg-background px-2 py-0.5 rounded">DATABASE_URL</code>{' '}
                and <code className="bg-background px-2 py-0.5 rounded">OPENAI_API_KEY</code> set in App Platform,
                then redeploy the API service.
              </p>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setStatusReloadKey((key) => key + 1)}
              >
                Retry
              </button>
            </div>
          ) : !configured ? (
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm space-y-2">
              <p className="text-text">
                TaxGPT chat is not configured on the API server yet.
              </p>
              <p className="text-sm text-text-light">
                Set <code className="bg-background px-2 py-0.5 rounded">OPENAI_API_KEY</code> on the API
                component, then redeploy the API service.
              </p>
            </div>
          ) : corpus ? (
            <Suspense
              fallback={(
                <div className="py-8">
                  <PageLoadingSkeleton variant="default" />
                </div>
              )}
            >
              <ChatInterface initialCorpus={corpus} />
            </Suspense>
          ) : (
            <p className="text-text-light">Could not load TaxGPT corpus status.</p>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default TaxGPT

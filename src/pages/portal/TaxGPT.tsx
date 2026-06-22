import { FC, Suspense, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import UpgradePrompt from '../../components/UpgradePrompt'
import { fetchTaxgptStatus } from '../../domains/taxgpt'
import type { TaxgptCorpusStats } from '../../domains/taxgpt'
import { useFeatureAccess } from '../../lib/subscriptions/hooks'
import PageLoadingSkeleton from '../../shared/loading/PageLoadingSkeleton'
import { routeLazy } from '../../shared/loading/routeLazy'

const ChatInterface = routeLazy(async () => await import('../../modules/taxgpt/components/ChatInterface'))
const chatInterfacePreload = import('../../modules/taxgpt/components/ChatInterface')

const OPTIMISTIC_CORPUS: TaxgptCorpusStats = {
  sourceCount: 0,
  ingestedSourceCount: 0,
  pendingSourceCount: 0,
  chunkCount: 0,
  embeddingCount: 0,
  retrievalReady: true
}

const TaxGPT: FC = () => {
  const { getToken, isLoaded } = useAuth()
  const hasAccess = useFeatureAccess('taxgpt')
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [corpus, setCorpus] = useState<TaxgptCorpusStats | null>(null)
  const [statusNotice, setStatusNotice] = useState<string | null>(null)
  const [statusLoaded, setStatusLoaded] = useState(false)
  const statusRequestIdRef = useRef(0)

  useEffect(() => {
    void chatInterfacePreload
  }, [])

  useEffect(() => {
    if (!hasAccess || !isLoaded) return

    const requestId = statusRequestIdRef.current + 1
    statusRequestIdRef.current = requestId

    const run = async () => {
      try {
        const status = await fetchTaxgptStatus(getToken)
        if (statusRequestIdRef.current !== requestId) return
        setConfigured(status.configured)
        setCorpus(status.corpus)
        setStatusNotice(null)
      } catch {
        if (statusRequestIdRef.current !== requestId) return
        setConfigured((current) => current ?? true)
        setStatusNotice('Live corpus stats are temporarily unavailable while ingestion runs. TaxGPT chat remains available.')
      } finally {
        if (statusRequestIdRef.current === requestId) {
          setStatusLoaded(true)
        }
      }
    }
    void run()
  }, [hasAccess, isLoaded])

  const showNotConfigured = statusLoaded && configured === false

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
          ) : !isLoaded ? (
            <div className="py-8">
              <PageLoadingSkeleton variant="default" />
            </div>
          ) : showNotConfigured ? (
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm space-y-2">
              <p className="text-text">
                TaxGPT chat is not configured on the API server yet.
              </p>
              <p className="text-sm text-text-light">
                Set <code className="bg-background px-2 py-0.5 rounded">OPENAI_API_KEY</code> on the API
                component, then redeploy the API service.
              </p>
            </div>
          ) : (
            <>
              {statusNotice && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {statusNotice}
                </div>
              )}
              <Suspense
                fallback={(
                  <div className="py-8">
                    <PageLoadingSkeleton variant="default" />
                  </div>
                )}
              >
                <ChatInterface
                  initialCorpus={corpus ?? OPTIMISTIC_CORPUS}
                  corpusOverride={corpus}
                />
              </Suspense>
            </>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default TaxGPT

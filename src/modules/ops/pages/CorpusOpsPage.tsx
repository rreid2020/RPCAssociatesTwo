import { FC, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import ClientPortalShell from '../../../components/ClientPortalShell'
import SEO from '../../../components/SEO'
import { CountTable } from '../components/OpsSummaryCards'
import { getOpsCorpusAudit, type OpsCorpusAudit } from '../services'

const CorpusOpsPage: FC = () => {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [corpus, setCorpus] = useState<OpsCorpusAudit | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const next = await getOpsCorpusAudit(getToken)
        if (!cancelled) setCorpus(next)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load corpus audit')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [getToken])

  return (
    <>
      <SEO title="Corpus Ops | Platform Ops" description="TaxGPT corpus ingest and discovery audit." canonical="/portal/ops/corpus" />
      <ClientPortalShell>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-primary-dark">Corpus Operations</h1>
            <Link to="/portal/ops" className="text-sm text-accent font-medium hover:underline">Back to ops home</Link>
          </div>
          {loading && <p className="text-sm text-text-light">Loading corpus audit...</p>}
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
          {corpus && (
            <>
              <section className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="border border-border rounded-md p-3"><strong>Sources</strong><p>{corpus.totals.sourceCount}</p></div>
                <div className="border border-border rounded-md p-3"><strong>Ingested</strong><p>{corpus.totals.ingestedSourceCount}</p></div>
                <div className="border border-border rounded-md p-3"><strong>Chunks</strong><p>{corpus.totals.chunkCount}</p></div>
                <div className="border border-border rounded-md p-3"><strong>Embeddings</strong><p>{corpus.totals.embeddingCount}</p></div>
              </section>
              <CountTable title="By ingest status" rows={corpus.byIngestStatus} />
              <CountTable title="By page kind" rows={corpus.byPageKind} />
              <CountTable title="Top categories" rows={corpus.byCategory} />
              <CountTable title="Taxes hub corpus roles" rows={corpus.taxesHubByCorpusRole} />
            </>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default CorpusOpsPage

import { FC } from 'react'
import { Link } from 'react-router-dom'
import ClientPortalShell from '../../../components/ClientPortalShell'
import SEO from '../../../components/SEO'
import { useOpsOverview } from '../hooks/useOpsOverview'
import { OpsSummaryCards } from '../components/OpsSummaryCards'

const OpsDashboardPage: FC = () => {
  const { loading, error, overview } = useOpsOverview()

  return (
    <>
      <SEO title="Platform Ops | Client Portal" description="SaaS operator dashboard for corpus, registry, and platform health." canonical="/portal/ops" />
      <ClientPortalShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">Platform Operations</h1>
            <p className="text-sm text-text-light mt-1">Monitor corpus pipelines, CRA form registry coverage, and external admin consoles.</p>
          </div>

          <nav className="flex flex-wrap gap-2 text-sm">
            <Link to="/portal/ops/corpus" className="px-3 py-1.5 rounded-md border border-border bg-white hover:bg-background">Corpus</Link>
            <Link to="/portal/ops/forms-registry" className="px-3 py-1.5 rounded-md border border-border bg-white hover:bg-background">Forms registry</Link>
            <Link to="/portal/ops/feedback" className="px-3 py-1.5 rounded-md border border-border bg-white hover:bg-background">TaxGPT feedback</Link>
            <Link to="/portal/ops/links" className="px-3 py-1.5 rounded-md border border-border bg-white hover:bg-background">External links</Link>
          </nav>

          {loading && <p className="text-sm text-text-light">Loading ops overview...</p>}
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
          {overview && (
            <>
              <OpsSummaryCards overview={overview} />
              <section className="rounded-lg border border-border bg-white p-4 shadow-sm text-sm text-text">
                <p><strong>Retrieval ready:</strong> {overview.corpus.retrievalReady ? 'Yes' : 'No'}</p>
                <p className="mt-1"><strong>Embeddings:</strong> {overview.corpus.embeddingCount.toLocaleString()}</p>
                <p className="mt-1"><strong>Taxes hub pending:</strong> {overview.taxesHub.pending} ({overview.taxesHub.unknown} still expanding)</p>
                {overview.feedback && (
                  <p className="mt-1"><strong>TaxGPT feedback queue:</strong> {overview.feedback.submitted} submitted · {overview.feedback.underReview} under review</p>
                )}
                <p className="mt-1 text-xs text-text-light">Last refreshed {new Date(overview.generatedAt).toLocaleString()}</p>
              </section>
            </>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default OpsDashboardPage

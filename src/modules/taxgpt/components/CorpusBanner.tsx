import { FC } from 'react'
import type { TaxgptCorpusStats } from '../../../domains/taxgpt'

type CorpusBannerProps = {
  corpus: TaxgptCorpusStats
}

const CorpusBanner: FC<CorpusBannerProps> = ({ corpus }) => {
  if (corpus.retrievalReady) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-4">
        <p className="text-sm text-emerald-900">
          <strong>CRA knowledge base active.</strong>{' '}
          {corpus.ingestedSourceCount.toLocaleString()} ingested sources,{' '}
          {corpus.embeddingCount.toLocaleString()} indexed passages. Answers cite official CRA material when relevant.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
      <p className="text-sm text-amber-900">
        <strong>General guidance mode.</strong> The CRA source index is not populated yet, so answers are not grounded
        in retrieved official publications. Run TaxGPT corpus ingestion on the API database to enable cited, source-backed responses.
      </p>
      <p className="text-xs text-amber-800 mt-1">
        Sources discovered: {corpus.sourceCount.toLocaleString()} · Pending ingestion: {(corpus.pendingSourceCount ?? 0).toLocaleString()}
      </p>
    </div>
  )
}

export default CorpusBanner

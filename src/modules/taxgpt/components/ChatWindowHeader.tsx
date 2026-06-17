import { FC } from 'react'
import type { TaxgptCorpusStats } from '../../../domains/taxgpt'
import AxiomTaxGptLogo from './AxiomTaxGptLogo'

type ChatWindowHeaderProps = {
  corpus: TaxgptCorpusStats | null
}

const ChatWindowHeader: FC<ChatWindowHeaderProps> = ({ corpus }) => (
  <div className="border-b border-border bg-background px-6 py-5 text-center">
    <AxiomTaxGptLogo size="md" className="mx-auto" />
    <p className="mx-auto mt-3 max-w-2xl text-sm text-text-light">
      AI tax research grounded in CRA publications when the knowledge base is indexed, with citations and source links.
      Tax strategies may cite third-party web planning sources.
    </p>
    {corpus && (
      <p className={`mx-auto mt-2 max-w-2xl text-xs ${corpus.retrievalReady ? 'text-emerald-800' : 'text-amber-800'}`}>
        {corpus.retrievalReady ? (
          <>
            <strong>CRA knowledge base active.</strong>{' '}
            {corpus.ingestedSourceCount.toLocaleString()} ingested sources ·{' '}
            {corpus.embeddingCount.toLocaleString()} indexed passages
          </>
        ) : (
          <>
            <strong>General guidance mode.</strong>{' '}
            {corpus.sourceCount.toLocaleString()} sources discovered ·{' '}
            {(corpus.pendingSourceCount ?? 0).toLocaleString()} pending ingestion
          </>
        )}
      </p>
    )}
  </div>
)

export default ChatWindowHeader

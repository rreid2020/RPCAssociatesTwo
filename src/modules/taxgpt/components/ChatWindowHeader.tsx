import { FC } from 'react'
import type { TaxgptCorpusStats } from '../../../domains/taxgpt'

type ChatWindowHeaderProps = {
  corpus: TaxgptCorpusStats | null
}

const ChatWindowHeader: FC<ChatWindowHeaderProps> = ({ corpus }) => (
  <div className="border-b border-border bg-background px-6 py-4">
    <div className="flex items-start gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-white text-lg"
        aria-hidden
      >
        ✨
      </div>
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-primary-dark">TaxGPT</h1>
        <p className="mt-1 text-sm text-text-light">
          AI tax research grounded in CRA publications when the knowledge base is indexed, with citations and source links.
        </p>
        {corpus && (
          <p className={`mt-2 text-xs ${corpus.retrievalReady ? 'text-emerald-800' : 'text-amber-800'}`}>
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
    </div>
  </div>
)

export default ChatWindowHeader

import type { TaxgptCitation } from '../../../lib/taxgptApi'

type CitationPanelProps = {
  citations: TaxgptCitation[]
  open: boolean
  onClose: () => void
}

function CitationContent ({ citations }: { citations: TaxgptCitation[] }) {
  if (citations.length === 0) {
    return <p className="text-sm text-text-light">Select an assistant message to view source evidence and references.</p>
  }
  return (
    <div className="space-y-3">
      {citations.map((citation, index) => (
        <article key={citation.id || `${citation.source_chunk_id}-${index}`} className="rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Source {index + 1}</p>
          <p className="mt-1 text-sm font-medium text-primary-dark">{citation.source_title || 'CRA Source'}</p>
          {citation.section_reference && <p className="text-xs text-text-light">{citation.section_reference}</p>}
          <p className="mt-2 text-sm text-text">{citation.excerpt}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-light">
            {typeof citation.confidence_score === 'number' && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary-dark">
                Confidence {(citation.confidence_score * 100).toFixed(1)}%
              </span>
            )}
            {citation.source_type && <span>{citation.source_type}</span>}
            {citation.source_url && (
              <a href={citation.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Open source
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

export default function CitationPanel ({ citations, open, onClose }: CitationPanelProps) {
  return (
    <>
      <aside className="hidden xl:block xl:w-96">
        <div className="sticky top-24 rounded-lg border border-border bg-white p-4">
          <h3 className="text-sm font-semibold text-primary-dark">Citation Evidence</h3>
          <div className="mt-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
            <CitationContent citations={citations} />
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-primary-dark">Citation Evidence</h3>
              <button type="button" onClick={onClose} className="text-sm text-text-light hover:text-primary-dark">
                Close
              </button>
            </div>
            <div className="h-[calc(100%-2.5rem)] overflow-y-auto">
              <CitationContent citations={citations} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

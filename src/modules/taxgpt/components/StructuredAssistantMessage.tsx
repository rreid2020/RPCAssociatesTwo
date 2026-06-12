import { FC } from 'react'
import type { TaxgptSourceBucket, TaxgptStructuredResponse } from '../../../domains/taxgpt'

type StructuredAssistantMessageProps = {
  structured: TaxgptStructuredResponse
}

const BUCKET_ORDER: TaxgptSourceBucket[] = ['cra', 'legislation', 'case_law']

function confidenceClasses (confidence: TaxgptStructuredResponse['confidence']) {
  switch (confidence) {
    case 'high':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    case 'low':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    default:
      return 'bg-sky-50 text-sky-800 border-sky-200'
  }
}

function confidenceLabel (confidence: TaxgptStructuredResponse['confidence']) {
  switch (confidence) {
    case 'high':
      return 'High confidence'
    case 'low':
      return 'Low confidence'
    default:
      return 'Medium confidence'
  }
}

const StructuredAssistantMessage: FC<StructuredAssistantMessageProps> = ({ structured }) => {
  const grouped = structured.groupedSources

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${confidenceClasses(structured.confidence)}`}>
          {confidenceLabel(structured.confidence)}
        </span>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-primary-dark">Direct answer</h3>
        <p className="mt-2 text-sm leading-relaxed text-text">{structured.directAnswer}</p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-primary-dark">Sources consulted</h3>
        <div className="mt-3 space-y-3">
          {BUCKET_ORDER.map((bucket) => {
            const group = grouped?.[bucket]
            if (!group) return null
            return (
              <div key={bucket} className="rounded-md border border-border bg-background px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-light">{group.label}</p>
                {group.entries.length === 0 ? (
                  <p className="mt-2 text-sm text-text-light">{group.emptyMessage}</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {group.entries.map((entry) => (
                      <li key={entry.id || entry.chunkId || entry.sourceUrl}>
                        <a
                          href={entry.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {entry.sourceTitle}
                        </a>
                        {entry.sectionHeading && (
                          <p className="text-xs text-text-light">{entry.sectionHeading}</p>
                        )}
                        {entry.summary && (
                          <p className="mt-1 text-sm text-text">{entry.summary}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {structured.complianceRisk && (
        <section className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-amber-900">Compliance Risk</h3>
          <p className="mt-2 text-sm leading-relaxed text-amber-950">{structured.complianceRisk}</p>
        </section>
      )}

      {(structured.whatThisMeansForYou ||
        structured.keyPoints.length > 0 ||
        structured.considerations.length > 0 ||
        structured.suggestedNextSteps.length > 0) && (
        <section className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
          <h3 className="text-sm font-semibold text-primary-dark">What this means for you</h3>

          {structured.whatThisMeansForYou && (
            <p className="mt-2 text-sm leading-relaxed text-text">{structured.whatThisMeansForYou}</p>
          )}

          {structured.keyPoints.length > 0 && (
            <div className={structured.whatThisMeansForYou ? 'mt-4' : 'mt-2'}>
              <h4 className="text-sm font-semibold text-primary-dark">Key points</h4>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-text">
                {structured.keyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {structured.considerations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-primary-dark">Considerations</h4>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-text">
                {structured.considerations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {structured.suggestedNextSteps.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-primary-dark">Suggested next steps</h4>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-text">
                {structured.suggestedNextSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default StructuredAssistantMessage

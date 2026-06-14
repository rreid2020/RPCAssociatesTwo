import { FC } from 'react'
import type {
  TaxgptComplianceRiskSource,
  TaxgptSourceBucket,
  TaxgptStructuredResponse
} from '../../../domains/taxgpt'
import CitedText from './CitedText'

type StructuredAssistantMessageProps = {
  structured: TaxgptStructuredResponse
}

function SourceHighlights ({ highlights }: { highlights: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text">
      {highlights.map((highlight) => (
        <li key={highlight}>{highlight}</li>
      ))}
    </ul>
  )
}

function referenceAnchorId (citationIndex: number) {
  return `taxgpt-ref-${citationIndex}`
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

const GENERIC_COMPLIANCE_RISK_PATTERNS = [
  /if\s+.+\s+(are|is)\s+not\s+reported\s+correctly/i,
  /there\s+may\s+be\s+risks\s+of\s+reassessment,\s*penalties,\s*(and\s+)?or\s+denied\s+claims/i,
  /risks\s+of\s+reassessment,\s*penalties,\s*or\s+denied\s+claims/i
]

function isGenericComplianceRisk (text: string): boolean {
  const normalized = text.trim()
  if (!normalized || normalized.length < 48) return true
  return GENERIC_COMPLIANCE_RISK_PATTERNS.some((pattern) => pattern.test(normalized))
}

function SourceBackedLinks ({ sources }: { sources: TaxgptComplianceRiskSource[] }) {
  if (!sources.length) return null

  return (
    <ul className="mt-2 space-y-1">
      {sources.map((source) => (
        <li key={`${source.citationIndex}-${source.sourceUrl}`} className="text-xs">
          <a
            href={`#${referenceAnchorId(source.citationIndex)}`}
            className="font-medium underline decoration-current/30 hover:decoration-current"
          >
            [{source.citationIndex}] {source.sourceTitle}
          </a>
          {source.sectionHeading && (
            <span className="opacity-80"> — {source.sectionHeading}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

const StructuredAssistantMessage: FC<StructuredAssistantMessageProps> = ({ structured }) => {
  const grouped = structured.groupedSources
  const sourceReferences = structured.sourceReferences ?? []
  const keyPoints = structured.keyPoints ?? []
  const considerations = structured.considerations ?? []
  const suggestedNextSteps = structured.suggestedNextSteps ?? []
  const complianceRisks = (structured.complianceRisks ?? []).filter((entry) => !isGenericComplianceRisk(entry.risk))
  const legacyComplianceRisk = structured.complianceRisk && !isGenericComplianceRisk(structured.complianceRisk)
    ? structured.complianceRisk
    : null
  const taxTips = structured.taxTips ?? []
  const filingDeadlines = structured.filingDeadlines ?? []
  const penaltiesAndInterest = (structured.penaltiesAndInterest ?? [])
    .filter((entry) => !isGenericComplianceRisk(entry.description))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${confidenceClasses(structured.confidence)}`}>
          {confidenceLabel(structured.confidence)}
        </span>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-primary-dark">Direct answer</h3>
        <p className="mt-2 text-sm leading-relaxed text-text">
          <CitedText text={structured.directAnswer} sourceReferences={sourceReferences} />
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-primary-dark">Sources consulted</h3>
        <p className="mt-1 text-xs text-text-light">
          Key points from retrieved CRA and other sources. Numbered citations such as [1] match the references section below.
        </p>
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
                  <ul className="mt-2 space-y-4">
                    {group.entries.map((entry) => (
                      <li key={entry.id || entry.chunkId || entry.sourceUrl}>
                        <p className="text-sm font-medium text-text">
                          {entry.citationIndex ? `[${entry.citationIndex}] ` : ''}{entry.sourceTitle}
                        </p>
                        {entry.sectionHeading && (
                          <p className="text-xs text-text-light">{entry.sectionHeading}</p>
                        )}
                        {entry.highlights && entry.highlights.length > 0 ? (
                          <SourceHighlights highlights={entry.highlights} />
                        ) : entry.summary ? (
                          <p className="mt-1 text-sm text-text">{entry.summary}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {(structured.whatThisMeansForYou ||
        keyPoints.length > 0 ||
        considerations.length > 0 ||
        suggestedNextSteps.length > 0) && (
        <section className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
          <h3 className="text-sm font-semibold text-primary-dark">What this means for you</h3>

          {structured.whatThisMeansForYou && (
            <p className="mt-2 text-sm leading-relaxed text-text">
              <CitedText text={structured.whatThisMeansForYou} sourceReferences={sourceReferences} />
            </p>
          )}

          {keyPoints.length > 0 && (
            <div className={structured.whatThisMeansForYou ? 'mt-4' : 'mt-2'}>
              <h4 className="text-sm font-semibold text-primary-dark">Key points</h4>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-text">
                {keyPoints.map((point) => (
                  <li key={point}>
                    <CitedText text={point} sourceReferences={sourceReferences} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {considerations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-primary-dark">Considerations</h4>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-text">
                {considerations.map((item) => (
                  <li key={item}>
                    <CitedText text={item} sourceReferences={sourceReferences} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestedNextSteps.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-primary-dark">Suggested next steps</h4>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-text">
                {suggestedNextSteps.map((item) => (
                  <li key={item}>
                    <CitedText text={item} sourceReferences={sourceReferences} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {taxTips.length > 0 && (
        <section className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-emerald-900">Tax tips</h3>
          <p className="mt-1 text-xs text-emerald-800">
            Practical CRA-focused tips grounded in retrieved sources for this question.
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-emerald-950">
            {taxTips.map((tip) => (
              <li key={tip}>
                <CitedText text={tip} sourceReferences={sourceReferences} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {filingDeadlines.length > 0 && (
        <section className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-sky-900">Filing dates and deadlines</h3>
          <p className="mt-1 text-xs text-sky-800">
            Source-backed filing, payment, or remittance dates relevant to this question.
          </p>
          <ul className="mt-3 space-y-3">
            {filingDeadlines.map((entry) => (
              <li key={`${entry.title}-${entry.deadline}-${entry.citationIndices.join(',')}`} className="text-sm text-sky-950">
                <p className="font-medium">
                  {entry.title}
                  {entry.deadline && (
                    <span className="font-semibold text-sky-900"> — {entry.deadline}</span>
                  )}
                </p>
                {entry.note && (
                  <p className="mt-1 leading-relaxed text-sky-900">{entry.note}</p>
                )}
                {entry.sources && entry.sources.length > 0 && (
                  <div className="text-sky-900">
                    <SourceBackedLinks sources={entry.sources} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {penaltiesAndInterest.length > 0 && (
        <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-rose-900">Penalties and interest for non-compliance</h3>
          <p className="mt-1 text-xs text-rose-800">
            Specific CRA penalty and interest rules from retrieved sources. Not legal advice.
          </p>
          <ul className="mt-3 space-y-3">
            {penaltiesAndInterest.map((entry) => (
              <li key={`${entry.description}-${entry.citationIndices.join(',')}`} className="text-sm leading-relaxed text-rose-950">
                <p>{entry.description}</p>
                {entry.sources && entry.sources.length > 0 && (
                  <div className="text-rose-900">
                    <SourceBackedLinks sources={entry.sources} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(complianceRisks.length > 0 || legacyComplianceRisk) && (
        <section className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-amber-900">Compliance risks</h3>
          <p className="mt-1 text-xs text-amber-800">
            Source-backed non-compliance consequences for this question. Not legal advice.
          </p>
          {complianceRisks.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {complianceRisks.map((entry) => (
                <li key={`${entry.risk}-${entry.citationIndices.join(',')}`} className="text-sm leading-relaxed text-amber-950">
                  <p>{entry.risk}</p>
                  {entry.sources && entry.sources.length > 0 && (
                    <div className="text-amber-900">
                      <SourceBackedLinks sources={entry.sources} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : legacyComplianceRisk ? (
            <p className="mt-2 text-sm leading-relaxed text-amber-950">{legacyComplianceRisk}</p>
          ) : null}
        </section>
      )}

      {sourceReferences.length > 0 && (
        <section className="rounded-md border border-border bg-background px-4 py-3">
          <h3 className="text-sm font-semibold text-primary-dark">References</h3>
          <p className="mt-1 text-xs text-text-light">
            Source documents cited in this answer.
          </p>
          <ul className="mt-3 space-y-2">
            {sourceReferences.map((reference) => (
              <li
                key={`ref-${reference.citationIndex}-${reference.chunkId}`}
                id={referenceAnchorId(reference.citationIndex)}
                className="text-sm scroll-mt-4"
              >
                <span className="font-medium text-text">[{reference.citationIndex}] </span>
                {reference.sourceUrl ? (
                  <a
                    href={reference.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {reference.sourceTitle}
                  </a>
                ) : (
                  <span className="font-medium text-text">{reference.sourceTitle}</span>
                )}
                {reference.sectionHeading && (
                  <span className="text-xs text-text-light"> — {reference.sectionHeading}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default StructuredAssistantMessage

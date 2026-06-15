import { FC } from 'react'
import { Link } from 'react-router-dom'
import type { TaxgptFeedbackCategory, TaxgptFeedbackSuggestion } from '../../../domains/taxgpt'
import { buildTaxgptFeedbackLink } from '../../../domains/taxgpt'

type FeedbackSuggestionBannerProps = {
  suggestion: TaxgptFeedbackSuggestion
  sessionId?: string | null
}

const CATEGORY_LABELS: Record<TaxgptFeedbackCategory, string> = {
  feedback: 'General feedback',
  suggestion: 'Feature suggestion',
  answer_quality: 'Answer quality issue',
  corpus_gap: 'Missing source or topic'
}

const FeedbackSuggestionBanner: FC<FeedbackSuggestionBannerProps> = ({ suggestion, sessionId = null }) => {
  if (!suggestion.show) return null

  const category = suggestion.category || 'feedback'
  const feedbackHref = buildTaxgptFeedbackLink({
    sessionId,
    category,
    subject: suggestion.subject || undefined,
    message: suggestion.messageDraft || undefined
  })

  return (
    <section
      className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3"
      aria-label="Feedback suggestion"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-amber-900">Help us improve this answer</h3>
          <p className="mt-1 text-sm leading-relaxed text-amber-950">
            {suggestion.reason}
          </p>
          <p className="mt-2 text-xs text-amber-800">
            Suggested feedback category: {CATEGORY_LABELS[category]}
          </p>
        </div>
        <Link
          to={feedbackHref}
          className="inline-flex shrink-0 items-center rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-950 shadow-sm hover:bg-amber-100"
        >
          Report issue
        </Link>
      </div>
    </section>
  )
}

export default FeedbackSuggestionBanner

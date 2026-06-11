import { FC, FormEvent, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import UpgradePrompt from '../../components/UpgradePrompt'
import {
  fetchTaxgptFeedbackCategories,
  fetchTaxgptFeedbackHistory,
  submitTaxgptFeedback,
  type TaxgptFeedbackCategory,
  type TaxgptFeedbackItem
} from '../../domains/taxgpt'
import { useFeatureAccess } from '../../lib/subscriptions/hooks'

const RATING_OPTIONS = [1, 2, 3, 4, 5]

const TaxGPTFeedback: FC = () => {
  const { getToken } = useAuth()
  const hasAccess = useFeatureAccess('taxgpt')
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [categories, setCategories] = useState<Array<{ id: TaxgptFeedbackCategory; label: string }>>([])
  const [history, setHistory] = useState<TaxgptFeedbackItem[]>([])
  const [category, setCategory] = useState<TaxgptFeedbackCategory>('feedback')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false)
      return
    }
    let mounted = true
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const [categoryRows, historyRows] = await Promise.all([
          fetchTaxgptFeedbackCategories(getToken),
          fetchTaxgptFeedbackHistory(getToken)
        ])
        if (!mounted) return
        setCategories(categoryRows)
        setHistory(historyRows)
        if (categoryRows[0]?.id) setCategory(categoryRows[0].id)
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Could not load feedback form')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [getToken, hasAccess])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      await submitTaxgptFeedback(getToken, {
        category,
        subject: subject.trim(),
        message: message.trim(),
        rating: rating === '' ? null : rating,
        sessionId,
        sourcePage: 'taxgpt_feedback_page'
      })
      setSubject('')
      setMessage('')
      setRating('')
      setSuccess('Thank you. Your feedback was submitted and will be reviewed to improve TaxGPT.')
      const historyRows = await fetchTaxgptFeedbackHistory(getToken)
      setHistory(historyRows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <SEO
        title="TaxGPT Feedback | Client Portal"
        description="Share feedback and suggestions to help improve TaxGPT."
        canonical="/portal/taxgpt/feedback"
      />
      <ClientPortalShell>
        <div className="max-w-3xl">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary-dark mb-2">TaxGPT feedback</h1>
              <p className="text-text-light">
                Share feedback and suggestions to improve TaxGPT answers, sources, and features.
                Submissions are reviewed and may be staged as enhancement proposals before rollout.
              </p>
            </div>
            <Link to="/portal/taxgpt" className="btn btn--secondary text-sm py-2 px-4">
              Back to TaxGPT
            </Link>
          </div>

          {!hasAccess ? (
            <UpgradePrompt feature="TaxGPT" />
          ) : loading ? (
            <p className="text-text-light">Loading feedback form…</p>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-primary-dark">Submit feedback</h2>
                <p className="mt-1 text-sm text-text-light">
                  Your input is saved securely and used to prioritize TaxGPT improvements. It is not shared with other tenants.
                </p>

                {sessionId && (
                  <p className="mt-3 text-xs text-text-light">
                    Linked to your current TaxGPT chat session for context.
                  </p>
                )}

                {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
                {success && <p className="mt-4 text-sm text-emerald-800">{success}</p>}

                <form onSubmit={(event) => { void handleSubmit(event) }} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="feedback-category" className="block text-sm font-medium text-text mb-1">
                      Category
                    </label>
                    <select
                      id="feedback-category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value as TaxgptFeedbackCategory)}
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text"
                      disabled={submitting}
                    >
                      {categories.map((item) => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="feedback-subject" className="block text-sm font-medium text-text mb-1">
                      Subject
                    </label>
                    <input
                      id="feedback-subject"
                      type="text"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      maxLength={200}
                      required
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text"
                      placeholder="Brief summary of your feedback"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="feedback-message" className="block text-sm font-medium text-text mb-1">
                      Details
                    </label>
                    <textarea
                      id="feedback-message"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      rows={6}
                      maxLength={5000}
                      required
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text resize-y"
                      placeholder="What worked well, what was missing, or what would make TaxGPT more useful?"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="feedback-rating" className="block text-sm font-medium text-text mb-1">
                      Overall experience (optional)
                    </label>
                    <select
                      id="feedback-rating"
                      value={rating}
                      onChange={(event) => setRating(event.target.value ? Number(event.target.value) : '')}
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text"
                      disabled={submitting}
                    >
                      <option value="">No rating</option>
                      {RATING_OPTIONS.map((value) => (
                        <option key={value} value={value}>{value} — {value === 5 ? 'Excellent' : value === 1 ? 'Poor' : 'OK'}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn--primary text-sm py-2 px-4 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting…' : 'Submit feedback'}
                  </button>
                </form>
              </div>

              {history.length > 0 && (
                <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-primary-dark">Your recent submissions</h2>
                  <ul className="mt-4 space-y-3">
                    {history.map((item) => (
                      <li key={item.id} className="rounded-md border border-border bg-background px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-text">{item.subject}</p>
                          <span className="text-xs uppercase tracking-wide text-text-light">{item.status.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="mt-1 text-xs text-text-light">
                          {new Date(item.createdAt).toLocaleString()} · {item.category.replace(/_/g, ' ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default TaxGPTFeedback

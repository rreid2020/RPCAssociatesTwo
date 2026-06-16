import { FC, FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import ClientPortalShell from '../../../components/ClientPortalShell'
import SEO from '../../../components/SEO'
import {
  actionOpsFeedback,
  deleteOpsFeedback,
  getOpsFeedbackDetail,
  kickoffOpsFeedbackFix,
  updateOpsFeedback,
  type OpsFeedbackDetail,
  type OpsFeedbackFixSuggestions,
  type OpsFeedbackSessionMessage,
  type OpsFeedbackStatus
} from '../services'

const STATUS_OPTIONS: OpsFeedbackStatus[] = [
  'submitted',
  'under_review',
  'staged_for_approval',
  'approved',
  'rejected',
  'implemented'
]

function formatStatus (status: string) {
  return status.replace(/_/g, ' ')
}

const FeedbackDetailOpsPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actioning, setActioning] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<OpsFeedbackDetail | null>(null)
  const [sessionMessages, setSessionMessages] = useState<OpsFeedbackSessionMessage[]>([])
  const [status, setStatus] = useState<OpsFeedbackStatus>('submitted')
  const [operatorNotes, setOperatorNotes] = useState('')
  const [sourceUrls, setSourceUrls] = useState('')
  const [operatorSummary, setOperatorSummary] = useState('')
  const [fixSuggestions, setFixSuggestions] = useState<OpsFeedbackFixSuggestions | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const detail = await getOpsFeedbackDetail(getToken, id)
        if (cancelled) return
        setFeedback(detail.feedback)
        setSessionMessages(detail.sessionMessages)
        setStatus(detail.feedback.status)
        setOperatorNotes(detail.feedback.operatorNotes || '')
        setFixSuggestions(detail.fixSuggestions)
        const stagedUrls = Array.isArray(detail.feedback.stagedEnhancement?.sourceUrls)
          ? detail.feedback.stagedEnhancement?.sourceUrls as string[]
          : []
        const suggestedUrls = detail.fixSuggestions?.sourceUrls || []
        setSourceUrls([...new Set([...stagedUrls, ...suggestedUrls])].join('\n'))
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load feedback detail')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [getToken, id])

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!id) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await updateOpsFeedback(getToken, id, {
        status,
        operatorNotes
      })
      setFeedback(updated)
      setSuccess('Feedback updated.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update feedback')
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async () => {
    if (!id) return
    setActioning(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await actionOpsFeedback(getToken, id, {
        sourceUrls,
        status: feedback?.category === 'corpus_gap' ? 'staged_for_approval' : status,
        operatorNotes,
        operatorSummary: operatorSummary.trim() || null,
        actionType: sourceUrls.trim() ? 'queue_corpus_sources' : 'operator_review'
      })
      setFeedback(result.feedback)
      setStatus(result.feedback.status)
      setSuccess(
        result.queuedSources.length > 0
          ? `Queued ${result.queuedSources.length} source(s) for TaxGPT corpus ingest.`
          : 'Feedback marked for operator review.'
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not action feedback')
    } finally {
      setActioning(false)
    }
  }

  const handleKickoffFix = async () => {
    if (!id) return
    setFixing(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await kickoffOpsFeedbackFix(getToken, id, {
        sourceUrls,
        operatorNotes,
        operatorSummary: operatorSummary.trim() || null
      })
      setFeedback(result.feedback)
      setStatus(result.feedback.status)
      setSuccess(
        result.ingestResult.ingested > 0
          ? `Kickoff fix discovered ${result.discovered.sourceUrls.length} source(s), queued ${result.queuedSources.length}, and ingested ${result.ingestResult.ingested}.`
          : `Kickoff fix queued ${result.queuedSources.length} source(s) for TaxGPT corpus ingest.`
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not kick off feedback fix')
    } finally {
      setFixing(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!window.confirm('Delete this feedback permanently?')) return
    setSaving(true)
    setError(null)
    try {
      await deleteOpsFeedback(getToken, id)
      navigate('/portal/ops/feedback')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete feedback')
      setSaving(false)
    }
  }

  return (
    <>
      <SEO
        title="TaxGPT Feedback Detail | Platform Ops"
        description="Review and action a TaxGPT feedback item."
        canonical={`/portal/ops/feedback/${id || ''}`}
      />
      <ClientPortalShell>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-primary-dark">Feedback detail</h1>
              <p className="text-sm text-text-light mt-1">Inspect the submission, linked chat context, and action corpus improvements.</p>
            </div>
            <Link to="/portal/ops/feedback" className="text-sm text-accent font-medium hover:underline">Back to feedback list</Link>
          </div>

          {loading && <p className="text-sm text-text-light">Loading feedback...</p>}
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
          {success && <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">{success}</p>}

          {feedback && !loading && (
            <>
              <section className="rounded-lg border border-border bg-white p-4 shadow-sm space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <p><strong>Category:</strong> {feedback.category}</p>
                  <p><strong>Status:</strong> {formatStatus(feedback.status)}</p>
                  <p><strong>Submitted:</strong> {new Date(feedback.createdAt).toLocaleString()}</p>
                  <p><strong>Rating:</strong> {feedback.rating ?? '—'}</p>
                  <p><strong>User ID:</strong> <span className="font-mono text-xs">{feedback.userId}</span></p>
                  <p><strong>Workspace:</strong> {feedback.workspaceId || '—'}</p>
                </div>
                <div>
                  <p className="font-semibold text-primary-dark">{feedback.subject}</p>
                  <p className="mt-2 whitespace-pre-wrap">{feedback.message}</p>
                </div>
              </section>

              {sessionMessages.length > 0 && (
                <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
                  <h2 className="text-base font-semibold text-primary-dark mb-3">Linked chat session</h2>
                  <div className="space-y-3">
                    {sessionMessages.map((message) => (
                      <article key={message.id} className="border border-border rounded-md p-3 text-sm">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-medium capitalize">{message.role}</span>
                          <span className="text-xs text-text-light">{new Date(message.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.structuredResponse?.confidence != null && (
                          <p className="mt-2 text-xs text-text-light">
                            Confidence: {String(message.structuredResponse.confidence)}
                            {message.riskLevel ? ` · Risk: ${message.riskLevel}` : ''}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {fixSuggestions && (fixSuggestions.sourceUrls.length > 0 || fixSuggestions.publications.length > 0) && (
                <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
                  <h2 className="text-base font-semibold text-primary-dark mb-3">Suggested fix sources</h2>
                  {fixSuggestions.sourceUrls.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-text-light mb-2">Discovered from linked chat context and publication references:</p>
                      <ul className="text-xs font-mono space-y-1">
                        {fixSuggestions.sourceUrls.map((url) => (
                          <li key={url} className="break-all">{url}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {fixSuggestions.publications.length > 0 && (
                    <div className="overflow-x-auto border border-border rounded-md">
                      <table className="min-w-full text-sm">
                        <thead className="bg-background/70">
                          <tr>
                            <th className="text-left px-3 py-2">Publication</th>
                            <th className="text-left px-3 py-2">Corpus status</th>
                            <th className="text-left px-3 py-2">Title</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fixSuggestions.publications.map((publication) => (
                            <tr key={publication.code} className="border-t border-border">
                              <td className="px-3 py-2 font-medium">{publication.code}</td>
                              <td className="px-3 py-2">{publication.status}</td>
                              <td className="px-3 py-2">{publication.title || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              <form onSubmit={handleSave} className="rounded-lg border border-border bg-white p-4 shadow-sm space-y-4">
                <h2 className="text-base font-semibold text-primary-dark">Operator workflow</h2>
                <label className="block text-sm">
                  <span className="block mb-1 text-text-light">Status</span>
                  <select
                    className="w-full md:w-80 border border-border rounded-md px-3 py-2 bg-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OpsFeedbackStatus)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{formatStatus(option)}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="block mb-1 text-text-light">Operator notes</span>
                  <textarea
                    className="w-full border border-border rounded-md px-3 py-2 min-h-[100px]"
                    value={operatorNotes}
                    onChange={(e) => setOperatorNotes(e.target.value)}
                    placeholder="Internal notes for review and implementation tracking"
                  />
                </label>
                <label className="block text-sm">
                  <span className="block mb-1 text-text-light">CRA / CanLII source URLs to queue for ingest</span>
                  <textarea
                    className="w-full border border-border rounded-md px-3 py-2 min-h-[100px] font-mono text-xs"
                    value={sourceUrls}
                    onChange={(e) => setSourceUrls(e.target.value)}
                    placeholder="One HTTPS URL per line (canada.ca or canlii.org)"
                  />
                </label>
                <label className="block text-sm">
                  <span className="block mb-1 text-text-light">Action summary (optional)</span>
                  <input
                    className="w-full border border-border rounded-md px-3 py-2"
                    value={operatorSummary}
                    onChange={(e) => setOperatorSummary(e.target.value)}
                    placeholder="Short summary of what was actioned into TaxGPT"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving || actioning || fixing}
                    onClick={() => { void handleKickoffFix() }}
                    className="px-4 py-2 rounded-md bg-accent text-white text-sm disabled:opacity-60"
                  >
                    {fixing ? 'Kicking off fix...' : 'Kick off fix'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving || actioning || fixing}
                    className="px-4 py-2 rounded-md bg-primary-dark text-white text-sm disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    disabled={saving || actioning || fixing}
                    onClick={() => { void handleAction() }}
                    className="px-4 py-2 rounded-md border border-accent text-accent text-sm disabled:opacity-60"
                  >
                    {actioning ? 'Queueing...' : 'Queue listed sources'}
                  </button>
                  <button
                    type="button"
                    disabled={saving || actioning || fixing}
                    onClick={() => { void handleDelete() }}
                    className="px-4 py-2 rounded-md border border-red-300 text-red-700 text-sm disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-xs text-text-light">
                  Kick off fix auto-discovers CRA/CanLII sources from the linked chat session, queues them into `taxgpt.sources`,
                  and ingests up to 5 HTML sources immediately when `OPENAI_API_KEY` is configured.
                </p>
              </form>

              {feedback.stagedEnhancement && (
                <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
                  <h2 className="text-base font-semibold text-primary-dark mb-3">Staged enhancement</h2>
                  <pre className="text-xs overflow-x-auto bg-background rounded-md p-3">{JSON.stringify(feedback.stagedEnhancement, null, 2)}</pre>
                </section>
              )}
            </>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default FeedbackDetailOpsPage

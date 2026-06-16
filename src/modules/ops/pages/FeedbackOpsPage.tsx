import { FC, FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import ClientPortalShell from '../../../components/ClientPortalShell'
import SEO from '../../../components/SEO'
import { CountTable } from '../components/OpsSummaryCards'
import {
  getOpsFeedbackStats,
  kickoffOpsFeedbackFix,
  listOpsFeedback,
  updateOpsFeedback,
  type OpsFeedbackCategory,
  type OpsFeedbackListItem,
  type OpsFeedbackStats,
  type OpsFeedbackStatus
} from '../services'

const EDITABLE_STATUS_OPTIONS: OpsFeedbackStatus[] = [
  'submitted',
  'under_review',
  'staged_for_approval',
  'approved',
  'rejected',
  'implemented'
]

const STATUS_OPTIONS: Array<{ value: '' | OpsFeedbackStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'staged_for_approval', label: 'Staged for approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'implemented', label: 'Implemented' }
]

const CATEGORY_OPTIONS: Array<{ value: '' | OpsFeedbackCategory; label: string }> = [
  { value: '', label: 'All categories' },
  { value: 'feedback', label: 'General feedback' },
  { value: 'suggestion', label: 'Feature suggestion' },
  { value: 'answer_quality', label: 'Answer quality' },
  { value: 'corpus_gap', label: 'Corpus gap' }
]

function formatCategory (category: string) {
  return CATEGORY_OPTIONS.find((row) => row.value === category)?.label || category
}

function formatStatus (status: string) {
  return STATUS_OPTIONS.find((row) => row.value === status)?.label || status
}

const FeedbackOpsPage: FC = () => {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<OpsFeedbackStats | null>(null)
  const [items, setItems] = useState<OpsFeedbackListItem[]>([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<'' | OpsFeedbackStatus>('')
  const [category, setCategory] = useState<'' | OpsFeedbackCategory>('')
  const [query, setQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [rowActionId, setRowActionId] = useState<string | null>(null)
  const [rowMessage, setRowMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsResult, listResult] = await Promise.all([
        getOpsFeedbackStats(getToken),
        listOpsFeedback(getToken, {
          status: status || undefined,
          category: category || undefined,
          q: query || undefined,
          limit: 50
        })
      ])
      setStats(statsResult)
      setItems(listResult.items)
      setTotal(listResult.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load TaxGPT feedback')
    } finally {
      setLoading(false)
    }
  }, [getToken, status, category, query])

  useEffect(() => {
    void load()
  }, [load])

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setQuery(searchInput.trim())
  }

  const handleStatusChange = async (item: OpsFeedbackListItem, nextStatus: OpsFeedbackStatus) => {
    setRowActionId(item.id)
    setRowMessage(null)
    setError(null)
    try {
      const updated = await updateOpsFeedback(getToken, item.id, { status: nextStatus })
      setItems((current) => current.map((row) => (
        row.id === item.id ? { ...row, status: updated.status, updatedAt: updated.updatedAt } : row
      )))
      setRowMessage(`Updated status for "${item.subject}".`)
      const statsResult = await getOpsFeedbackStats(getToken)
      setStats(statsResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update feedback status')
    } finally {
      setRowActionId(null)
    }
  }

  const handleKickoffFix = async (item: OpsFeedbackListItem) => {
    setRowActionId(item.id)
    setRowMessage(null)
    setError(null)
    try {
      const result = await kickoffOpsFeedbackFix(getToken, item.id)
      setItems((current) => current.map((row) => (
        row.id === item.id ? { ...row, status: result.feedback.status, updatedAt: result.feedback.updatedAt } : row
      )))
      setRowMessage(
        result.ingestResult.ingested > 0
          ? `Kickoff fix ingested ${result.ingestResult.ingested} source(s) for "${item.subject}".`
          : `Kickoff fix queued ${result.queuedSources.length} source(s) for "${item.subject}".`
      )
      const statsResult = await getOpsFeedbackStats(getToken)
      setStats(statsResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not kick off feedback fix')
    } finally {
      setRowActionId(null)
    }
  }

  return (
    <>
      <SEO
        title="TaxGPT Feedback Ops | Platform Ops"
        description="Review and action TaxGPT user feedback."
        canonical="/portal/ops/feedback"
      />
      <ClientPortalShell>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-primary-dark">TaxGPT Feedback</h1>
              <p className="text-sm text-text-light mt-1">Review user feedback, inspect linked chat sessions, and queue corpus improvements.</p>
            </div>
            <Link to="/portal/ops" className="text-sm text-accent font-medium hover:underline">Back to ops home</Link>
          </div>

          {stats && (
            <section className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div className="border border-border rounded-md p-3"><strong>Total</strong><p>{stats.totals.total}</p></div>
              <div className="border border-border rounded-md p-3"><strong>Submitted</strong><p>{stats.totals.submitted}</p></div>
              <div className="border border-border rounded-md p-3"><strong>Under review</strong><p>{stats.totals.underReview}</p></div>
              <div className="border border-border rounded-md p-3"><strong>Staged</strong><p>{stats.totals.stagedForApproval}</p></div>
            </section>
          )}

          <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-end">
            <label className="text-sm">
              <span className="block mb-1 text-text-light">Status</span>
              <select
                className="border border-border rounded-md px-3 py-2 bg-white"
                value={status}
                onChange={(e) => setStatus(e.target.value as '' | OpsFeedbackStatus)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-text-light">Category</span>
              <select
                className="border border-border rounded-md px-3 py-2 bg-white"
                value={category}
                onChange={(e) => setCategory(e.target.value as '' | OpsFeedbackCategory)}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm grow min-w-[220px]">
              <span className="block mb-1 text-text-light">Search</span>
              <input
                className="w-full border border-border rounded-md px-3 py-2"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Subject or message"
              />
            </label>
            <button type="submit" className="px-4 py-2 rounded-md bg-accent text-white text-sm">Apply</button>
          </form>

          {loading && <p className="text-sm text-text-light">Loading feedback...</p>}
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
          {rowMessage && <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">{rowMessage}</p>}

          {!loading && !error && (
            <>
              <p className="text-sm text-text-light">{total} feedback item{total === 1 ? '' : 's'}</p>
              <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
                <div className="overflow-x-auto border border-border rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-background/70">
                      <tr>
                        <th className="text-left px-3 py-2">Submitted</th>
                        <th className="text-left px-3 py-2">Category</th>
                        <th className="text-left px-3 py-2">Subject</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-left px-3 py-2">Rating</th>
                        <th className="text-left px-3 py-2">Session</th>
                        <th className="text-left px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-6 text-center text-text-light">No feedback matches the current filters.</td>
                        </tr>
                      ) : items.map((item) => (
                        <tr key={item.id} className="border-t border-border hover:bg-background/40">
                          <td className="px-3 py-2 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                          <td className="px-3 py-2">{formatCategory(item.category)}</td>
                          <td className="px-3 py-2">
                            <Link to={`/portal/ops/feedback/${item.id}`} className="text-accent hover:underline font-medium">
                              {item.subject}
                            </Link>
                            <p className="text-xs text-text-light mt-1 line-clamp-2">{item.message}</p>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              className="border border-border rounded-md px-2 py-1 bg-white text-xs min-w-[150px]"
                              value={item.status}
                              disabled={rowActionId === item.id}
                              onChange={(e) => { void handleStatusChange(item, e.target.value as OpsFeedbackStatus) }}
                            >
                              {EDITABLE_STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>{formatStatus(option)}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">{item.rating ?? '—'}</td>
                          <td className="px-3 py-2">{item.sessionId ? 'Linked' : '—'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              type="button"
                              disabled={rowActionId === item.id}
                              onClick={() => { void handleKickoffFix(item) }}
                              className="px-3 py-1.5 rounded-md bg-accent text-white text-xs disabled:opacity-60"
                            >
                              {rowActionId === item.id ? 'Working...' : 'Kick off fix'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CountTable title="By status" rows={stats.byStatus} />
              <CountTable title="By category" rows={stats.byCategory} />
            </div>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default FeedbackOpsPage

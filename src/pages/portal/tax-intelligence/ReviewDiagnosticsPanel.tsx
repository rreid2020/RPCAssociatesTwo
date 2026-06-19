import { useEffect, useMemo, useState, type FC } from 'react'
import {
  taxFetch,
  type HouseholdReviewSnapshot,
  type TaxAdvisoryResponse
} from '../../../lib/taxIntelligenceApi'

type ReviewSubview = 'balance' | 'messages' | 'federal-summary' | 'tax-savings'

type Props = {
  taxReturnId: string
  taxYear: number
  getToken: () => Promise<string | null>
  onNavigateToField?: (reviewField: string, taxReturnId?: string) => void
  onReviewComplete?: () => void
}

const REVIEW_NAV: Array<{ id: ReviewSubview; label: string }> = [
  { id: 'balance', label: 'Balance Overview' },
  { id: 'messages', label: 'Messages' },
  { id: 'federal-summary', label: 'Federal Summary' },
  { id: 'tax-savings', label: 'Tax saving ideas' }
]

function formatMoney (value: number) {
  return `$${Number(value || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const ReviewDiagnosticsPanel: FC<Props> = ({
  taxReturnId,
  taxYear,
  getToken,
  onNavigateToField,
  onReviewComplete
}) => {
  const [activeSubview, setActiveSubview] = useState<ReviewSubview>('balance')
  const [review, setReview] = useState<HouseholdReviewSnapshot | null>(null)
  const [advisory, setAdvisory] = useState<TaxAdvisoryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const memberColumns = useMemo(
    () => (review?.members || []).map((member) => ({
      id: member.id,
      name: member.taxpayerName
    })),
    [review?.members]
  )

  const loadReview = async () => {
    if (!taxReturnId) return
    setLoading(true)
    setErr(null)
    try {
      const [reviewData, advisoryData] = await Promise.all([
        taxFetch<{ review: HouseholdReviewSnapshot }>(`/tax-returns/${taxReturnId}/review`, getToken, { method: 'POST' }),
        taxFetch<{ advisory: TaxAdvisoryResponse }>(`/tax-returns/${taxReturnId}/advisory`, getToken).catch(() => ({ advisory: null }))
      ])
      setReview(reviewData.review)
      setAdvisory(advisoryData.advisory)
      onReviewComplete?.()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not run household review')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxReturnId])

  const warnings = useMemo(
    () => (review?.messages || []).filter((msg) => msg.severity === 'warning' || msg.severity === 'error'),
    [review?.messages]
  )
  const infos = useMemo(
    () => (review?.messages || []).filter((msg) => msg.severity === 'info'),
    [review?.messages]
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4">
      <aside className="bg-white border border-border rounded-lg p-3 h-fit">
        <p className="text-xs font-semibold text-primary-dark mb-2">Contents</p>
        <div className="space-y-1">
          {REVIEW_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSubview(item.id)}
              className={`w-full text-left px-2 py-1.5 text-xs rounded-md border ${
                activeSubview === item.id
                  ? 'bg-primary-dark text-white border-primary-dark'
                  : 'bg-white text-text border-border hover:bg-background'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      <div className="space-y-4">
        {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{err}</p>}
        {loading && <p className="text-sm text-text-light">Calculating household balance overview…</p>}

        {!loading && review && activeSubview === 'balance' && (
          <section className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-background/40">
              <h3 className="text-lg font-semibold text-primary-dark">Balance Overview</h3>
              <p className="text-xs text-text-light mt-1">Federal balance estimates for each household workspace.</p>
            </div>
            <div className="px-4 py-3 border-b border-amber-400 bg-amber-50">
              <p className="text-sm font-semibold text-amber-900">{review.balanceOverview.headline}</p>
            </div>
            <div className="divide-y divide-border">
              {review.members.map((member) => {
                const owing = member.balance.amountDue > 0
                return (
                  <div key={member.id} className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="text-sm font-semibold text-primary-dark">{member.taxpayerName}</h4>
                      <button
                        type="button"
                        className="text-xs text-accent hover:underline"
                        onClick={() => setActiveSubview('federal-summary')}
                      >
                        Go to Summary
                      </button>
                    </div>
                    <div className="overflow-x-auto border border-border rounded-md">
                      <table className="min-w-full text-xs">
                        <thead className="bg-background/70">
                          <tr>
                            <th className="text-left px-3 py-2">Jurisdiction</th>
                            <th className="text-right px-3 py-2">Amount due</th>
                            <th className="text-right px-3 py-2">Refund</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-border">
                            <td className="px-3 py-2">Federal</td>
                            <td className="px-3 py-2 text-right">{owing ? formatMoney(member.balance.amountDue) : '—'}</td>
                            <td className="px-3 py-2 text-right">{!owing && member.balance.refund > 0 ? formatMoney(member.balance.refund) : (member.balance.refund === 0 && !owing ? formatMoney(0) : '—')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className={`mt-2 rounded-md px-3 py-2 text-right text-sm font-semibold ${owing ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'}`}>
                      {owing ? formatMoney(member.balance.amountDue) : formatMoney(member.balance.refund)}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {!loading && review && activeSubview === 'messages' && (
          <section className="bg-white border border-border rounded-lg shadow-sm p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary-dark">Messages</h3>
              <p className="text-sm text-text-light mt-1 border-b border-border pb-2">Please review this information carefully.</p>
              <p className="text-xs text-text-light mt-2">
                Click the Interview tab in the sidebar to change your data. Use Tax Return and NETFILE when you are ready to preview or file.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                <span className="text-red-600" aria-hidden>⚠</span>
                Warnings
              </h4>
              <p className="text-xs text-text-light mb-3">Please review the notes and warning messages below.</p>
              {warnings.length === 0 ? (
                <p className="text-sm text-text-light">No warnings at this time.</p>
              ) : (
                <div className="space-y-4">
                  {review.members.map((member) => {
                    const memberWarnings = warnings.filter((msg) => msg.taxReturnId === member.id)
                    if (memberWarnings.length === 0) return null
                    return (
                      <div key={`warnings-${member.id}`}>
                        <p className="text-sm font-semibold text-text mb-2">Warnings for: {member.taxpayerName}</p>
                        <ul className="space-y-2">
                          {memberWarnings.map((msg, idx) => (
                            <li key={`${member.id}-warning-${idx}`} className="text-sm text-text border border-border rounded-md p-3 bg-background/30">
                              <p className="font-semibold">› {msg.title}</p>
                              <p className="text-text-light mt-1">{msg.detail}</p>
                              {msg.reviewField && onNavigateToField && (
                                <button
                                  type="button"
                                  className="text-xs text-accent hover:underline mt-2"
                                  onClick={() => onNavigateToField(msg.reviewField || 'review', member.id)}
                                >
                                  Click here to review your data.
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {infos.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-primary-dark mb-2">Information</h4>
                <ul className="space-y-2">
                  {infos.map((msg, idx) => (
                    <li key={`info-${idx}`} className="text-sm text-text border border-border rounded-md p-3 bg-background/20">
                      <p className="font-semibold">{msg.taxpayerName ? `${msg.taxpayerName}: ` : ''}{msg.title}</p>
                      <p className="text-text-light mt-1">{msg.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {!loading && review && activeSubview === 'federal-summary' && (
          <section className="bg-white border border-border rounded-lg shadow-sm p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary-dark">Federal Summary</h3>
              <p className="text-sm text-text-light mt-1 border-b border-border pb-2">
                This is a summary of your {taxYear} federal return.
              </p>
            </div>
            {review.federalSummaryColumns.map((section) => (
              <div key={section.id} className="space-y-2">
                <h4 className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                  <span className="text-red-600" aria-hidden>🍁</span>
                  {section.title}
                </h4>
                <div className="overflow-x-auto border border-border rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-background/70">
                      <tr>
                        <th className="text-left px-3 py-2 w-20">Line</th>
                        <th className="text-left px-3 py-2">Description</th>
                        {memberColumns.map((member) => (
                          <th key={member.id} className="text-right px-3 py-2 whitespace-nowrap">{member.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.lines.map((line) => (
                        <tr
                          key={`${section.id}-${line.lineRef}-${line.label}`}
                          className={`border-t border-border ${['15000', '23600', '26000', '42000', '38200', '43500', '48400', '48500'].includes(line.lineRef) ? 'bg-background/40 font-semibold' : ''}`}
                        >
                          <td className="px-3 py-2 text-accent font-medium">{line.lineRef}</td>
                          <td className="px-3 py-2">{line.label}</td>
                          {memberColumns.map((member) => (
                            <td key={`${line.lineRef}-${member.id}`} className="px-3 py-2 text-right tabular-nums">
                              {formatMoney(line.amounts[member.id] || 0)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        )}

        {!loading && activeSubview === 'tax-savings' && (
          <section className="bg-white border border-border rounded-lg shadow-sm p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary-dark">Tax-saving ideas</h3>
              <p className="text-sm text-text-light mt-1 border-b border-border pb-2">
                {advisory?.status === 'AI'
                  ? 'AI-generated tax advice tailored to this return.'
                  : 'Tax advice tailored to your situation based on return data and interview topics.'}
              </p>
              {advisory?.notes?.map((note) => (
                <p key={note} className="text-xs text-text-light mt-2">{note}</p>
              ))}
            </div>
            {(advisory?.ideas || []).length === 0 ? (
              <p className="text-sm text-text-light">No tax-saving ideas are available yet.</p>
            ) : (
              <div className="space-y-4">
                {advisory?.ideas.map((idea) => (
                  <article key={idea.id} className="border border-border rounded-md p-4 bg-background/20">
                    <h4 className="text-sm font-semibold text-primary-dark flex items-center gap-2">
                      <span className="text-green-700" aria-hidden>💡</span>
                      {idea.title}
                    </h4>
                    <p className="text-sm text-text mt-2">{idea.summary}</p>
                    {idea.actions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs italic text-text-light">What would you like to do?</p>
                        <ul className="mt-2 space-y-1">
                          {idea.actions.map((action) => (
                            <li key={`${idea.id}-${action.label}`}>
                              {action.href ? (
                                <a href={action.href} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
                                  {action.label}
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  className="text-sm text-accent hover:underline"
                                  onClick={() => onNavigateToField?.(action.reviewField || 'review', taxReturnId)}
                                >
                                  {action.label}
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {!loading && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={() => { void loadReview() }} disabled={loading}>
              Refresh review
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewDiagnosticsPanel

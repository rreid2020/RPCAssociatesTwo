import { useEffect, useMemo, useState, type FC } from 'react'
import {
  taxFetch,
  type ReturnInterviewTopicsResponse
} from '../../../lib/taxIntelligenceApi'

type Props = {
  taxReturnId: string
  taxpayerName: string
  getToken: () => Promise<string | null>
  onSaved?: (response: ReturnInterviewTopicsResponse) => void
}

const InterviewTopicsSetup: FC<Props> = ({ taxReturnId, taxpayerName, getToken, onSaved }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [data, setData] = useState<ReturnInterviewTopicsResponse | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const load = async () => {
    if (!taxReturnId) return
    setLoading(true)
    setErr(null)
    try {
      const response = await taxFetch<ReturnInterviewTopicsResponse>(
        `/tax-returns/${taxReturnId}/interview-topics`,
        getToken
      )
      setData(response)
      setSelected(new Set(response.selectedTopicIds || []))
      setExpanded(Object.fromEntries((response.categories || []).map((c) => [c.id, true])))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load interview setup')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [taxReturnId])

  const selectedCount = selected.size
  const resolvedSlipCount = useMemo(() => data?.resolvedSlipCodes?.length || 0, [data])
  const resolvedFormCount = useMemo(() => data?.resolvedFormCodes?.length || 0, [data])

  const toggleTopic = (topicId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(topicId)) next.delete(topicId)
      else next.add(topicId)
      return next
    })
    setSavedMsg(null)
  }

  const toggleCategory = (categoryId: string, topicIds: string[]) => {
    setExpanded((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }))
  }

  const save = async () => {
    if (!taxReturnId) return
    setSaving(true)
    setErr(null)
    setSavedMsg(null)
    try {
      const response = await taxFetch<ReturnInterviewTopicsResponse>(
        `/tax-returns/${taxReturnId}/interview-topics`,
        getToken,
        {
          method: 'PUT',
          body: JSON.stringify({ selectedTopicIds: Array.from(selected) })
        }
      )
      setData(response)
      setSelected(new Set(response.selectedTopicIds || []))
      setSavedMsg(`Saved tax situation for ${taxpayerName || 'this taxpayer'}.`)
      onSaved?.(response)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save interview setup')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-text-light">Loading tax situation setup…</p>
  }

  return (
    <div id="rb-tax-situation" className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-primary-dark">Tax situation setup</h3>
        <p className="text-xs text-text-light mt-1">
          Select everything that may apply to <strong className="text-text">{taxpayerName || 'this taxpayer'}</strong>.
          If you are not sure whether a topic applies, select it anyway — you can clear it later.
        </p>
        <p className="text-xs text-text-light mt-1">
          Complete this checklist on <strong>each household workspace tab</strong> (primary, spouse, dependant) before entering slips.
        </p>
      </div>

      {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{err}</p>}
      {savedMsg && <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">{savedMsg}</p>}

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded border border-border bg-background px-2 py-1">{selectedCount} topic(s) selected</span>
        <span className="rounded border border-border bg-background px-2 py-1">{resolvedSlipCount} slip type(s)</span>
        <span className="rounded border border-border bg-background px-2 py-1">{resolvedFormCount} form/schedule(s)</span>
      </div>

      <div className="space-y-3">
        {(data?.categories || []).map((category) => {
          const isOpen = expanded[category.id] !== false
          const categorySelected = category.topics.filter((t) => selected.has(t.id)).length
          return (
            <article key={category.id} className="border border-border rounded-md overflow-hidden bg-white">
              <button
                type="button"
                className="w-full flex items-stretch text-left"
                onClick={() => toggleCategory(category.id, category.topics.map((t) => t.id))}
                aria-expanded={isOpen}
              >
                <div className="w-14 shrink-0 bg-primary-dark text-white flex items-center justify-center text-[11px] font-bold tracking-wide">
                  {category.icon}
                </div>
                <div className="flex-1 px-3 py-2 border-l border-border">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-primary-dark">{category.title}</p>
                    <span className="text-[11px] text-text-light">{isOpen ? 'Hide' : 'Show'} · {categorySelected}/{category.topics.length}</span>
                  </div>
                  <p className="text-xs text-text-light mt-0.5">{category.summary}</p>
                </div>
              </button>
              {isOpen && (
                <ul className="divide-y divide-border border-t border-border">
                  {category.topics.map((topic) => {
                    const checked = selected.has(topic.id)
                    const refs = [
                      ...(topic.slipCodes || []).map((c) => c),
                      ...(topic.formCodes || []).map((c) => c)
                    ].filter(Boolean)
                    return (
                      <li key={topic.id} className="flex items-start gap-3 px-3 py-2 hover:bg-background/60">
                        <input
                          id={`topic-${topic.id}`}
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          onChange={() => toggleTopic(topic.id)}
                        />
                        <label htmlFor={`topic-${topic.id}`} className="flex-1 cursor-pointer">
                          <span className="text-sm text-text">{topic.label}</span>
                          {refs.length > 0 && (
                            <span className="ml-2 text-[11px] text-text-light">({refs.join(', ')})</span>
                          )}
                          <span
                            className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] text-text-light"
                            title={topic.description}
                            aria-label={topic.description}
                          >
                            i
                          </span>
                          <p className="text-xs text-text-light mt-0.5">{topic.description}</p>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </article>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="button" className="btn btn--primary text-sm px-4 py-2" onClick={() => { void save() }} disabled={saving}>
          {saving ? 'Saving…' : 'Save tax situation'}
        </button>
        <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={() => { void load() }} disabled={saving || loading}>
          Reset
        </button>
      </div>
    </div>
  )
}

export default InterviewTopicsSetup

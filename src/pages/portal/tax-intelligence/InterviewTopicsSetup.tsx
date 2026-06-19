import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import {
  taxFetch,
  type ReturnInterviewTopicsResponse
} from '../../../lib/taxIntelligenceApi'

export type InterviewTopicsSetupHandle = {
  save: () => Promise<boolean>
}

type Props = {
  taxReturnId: string
  taxpayerName: string
  getToken: () => Promise<string | null>
  onSaved?: (response: ReturnInterviewTopicsResponse) => void
}

const CATEGORY_ICONS: Record<string, string> = {
  specific_situations: '👥',
  employment: '💼',
  pension: '🪙',
  rental: '🏠',
  investment: '📈',
  self_employment: '🧑‍💼',
  student: '🎓',
  deductions: '✂️',
  family: '👨‍👩‍👧',
  instalments: '🔄',
  other: '📁',
  carryforward: '↩️'
}

const InterviewTopicsSetup = forwardRef<InterviewTopicsSetupHandle, Props>(({ taxReturnId, taxpayerName, getToken, onSaved }, ref) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [data, setData] = useState<ReturnInterviewTopicsResponse | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

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

  const save = async (): Promise<boolean> => {
    if (!taxReturnId) return true
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
      setSavedMsg(`Saved interview setup for ${taxpayerName || 'this taxpayer'}.`)
      onSaved?.(response)
      return true
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save interview setup')
      return false
    } finally {
      setSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({ save }), [taxReturnId, selected, taxpayerName, getToken, onSaved])

  if (loading) {
    return <p className="text-sm text-text-light">Loading interview setup…</p>
  }

  return (
    <div id="rb-tax-situation" className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-primary-dark">Interview setup</h2>
        <p className="text-sm text-text-light mt-2">
          Tick any boxes which apply to <strong className="text-text">{taxpayerName || 'this taxpayer'}</strong>.
          Complete this checklist on each household workspace tab before entering slips.
        </p>
      </div>

      <div className="rounded-md border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <p>
          <span className="font-semibold">Tip:</span> If you are not sure whether you need a form or slip, tick the topic anyway — you can clear it later. Your selections drive suggested slips and required CRA forms on Review.
        </p>
      </div>

      {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{err}</p>}
      {savedMsg && <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">{savedMsg}</p>}

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded border border-border bg-background px-2 py-1">{selectedCount} topic(s) selected</span>
        <span className="rounded border border-border bg-background px-2 py-1">{resolvedSlipCount} slip type(s)</span>
        <span className="rounded border border-border bg-background px-2 py-1">{resolvedFormCount} form/schedule(s)</span>
      </div>

      <div className="space-y-0 border border-border rounded-md overflow-hidden bg-white shadow-sm">
        {(data?.categories || []).map((category) => {
          const icon = CATEGORY_ICONS[category.id] || category.icon
          const categorySelected = category.topics.filter((t) => selected.has(t.id)).length
          return (
            <article key={category.id} className="border-b border-border last:border-b-0">
              <div className="flex items-stretch">
                <div className="w-20 md:w-24 shrink-0 bg-primary-dark text-white flex flex-col items-center justify-center px-2 py-4 text-center">
                  <span className="text-2xl leading-none" aria-hidden>{icon}</span>
                  <span className="mt-2 text-[10px] font-semibold uppercase tracking-wide leading-tight">{category.title}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="px-3 py-2 border-b border-border bg-background/40">
                    <p className="text-xs text-text-light">{category.summary}</p>
                    <p className="text-[11px] text-text-light mt-0.5">{categorySelected} of {category.topics.length} selected</p>
                  </div>
                  <ul className="divide-y divide-border">
                    {category.topics.map((topic) => {
                      const checked = selected.has(topic.id)
                      const refs = [
                        ...(topic.slipCodes || []).map((c) => c),
                        ...(topic.formCodes || []).map((c) => c)
                      ].filter(Boolean)
                      return (
                        <li key={topic.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-background/50">
                          <input
                            id={`topic-${topic.id}`}
                            type="checkbox"
                            className="mt-1 h-4 w-4"
                            checked={checked}
                            onChange={() => toggleTopic(topic.id)}
                          />
                          <label htmlFor={`topic-${topic.id}`} className="flex-1 cursor-pointer min-w-0">
                            <span className="text-sm text-text font-medium">{topic.label}</span>
                            {refs.length > 0 && (
                              <span className="ml-2 text-[11px] text-text-light">({refs.join(', ')})</span>
                            )}
                            <button
                              type="button"
                              className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] text-text-light align-middle"
                              title={topic.description}
                              aria-label={topic.description}
                              onClick={(e) => e.preventDefault()}
                            >
                              i
                            </button>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="button" className="btn btn--primary text-sm px-4 py-2" onClick={() => { void save() }} disabled={saving}>
          {saving ? 'Saving…' : 'Save interview setup'}
        </button>
        <button type="button" className="btn btn--secondary text-sm px-3 py-2" onClick={() => { void load() }} disabled={saving || loading}>
          Reset
        </button>
      </div>
    </div>
  )
})

InterviewTopicsSetup.displayName = 'InterviewTopicsSetup'

export default InterviewTopicsSetup

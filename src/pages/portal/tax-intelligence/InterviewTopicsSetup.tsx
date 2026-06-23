import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import {
  taxFetch,
  type InterviewTopicCategory,
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
  other_income: '💵',
  other_t_slips: '📄',
  employment: '💼',
  pension: '🪙',
  rental: '🏠',
  investment: '📈',
  self_employment: '🧑‍💼',
  student: '🎓',
  deductions: '✂️',
  retirement_plans: '🏦',
  family: '👨‍👩‍👧',
  instalments: '🔄',
  other: '📁',
  carryforward: '↩️'
}

function categorySelectedCount (category: InterviewTopicCategory, selected: Set<string>): number {
  return category.topics.filter((topic) => selected.has(topic.id)).length
}

const InterviewTopicsSetup = forwardRef<InterviewTopicsSetupHandle, Props>(({ taxReturnId, taxpayerName, getToken, onSaved }, ref) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [data, setData] = useState<ReturnInterviewTopicsResponse | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

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
      setActiveCategoryId((current) => {
        const categories = response.categories || []
        if (current && categories.some((c) => c.id === current)) return current
        return categories[0]?.id || null
      })
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

  const categories = data?.categories || []
  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) || categories[0] || null,
    [categories, activeCategoryId]
  )

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
          Select a section tab, then tick any items that apply to <strong className="text-text">{taxpayerName || 'this taxpayer'}</strong>.
          Complete this checklist on each household workspace before entering slips.
        </p>
      </div>

      <div className="rounded-md border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <p>
          <span className="font-semibold">Tip:</span> Use the section tabs to browse topics. If you are not sure whether you need a form or slip, tick the topic anyway — you can clear it later. Selections drive suggested slips and required CRA forms on Review.
        </p>
      </div>

      {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{err}</p>}
      {savedMsg && <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">{savedMsg}</p>}

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded border border-border bg-background px-2 py-1">{selectedCount} topic(s) selected</span>
        <span className="rounded border border-border bg-background px-2 py-1">{resolvedSlipCount} slip type(s)</span>
        <span className="rounded border border-border bg-background px-2 py-1">{resolvedFormCount} form/schedule(s)</span>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-text-light">No interview sections are available.</p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden bg-white shadow-sm">
          <div
            className="flex gap-1 overflow-x-auto border-b border-border bg-background/60 p-2 md:hidden"
            role="tablist"
            aria-label="Interview sections"
          >
            {categories.map((category) => {
              const icon = CATEGORY_ICONS[category.id] || category.icon
              const count = categorySelectedCount(category, selected)
              const isActive = activeCategory?.id === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`interview-panel-${category.id}`}
                  id={`interview-tab-${category.id}`}
                  className={`shrink-0 rounded-md px-3 py-2 text-left text-xs transition-colors ${
                    isActive
                      ? 'bg-primary-dark text-white'
                      : 'border border-border bg-white text-text hover:bg-background'
                  }`}
                  onClick={() => setActiveCategoryId(category.id)}
                >
                  <span className="mr-1" aria-hidden>{icon}</span>
                  <span className="font-medium">{category.title}</span>
                  {count > 0 && (
                    <span className={`ml-1.5 rounded px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/20' : 'bg-primary-dark/10 text-primary-dark'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col md:flex-row md:items-stretch">
            <nav
              className="hidden md:flex md:w-56 lg:w-64 shrink-0 flex-col border-b md:border-b-0 md:border-r border-border bg-background/30"
              role="tablist"
              aria-label="Interview sections"
            >
              {categories.map((category) => {
                const icon = CATEGORY_ICONS[category.id] || category.icon
                const count = categorySelectedCount(category, selected)
                const isActive = activeCategory?.id === category.id
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`interview-panel-${category.id}`}
                    id={`interview-tab-${category.id}`}
                    className={`flex items-start gap-2 border-b border-border/70 px-3 py-3 text-left text-sm transition-colors last:border-b-0 ${
                      isActive
                        ? 'bg-primary-dark text-white'
                        : 'text-text hover:bg-white'
                    }`}
                    onClick={() => setActiveCategoryId(category.id)}
                  >
                    <span className="text-lg leading-none mt-0.5 shrink-0" aria-hidden>{icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug">{category.title}</span>
                      <span className={`mt-0.5 block text-[11px] leading-tight ${isActive ? 'text-white/80' : 'text-text-light'}`}>
                        {count} of {category.topics.length} selected
                      </span>
                    </span>
                  </button>
                )
              })}
            </nav>

            {activeCategory && (
              <section
                key={activeCategory.id}
                id={`interview-panel-${activeCategory.id}`}
                role="tabpanel"
                aria-labelledby={`interview-tab-${activeCategory.id}`}
                className="flex-1 min-w-0"
              >
                <div className="flex items-stretch min-h-[12rem]">
                  <div className="hidden sm:flex w-20 lg:w-24 shrink-0 bg-primary-dark text-white flex-col items-center justify-center px-2 py-6 text-center">
                    <span className="text-2xl leading-none" aria-hidden>
                      {CATEGORY_ICONS[activeCategory.id] || activeCategory.icon}
                    </span>
                    <span className="mt-2 text-[10px] font-semibold uppercase tracking-wide leading-tight">
                      {activeCategory.title}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="px-3 py-3 border-b border-border bg-background/40">
                      <p className="text-sm text-text">{activeCategory.summary}</p>
                      <p className="text-[11px] text-text-light mt-1">
                        {categorySelectedCount(activeCategory, selected)} of {activeCategory.topics.length} selected in this section
                      </p>
                    </div>
                    <ul className="divide-y divide-border">
                      {activeCategory.topics.map((topic) => {
                        const checked = selected.has(topic.id)
                        const refs = [
                          ...(topic.slipCodes || []),
                          ...(topic.formCodes || [])
                        ].filter(Boolean)
                        return (
                          <li key={topic.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-background/50">
                            <input
                              id={`topic-${topic.id}`}
                              type="checkbox"
                              className="mt-1 h-4 w-4 shrink-0"
                              checked={checked}
                              onChange={() => toggleTopic(topic.id)}
                            />
                            <label htmlFor={`topic-${topic.id}`} className="flex-1 cursor-pointer min-w-0">
                              <span className="text-sm text-text font-medium">{topic.label}</span>
                              {refs.length > 0 && (
                                <span className="ml-2 text-[11px] text-text-light">({refs.join(', ')})</span>
                              )}
                            </label>
                            <button
                              type="button"
                              className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] text-text-light hover:bg-background"
                              title={topic.description}
                              aria-label={topic.description}
                            >
                              ?
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      )}

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

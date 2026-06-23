import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import {
  taxFetch,
  type InterviewTopicCategory,
  type InterviewTopicItem,
  type ReturnInterviewTopicsResponse
} from '../../../lib/taxIntelligenceApi'
import {
  interviewTopicNavigationLabel,
  resolveInterviewTopicNavigation
} from './interviewTopicNavigation'
import { topicArtifactDisplayCodes } from './interviewArtifactSections'
import { HorizontalScrollTabBar } from './HorizontalScrollTabBar'

export type InterviewTopicsSetupHandle = {
  save: () => Promise<boolean>
  saveSelection: (selectedTopicIds: string[]) => Promise<boolean>
}

type Props = {
  taxReturnId: string
  taxpayerName: string
  getToken: () => Promise<string | null>
  onSaved?: (response: ReturnInterviewTopicsResponse) => void
  onNavigateTopic?: (topic: InterviewTopicItem, selectedTopicIds: string[]) => Promise<void>
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

const InterviewTopicsSetup = forwardRef<InterviewTopicsSetupHandle, Props>(({ taxReturnId, taxpayerName, getToken, onSaved, onNavigateTopic }, ref) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [navigatingTopicId, setNavigatingTopicId] = useState<string | null>(null)
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

  const saveSelection = async (selectedTopicIds: string[]): Promise<boolean> => {
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
          body: JSON.stringify({ selectedTopicIds })
        }
      )
      setData(response)
      setSelected(new Set(response.selectedTopicIds || []))
      onSaved?.(response)
      return true
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save interview setup')
      return false
    } finally {
      setSaving(false)
    }
  }

  const save = async (): Promise<boolean> => saveSelection(Array.from(selected))

  const openTopic = async (topic: InterviewTopicItem) => {
    if (!onNavigateTopic) return
    const nextSelected = new Set(selected)
    if (!nextSelected.has(topic.id)) nextSelected.add(topic.id)
    setSelected(nextSelected)
    setSavedMsg(null)
    setNavigatingTopicId(topic.id)
    try {
      await onNavigateTopic(topic, Array.from(nextSelected))
    } finally {
      setNavigatingTopicId(null)
    }
  }

  useImperativeHandle(ref, () => ({ save, saveSelection }), [taxReturnId, selected, getToken, onSaved])

  if (loading) {
    return <p className="text-sm text-text-light">Loading interview setup…</p>
  }

  return (
    <div id="rb-tax-situation" className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-primary-dark">Interview setup</h2>
        <p className="text-sm text-text-light mt-2">
          Select a section tab, then tick items that apply to <strong className="text-text">{taxpayerName || 'this taxpayer'}</strong> or use the arrow to open setup or data entry for that topic.
        </p>
      </div>

      <div className="rounded-md border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <p>
          <span className="font-semibold">Tip:</span> Use the section tabs to browse topics. Tick a box to include it in this return, or click the arrow to jump to the matching setup screen or data entry page. Selections drive suggested slips and required CRA forms on Review.
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
          <HorizontalScrollTabBar
            tabs={categories.map((category) => ({
              id: category.id,
              title: category.title,
              icon: CATEGORY_ICONS[category.id] || category.icon,
              meta: `${categorySelectedCount(category, selected)} of ${category.topics.length} selected`
            }))}
            activeId={activeCategory?.id || null}
            onChange={setActiveCategoryId}
            ariaLabel="Interview sections"
          />

          {activeCategory && (
            <section
              key={activeCategory.id}
              id={`interview-panel-${activeCategory.id}`}
              role="tabpanel"
              aria-labelledby={`interview-tab-${activeCategory.id}`}
              className="w-full min-w-0"
            >
              <div className="border-b border-border bg-background/40 px-4 py-3">
                <p className="text-sm text-text">{activeCategory.summary}</p>
                <p className="mt-1 text-[11px] text-text-light">
                  {categorySelectedCount(activeCategory, selected)} of {activeCategory.topics.length} selected in this section
                </p>
              </div>
              <ul className="divide-y divide-border">
                {activeCategory.topics.map((topic) => {
                  const checked = selected.has(topic.id)
                  const refs = topicArtifactDisplayCodes({
                    topicId: topic.id,
                    slipCodes: topic.slipCodes || [],
                    formCodes: topic.formCodes || []
                  })
                  const navTarget = resolveInterviewTopicNavigation(topic)
                  const navLabel = interviewTopicNavigationLabel(navTarget)
                  const isNavigating = navigatingTopicId === topic.id
                  return (
                    <li key={topic.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-background/50">
                      <input
                        id={`topic-${topic.id}`}
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0"
                        checked={checked}
                        onChange={() => toggleTopic(topic.id)}
                        disabled={saving || isNavigating}
                      />
                      <label htmlFor={`topic-${topic.id}`} className="flex-1 cursor-pointer min-w-0">
                        <span className="text-sm text-text font-medium">{topic.label}</span>
                        {refs.length > 0 && (
                          <span className="ml-2 text-[11px] text-text-light">({refs.join(', ')})</span>
                        )}
                      </label>
                      {onNavigateTopic && (
                        <button
                          type="button"
                          className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-dark text-white hover:bg-primary-dark/90 disabled:opacity-60"
                          title={navLabel}
                          aria-label={navLabel}
                          onClick={() => { void openTopic(topic) }}
                          disabled={saving || isNavigating}
                        >
                          <span className="text-sm leading-none" aria-hidden>→</span>
                        </button>
                      )}
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
            </section>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="button" className="btn btn--primary text-sm px-4 py-2" onClick={() => { void save().then((ok) => { if (ok) setSavedMsg(`Saved interview setup for ${taxpayerName || 'this taxpayer'}.`) }) }} disabled={saving}>
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

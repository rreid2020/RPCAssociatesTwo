import { FC, useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import { useFeatureAccess } from '../../lib/subscriptions/hooks'
import UpgradePrompt from '../../components/UpgradePrompt'
import { portalFetch } from '../../lib/portalApi'

type ChecklistItem = { id: string; label: string; done: boolean; sort_order: number }
type Checklist = { id: string; name: string; items: ChecklistItem[] }

const defaultYearEnd = ['T2 / corporate return', 'Year-end financial statements', 'Adjusting entries reviewed', 'Notice of assessment on file']

const WorkingPapers: FC = () => {
  const hasAccess = useFeatureAccess('workingPapers')
  const { getToken } = useAuth()
  const [lists, setLists] = useState<Checklist[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [name, setName] = useState('Year-end package')

  const load = useCallback(async () => {
    if (!hasAccess) return
    setErr(null)
    setLoading(true)
    try {
      const { checklists } = await portalFetch<{ checklists: Checklist[] }>('/v1/checklists', getToken)
      setLists(checklists)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [getToken, hasAccess])

  useEffect(() => {
    void load()
  }, [load])

  const addDefaultChecklist = async () => {
    setErr(null)
    setSaving('new')
    try {
      await portalFetch('/v1/checklists', getToken, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() || 'Checklist', items: defaultYearEnd })
      })
      setName('Year-end package')
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create checklist')
    } finally {
      setSaving(null)
    }
  }

  const toggle = async (itemId: string, done: boolean) => {
    setErr(null)
    setSaving(itemId)
    try {
      await portalFetch('/v1/checklists/items/' + itemId, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ done: !done })
      })
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <SEO
        title="Working Papers | Client Portal"
        description="Centralized collaboration on workpapers and checklists in the Axiom Client Portal."
        canonical="/portal/working-papers"
      />
      <ClientPortalShell>
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-3xl font-bold text-primary-dark">Working Papers</h1>
            {!hasAccess && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                Premium
              </span>
            )}
          </div>

          {!hasAccess ? (
            <UpgradePrompt feature="Working Papers" />
          ) : (
            <div className="space-y-6">
              {err && <p className="text-sm text-red-700" role="alert">{err}</p>}

              <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                <h2 className="text-lg font-semibold text-primary-dark mb-2">Add a checklist</h2>
                <p className="text-sm text-text-light mb-4">
                  Shared checklists help you and the Axiom team track what is done for a filing or project. The dashboard count reflects how many checklists you have in progress.
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label className="block text-xs text-text-light mb-1" htmlFor="cl-name">Name</label>
                    <input
                      id="cl-name"
                      className="border border-border rounded-md px-3 py-2 text-sm w-64 max-w-full"
                      value={name}
                      onChange={(e) => { setName(e.target.value) }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn--primary text-sm py-2 px-4"
                    disabled={saving === 'new'}
                    onClick={() => { void addDefaultChecklist() }}
                  >
                    {saving === 'new' ? 'Creating…' : 'Create with year-end items'}
                  </button>
                </div>
              </div>

              {loading && <p className="text-text-light">Loading&hellip;</p>}

              {!loading && lists.length === 0 && !err && (
                <p className="text-text-light">No checklists yet. Create one to get started.</p>
              )}

              {lists.map((c) => (
                <div key={c.id} className="bg-white p-6 rounded-lg border border-border shadow-sm">
                  <h3 className="text-md font-semibold text-primary-dark mb-4">{c.name}</h3>
                  <ul className="space-y-2">
                    {c.items.map((i) => (
                      <li key={i.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={i.done}
                          disabled={saving === i.id}
                          onChange={() => { void toggle(i.id, i.done) }}
                        />
                        <span className={i.done ? 'text-text-light line-through' : 'text-text'}>{i.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default WorkingPapers

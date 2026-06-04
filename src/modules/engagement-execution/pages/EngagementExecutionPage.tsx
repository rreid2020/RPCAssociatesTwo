import { FC, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageLoadingSkeleton from '../../../shared/loading/PageLoadingSkeleton'
import ChecklistExecutionGrid from '../components/ChecklistExecutionGrid'
import ProcedureExecutionGrid from '../components/ProcedureExecutionGrid'
import {
  EXECUTION_PHASES,
  applyExecutionTemplate,
  fetchExecutionSnapshot,
  patchChecklistItem,
  patchExecutionPhase,
  patchProcedure,
  refreshExecutionMetrics,
  signoffProcedure,
  type ExecutionPhase,
  type ExecutionSnapshot
} from '../services/executionApi'

type EngagementExecutionPageProps = {
  getToken: () => Promise<string | null>
}

function formatPhaseLabel (phase: string) {
  return String(phase || 'planning').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const EngagementExecutionPage: FC<EngagementExecutionPageProps> = ({ getToken }) => {
  const { engagementId = '' } = useParams()
  const [snapshot, setSnapshot] = useState<ExecutionSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!engagementId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchExecutionSnapshot(engagementId, getToken)
      setSnapshot(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load engagement execution')
      setSnapshot(null)
    } finally {
      setLoading(false)
    }
  }, [engagementId, getToken])

  useEffect(() => {
    void load()
  }, [load])

  const handlePhaseChange = async (executionPhase: ExecutionPhase) => {
    if (!engagementId) return
    setSaving(true)
    setError(null)
    try {
      await patchExecutionPhase(engagementId, getToken, executionPhase)
      setNotice(`Execution phase updated to ${formatPhaseLabel(executionPhase)}.`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update phase')
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = async (autoApply = false) => {
    if (!engagementId) return
    setSaving(true)
    setError(null)
    try {
      await refreshExecutionMetrics(engagementId, getToken, autoApply)
      setNotice(autoApply ? 'Metrics refreshed and suggested phase applied.' : 'Execution metrics refreshed.')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not refresh metrics')
    } finally {
      setSaving(false)
    }
  }

  const handleApplyTemplate = async () => {
    if (!engagementId) return
    setSaving(true)
    setError(null)
    try {
      const result = await applyExecutionTemplate(engagementId, getToken, snapshot?.checklistItems.length === 0)
      if (result && typeof result === 'object' && 'applied' in result && !result.applied) {
        setNotice('Template already applied for this engagement.')
      } else {
        setNotice('Execution template applied.')
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not apply template')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <PageLoadingSkeleton variant="table" />
  }

  if (!snapshot) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || 'Engagement execution could not be loaded.'}
      </div>
    )
  }

  const basePath = `/portal/accounting/working-papers/engagements/${engagementId}`
  const metrics = snapshot.metrics

  return (
    <div className="space-y-4 pb-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {notice}
        </div>
      )}

      <div className="rounded-lg border border-border bg-background p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text">{snapshot.engagement.name}</h2>
            <p className="text-sm text-text-light mt-1">
              Execution phase: <span className="font-medium text-text">{formatPhaseLabel(snapshot.engagement.execution_phase)}</span>
              {' · '}
              {Number(snapshot.engagement.execution_completion_pct || 0).toFixed(0)}% complete
            </p>
            <p className="text-xs text-text-light mt-1">
              Legacy status ({snapshot.engagement.status}) and review flow ({snapshot.engagement.review_flow_status}) are unchanged.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn--secondary text-sm py-2 px-3 disabled:opacity-50"
              disabled={saving}
              onClick={() => { void handleRefresh(false) }}
            >
              Refresh metrics
            </button>
            <button
              type="button"
              className="btn btn--secondary text-sm py-2 px-3 disabled:opacity-50"
              disabled={saving}
              onClick={() => { void handleRefresh(true) }}
            >
              Apply suggested phase
            </button>
            <button
              type="button"
              className="btn btn--primary text-sm py-2 px-3 disabled:opacity-50"
              disabled={saving}
              onClick={() => { void handleApplyTemplate() }}
            >
              Apply template
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-xs text-text-light">Checklist progress</p>
            <p className="text-lg font-semibold">{metrics.checklist_done}/{metrics.checklist_total}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-xs text-text-light">Procedures approved</p>
            <p className="text-lg font-semibold">{metrics.procedure_approved}/{metrics.procedure_total}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-xs text-text-light">Open review notes</p>
            <p className="text-lg font-semibold">{metrics.open_review_notes}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-xs text-text-light">Suggested phase</p>
            <p className="text-sm font-semibold">{formatPhaseLabel(metrics.suggested_execution_phase)}</p>
          </div>
        </div>

        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-text-light">Advance execution phase</span>
          <select
            className="border border-border rounded-md px-2 py-1.5"
            value={snapshot.engagement.execution_phase}
            disabled={saving}
            onChange={(e) => { void handlePhaseChange(e.target.value as ExecutionPhase) }}
          >
            {EXECUTION_PHASES.map((phase) => (
              <option key={phase} value={phase}>{formatPhaseLabel(phase)}</option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link to={`${basePath}/trial-balance`} className="text-primary-dark hover:underline">Trial balance</Link>
          <Link to={`${basePath}/lead-sheets`} className="text-primary-dark hover:underline">Lead sheets</Link>
          <Link to={`${basePath}/review`} className="text-primary-dark hover:underline">Review notes</Link>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-background p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text">Checklists</h3>
        <ChecklistExecutionGrid
          items={snapshot.checklistItems}
          saving={saving}
          onUpdate={async (itemId, patch) => {
            setSaving(true)
            try {
              await patchChecklistItem(engagementId, itemId, getToken, patch)
              await load()
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not update checklist item')
            } finally {
              setSaving(false)
            }
          }}
        />
      </section>

      <section className="rounded-lg border border-border bg-background p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text">Procedures</h3>
        <ProcedureExecutionGrid
          procedures={snapshot.procedures}
          saving={saving}
          onUpdate={async (procedureId, patch) => {
            setSaving(true)
            try {
              await patchProcedure(engagementId, procedureId, getToken, patch)
              await load()
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not update procedure')
            } finally {
              setSaving(false)
            }
          }}
          onSignoff={async (procedureId) => {
            setSaving(true)
            try {
              await signoffProcedure(engagementId, procedureId, getToken)
              setNotice('Procedure signed off.')
              await load()
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not sign off procedure')
            } finally {
              setSaving(false)
            }
          }}
        />
      </section>
    </div>
  )
}

export default EngagementExecutionPage

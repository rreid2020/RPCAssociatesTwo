import { portalFetch } from '../../../lib/portalApi'

export type ExecutionPhase =
  | 'planning'
  | 'fieldwork'
  | 'review'
  | 'partner_review'
  | 'completed'
  | 'locked'

export type ChecklistItem = {
  id: string
  checklist_id: string
  checklist_key?: string
  checklist_title?: string
  item_key: string
  title: string
  description?: string | null
  status: string
  assigned_to?: string | null
  due_date?: string | null
  notes?: string | null
}

export type Procedure = {
  id: string
  procedure_key: string
  title: string
  description?: string | null
  objective?: string | null
  expected_result?: string | null
  status: string
  assigned_to?: string | null
  lead_sheet_id?: string | null
}

export type ExecutionSnapshot = {
  engagement: {
    id: string
    name: string
    execution_phase: ExecutionPhase
    execution_completion_pct: number
    status: string
    review_flow_status: string
  }
  sections: Array<{ id: string; section_key: string; section_label: string }>
  checklists: Array<{ id: string; title: string; checklist_key: string }>
  checklistItems: ChecklistItem[]
  procedures: Procedure[]
  metrics: {
    checklist_total: number
    checklist_done: number
    procedure_total: number
    procedure_approved: number
    open_review_notes: number
    suggested_execution_phase: ExecutionPhase
  }
}

const CHECKLIST_STATUSES = ['not_started', 'in_progress', 'completed', 'reviewed', 'approved']
const PROCEDURE_STATUSES = ['not_started', 'in_progress', 'prepared', 'pending_review', 'review_notes_issued', 'approved']
const EXECUTION_PHASES: ExecutionPhase[] = [
  'planning',
  'fieldwork',
  'review',
  'partner_review',
  'completed',
  'locked'
]

export { CHECKLIST_STATUSES, PROCEDURE_STATUSES, EXECUTION_PHASES }

export async function fetchExecutionSnapshot (
  engagementId: string,
  getToken: () => Promise<string | null>
) {
  const result = await portalFetch<{ execution: ExecutionSnapshot }>(
    `/v1/accounting/engagements/${engagementId}/execution`,
    getToken
  )
  return result.execution
}

export async function patchExecutionPhase (
  engagementId: string,
  getToken: () => Promise<string | null>,
  executionPhase: ExecutionPhase,
  reason?: string
) {
  return portalFetch(`/v1/accounting/engagements/${engagementId}/execution/phase`, getToken, {
    method: 'PATCH',
    body: JSON.stringify({ executionPhase, reason })
  })
}

export async function refreshExecutionMetrics (
  engagementId: string,
  getToken: () => Promise<string | null>,
  autoApplySuggestedPhase = false
) {
  return portalFetch(`/v1/accounting/engagements/${engagementId}/execution/refresh`, getToken, {
    method: 'POST',
    body: JSON.stringify({ autoApplySuggestedPhase })
  })
}

export async function applyExecutionTemplate (
  engagementId: string,
  getToken: () => Promise<string | null>,
  force = false
) {
  return portalFetch(`/v1/accounting/engagements/${engagementId}/templates/apply`, getToken, {
    method: 'POST',
    body: JSON.stringify({ force })
  })
}

export async function patchChecklistItem (
  engagementId: string,
  itemId: string,
  getToken: () => Promise<string | null>,
  body: Partial<ChecklistItem>
) {
  const result = await portalFetch<{ item: ChecklistItem }>(
    `/v1/accounting/engagements/${engagementId}/checklists/${itemId}`,
    getToken,
    { method: 'PATCH', body: JSON.stringify(body) }
  )
  return result.item
}

export async function patchProcedure (
  engagementId: string,
  procedureId: string,
  getToken: () => Promise<string | null>,
  body: Partial<Procedure>
) {
  const result = await portalFetch<{ procedure: Procedure }>(
    `/v1/accounting/engagements/${engagementId}/procedures/${procedureId}`,
    getToken,
    { method: 'PATCH', body: JSON.stringify(body) }
  )
  return result.procedure
}

export async function signoffProcedure (
  engagementId: string,
  procedureId: string,
  getToken: () => Promise<string | null>
) {
  return portalFetch(
    `/v1/accounting/engagements/${engagementId}/procedures/${procedureId}/signoff`,
    getToken,
    { method: 'POST', body: JSON.stringify({}) }
  )
}

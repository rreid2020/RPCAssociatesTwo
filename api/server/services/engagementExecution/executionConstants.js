export const EXECUTION_PHASES = new Set([
  'planning',
  'fieldwork',
  'review',
  'partner_review',
  'completed',
  'locked'
])

export const CHECKLIST_ITEM_STATUSES = new Set([
  'not_started',
  'in_progress',
  'completed',
  'reviewed',
  'approved'
])

export const PROCEDURE_STATUSES = new Set([
  'not_started',
  'in_progress',
  'prepared',
  'pending_review',
  'review_notes_issued',
  'approved'
])

const PHASE_ALIASES = {
  'partner review': 'partner_review'
}

export function normalizeExecutionPhase (value) {
  const raw = String(value || 'planning').trim().toLowerCase()
  const normalized = PHASE_ALIASES[raw] || raw.replace(/\s+/g, '_')
  if (!EXECUTION_PHASES.has(normalized)) {
    throw new Error(`Invalid execution phase: ${value}`)
  }
  return normalized
}

const STATUS_ALIASES = {
  'not started': 'not_started',
  'in progress': 'in_progress',
  'pending review': 'pending_review',
  'review notes issued': 'review_notes_issued'
}

function normalizeStatusToken (value, allowed, label) {
  const raw = String(value || 'not_started').trim().toLowerCase()
  const normalized = STATUS_ALIASES[raw] || raw.replace(/\s+/g, '_')
  if (!allowed.has(normalized)) {
    throw new Error(`Invalid ${label}: ${value}`)
  }
  return normalized
}

export function normalizeChecklistItemStatus (value) {
  return normalizeStatusToken(value, CHECKLIST_ITEM_STATUSES, 'checklist item status')
}

export function normalizeProcedureStatus (value) {
  return normalizeStatusToken(value, PROCEDURE_STATUSES, 'procedure status')
}

/** Any workspace member with execution.manage may set any valid phase (no per-step role matrix). */
export function canTransitionExecutionPhase (fromPhase, toPhase) {
  const from = normalizeExecutionPhase(fromPhase)
  const to = normalizeExecutionPhase(toPhase)
  return from !== to
}

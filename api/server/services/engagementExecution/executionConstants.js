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

export const EXECUTION_PHASE_TRANSITIONS = {
  planning: new Set(['fieldwork']),
  fieldwork: new Set(['review']),
  review: new Set(['partner_review']),
  partner_review: new Set(['completed']),
  completed: new Set(['locked']),
  locked: new Set(['completed'])
}

export const PHASE_TRANSITION_ROLES = {
  'planning->fieldwork': new Set(['staff', 'manager', 'firm_admin', 'super_admin']),
  'fieldwork->review': new Set(['staff', 'manager', 'firm_admin', 'super_admin']),
  'review->partner_review': new Set(['manager', 'reviewer', 'firm_admin', 'super_admin']),
  'partner_review->completed': new Set(['manager', 'reviewer', 'firm_admin', 'super_admin']),
  'completed->locked': new Set(['manager', 'firm_admin', 'super_admin']),
  'locked->completed': new Set(['firm_admin', 'super_admin'])
}

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

export function canTransitionExecutionPhase (fromPhase, toPhase, platformRole) {
  const from = normalizeExecutionPhase(fromPhase)
  const to = normalizeExecutionPhase(toPhase)
  const allowed = EXECUTION_PHASE_TRANSITIONS[from]
  if (!allowed || !allowed.has(to)) return false
  const roleKey = `${from}->${to}`
  const roles = PHASE_TRANSITION_ROLES[roleKey]
  return Boolean(roles?.has(platformRole))
}

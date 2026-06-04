import {
  countExecutionStats,
  countOpenReviewNotes
} from './engagementExecutionRepository.js'

export async function deriveExecutionCompletion (pool, engagementId) {
  const stats = await countExecutionStats(pool, engagementId)
  const checklistTotal = Number(stats.checklist_total || 0)
  const checklistDone = Number(stats.checklist_done || 0)
  const procedureTotal = Number(stats.procedure_total || 0)
  const procedureApproved = Number(stats.procedure_approved || 0)
  const totalUnits = checklistTotal + procedureTotal
  if (totalUnits === 0) return 0
  const doneUnits = checklistDone + procedureApproved
  return Math.round((doneUnits / totalUnits) * 10000) / 100
}

export async function suggestExecutionPhase (pool, engagement) {
  if (!engagement) return 'planning'
  if (engagement.execution_locked_at) return 'locked'
  const current = String(engagement.execution_phase || 'planning').toLowerCase()
  if (current === 'locked' || current === 'completed') return current

  const stats = await countExecutionStats(pool, engagement.id)
  const openNotes = await countOpenReviewNotes(pool, engagement.id)
  const procedureTotal = Number(stats.procedure_total || 0)
  const procedureInProgress = Number(stats.procedure_in_progress || 0)
  const procedureApproved = Number(stats.procedure_approved || 0)
  const checklistTotal = Number(stats.checklist_total || 0)
  const checklistDone = Number(stats.checklist_done || 0)

  if (procedureTotal === 0 && checklistTotal === 0) return 'planning'
  if (procedureInProgress > 0 || (checklistTotal > 0 && checklistDone < checklistTotal)) {
    return 'fieldwork'
  }
  if (procedureApproved < procedureTotal || openNotes > 0) return 'review'
  if (procedureTotal > 0 && procedureApproved === procedureTotal && checklistDone === checklistTotal) {
    return 'partner_review'
  }
  return current
}

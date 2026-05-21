export type WorkflowStatus = 'draft' | 'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'completed'

export interface WorkflowState {
  workflowId: string
  workspaceId: string
  status: WorkflowStatus
  assigneeUserId: string | null
  updatedAt: string
}

const TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  draft: ['in_progress'],
  in_progress: ['pending_review', 'completed'],
  pending_review: ['approved', 'rejected'],
  approved: ['completed'],
  rejected: ['in_progress'],
  completed: []
}

export function isValidWorkflowTransition (from: WorkflowStatus, to: WorkflowStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

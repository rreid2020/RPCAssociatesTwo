import { portalFetch } from '../../../lib/portalApi'

export async function fetchWorkingPaperTree (engagementId: string, getToken: () => Promise<string | null>) {
  return portalFetch<{
    engagement: any
    sections: any[]
  }>(`/v1/accounting/engagements/${engagementId}/working-paper-tree`, getToken)
}

export async function fetchWorkflowQueue (engagementId: string, getToken: () => Promise<string | null>) {
  return portalFetch<{
    engagementId: string
    dueDate: string | null
    reviewFlowStatus: string
    queue: any[]
  }>(`/v1/accounting/engagements/${engagementId}/workflow-queue`, getToken)
}

export async function fetchAuditEvents (engagementId: string, getToken: () => Promise<string | null>) {
  return portalFetch<{ events: any[] }>(`/v1/accounting/engagements/${engagementId}/audit-events`, getToken)
}

export async function fetchReviewSignoffs (engagementId: string, getToken: () => Promise<string | null>) {
  return portalFetch<{ signoffs: any[] }>(`/v1/accounting/engagements/${engagementId}/review-signoffs`, getToken)
}

export async function createReviewSignoff (
  engagementId: string,
  payload: { leadSheetId?: string | null, signoffType?: string, signoffState?: string, metadata?: Record<string, unknown> },
  getToken: () => Promise<string | null>
) {
  return portalFetch<{ signoff: any }>(`/v1/accounting/engagements/${engagementId}/review-signoffs`, getToken, {
    method: 'POST',
    body: JSON.stringify(payload || {})
  })
}

export async function fetchEvidenceLinks (leadSheetId: string, getToken: () => Promise<string | null>) {
  return portalFetch<{ evidence: any[] }>(`/v1/accounting/lead-sheets/${leadSheetId}/evidence-links`, getToken)
}

export async function createEvidenceLink (
  leadSheetId: string,
  payload: Record<string, unknown>,
  getToken: () => Promise<string | null>
) {
  return portalFetch<{ evidence: any }>(`/v1/accounting/lead-sheets/${leadSheetId}/evidence-links`, getToken, {
    method: 'POST',
    body: JSON.stringify(payload || {})
  })
}

export async function fetchTickmarks (workingPaperRowId: string, getToken: () => Promise<string | null>) {
  return portalFetch<{ tickmarks: any[] }>(`/v1/accounting/working-paper-rows/${workingPaperRowId}/tickmarks`, getToken)
}

export async function createTickmark (
  workingPaperRowId: string,
  payload: Record<string, unknown>,
  getToken: () => Promise<string | null>
) {
  return portalFetch<{ tickmark: any }>(`/v1/accounting/working-paper-rows/${workingPaperRowId}/tickmarks`, getToken, {
    method: 'POST',
    body: JSON.stringify(payload || {})
  })
}

export async function fetchAiFoundations (engagementId: string, getToken: () => Promise<string | null>) {
  return portalFetch<Record<string, unknown>>(`/v1/accounting/engagements/${engagementId}/ai-foundations`, getToken)
}

export type EngagementExecutionBundle = {
  tree: { sections: any[] }
  queue: { queue: any[] }
  adjustments: { entries: any[] }
  audit: { events: any[] }
  signoffs: { signoffs: any[] }
  aiFoundations: Record<string, unknown> | null
  dashboard: any | null
}

export async function fetchEngagementExecutionBundle (
  engagementId: string,
  getToken: () => Promise<string | null>
) {
  return portalFetch<EngagementExecutionBundle>(`/v1/accounting/engagements/${engagementId}/execution-bundle`, getToken)
}

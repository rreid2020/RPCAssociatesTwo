import { portalFetch } from '../../lib/portalApi'

export type EngagementFilters = {
  status?: string
  reviewFlowStatus?: string
  approvalReady?: string
  clientId?: string
  engagementType?: string
  search?: string
}

export async function fetchAccountingClientsDomain (getToken: () => Promise<string | null>) {
  return portalFetch<{ clients: any[] }>('/v1/accounting/clients', getToken)
}

export async function fetchEngagementsDomain (getToken: () => Promise<string | null>, filters: EngagementFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.reviewFlowStatus) params.set('reviewFlowStatus', filters.reviewFlowStatus)
  if (filters.approvalReady) params.set('approvalReady', filters.approvalReady)
  if (filters.clientId) params.set('clientId', filters.clientId)
  if (filters.engagementType) params.set('engagementType', filters.engagementType)
  if (filters.search?.trim()) params.set('search', filters.search.trim())
  const query = params.toString()
  return portalFetch<{ engagements: any[] }>(`/v1/accounting/engagements${query ? `?${query}` : ''}`, getToken)
}

export async function fetchEngagementStatusSummaryDomain (getToken: () => Promise<string | null>) {
  return portalFetch<{ summary: Array<{ status: string, c: number }> }>('/v1/accounting/engagements/status-summary', getToken)
}

export async function fetchEngagementWorkflowSummaryDomain (getToken: () => Promise<string | null>) {
  return portalFetch<{
    summary: {
      total_engagements: number
      approval_ready_count: number
      approval_blocked_count: number
      open_review_notes: number
      unreviewed_lead_sheets: number
    }
  }>('/v1/accounting/engagements/workflow-summary', getToken)
}


import type { TokenProvider } from '../../../services/api/client'
import { callPortalApi } from '../../../services/api/client'

export type OpsOverview = {
  generatedAt: string
  corpus: {
    sourceCount: number
    ingestedSourceCount: number
    pendingSourceCount: number
    skippedSourceCount: number
    failedSourceCount: number
    chunkCount: number
    embeddingCount: number
    retrievalReady: boolean
  }
  taxesHub: {
    total: number
    pending: number
    ingested: number
    skipped: number
    failed?: number
    unknown: number
    content: number
    hubSeedSources: number
  }
  formRegistry: {
    total: number
    active: number
    archived: number
  }
  feedback?: {
    total: number
    submitted: number
    underReview: number
    stagedForApproval: number
  }
}

export type OpsCountRow = { key: string; count: number }

export type OpsCorpusAudit = {
  totals: OpsOverview['corpus']
  byIngestStatus: OpsCountRow[]
  byCategory: OpsCountRow[]
  byPageKind: OpsCountRow[]
  taxesHubByCorpusRole: OpsCountRow[]
}

export type OpsFormRegistryStats = {
  totals: OpsOverview['formRegistry']
  byFamily: OpsCountRow[]
  recent: Array<{
    formNumber: string
    title: string
    status: string
    landingUrl: string
  }>
  tableMissing?: boolean
}

export type OpsExternalLink = {
  id: string
  label: string
  description: string
  url: string
  category: string
}

export async function getOpsAccess (getToken: TokenProvider): Promise<{ isStaff: boolean }> {
  return await callPortalApi<{ isStaff: boolean }>('/v1/ops/me', getToken)
}

export async function getOpsOverview (getToken: TokenProvider): Promise<OpsOverview> {
  const data = await callPortalApi<{ overview: OpsOverview }>('/v1/ops/overview', getToken)
  return data.overview
}

export async function getOpsCorpusAudit (getToken: TokenProvider): Promise<OpsCorpusAudit> {
  const data = await callPortalApi<{ corpus: OpsCorpusAudit }>('/v1/ops/corpus', getToken)
  return data.corpus
}

export async function getOpsTaxesHubStats (getToken: TokenProvider): Promise<OpsOverview['taxesHub']> {
  const data = await callPortalApi<{ taxesHub: OpsOverview['taxesHub'] }>('/v1/ops/taxes-hub', getToken)
  return data.taxesHub
}

export async function getOpsFormRegistryStats (getToken: TokenProvider): Promise<OpsFormRegistryStats> {
  const data = await callPortalApi<{ formRegistry: OpsFormRegistryStats }>('/v1/ops/forms-registry', getToken)
  return data.formRegistry
}

export async function getOpsExternalLinks (getToken: TokenProvider): Promise<OpsExternalLink[]> {
  const data = await callPortalApi<{ links: OpsExternalLink[] }>('/v1/ops/links', getToken)
  return data.links
}

export type OpsFeedbackStatus =
  | 'submitted'
  | 'under_review'
  | 'staged_for_approval'
  | 'approved'
  | 'rejected'
  | 'implemented'

export type OpsFeedbackCategory = 'feedback' | 'suggestion' | 'answer_quality' | 'corpus_gap'

export type OpsFeedbackListItem = {
  id: string
  userId: string
  workspaceId: string | null
  category: OpsFeedbackCategory
  subject: string
  message: string
  rating: number | null
  sessionId: string | null
  status: OpsFeedbackStatus
  operatorNotes: string | null
  createdAt: string
  updatedAt: string
}

export type OpsFeedbackDetail = OpsFeedbackListItem & {
  stagedEnhancement: Record<string, unknown> | null
  trainingSignal: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}

export type OpsFeedbackSessionMessage = {
  id: string
  role: string
  content: string
  citations: unknown
  riskLevel: string | null
  structuredResponse: Record<string, unknown> | null
  createdAt: string
}

export type OpsFeedbackStats = {
  totals: {
    total: number
    submitted: number
    underReview: number
    stagedForApproval: number
  }
  byStatus: OpsCountRow[]
  byCategory: OpsCountRow[]
}

export type OpsFeedbackListResponse = {
  items: OpsFeedbackListItem[]
  total: number
  limit: number
  offset: number
}

export type OpsFeedbackActionResult = {
  feedback: OpsFeedbackDetail
  queuedSources: Array<{
    id: string
    url: string
    title: string
    ingestStatus: string
  }>
}

export type OpsFeedbackFixSuggestions = {
  sourceUrls: string[]
  publications: Array<{
    code: string
    status: string
    reason: string | null
    title: string | null
    url: string | null
  }>
}

export type OpsFeedbackFixResult = {
  feedback: OpsFeedbackDetail
  discovered: OpsFeedbackFixSuggestions
  queuedSources: OpsFeedbackActionResult['queuedSources']
  reprioritized: Array<OpsFeedbackActionResult['queuedSources'][number] & {
    publicationCode?: string
    publicationStatus?: string
  }>
  ingestResult: {
    ingested: number
    failed: number
    skipped: number
    results: Array<Record<string, unknown>>
  }
}

export async function getOpsFeedbackStats (getToken: TokenProvider): Promise<OpsFeedbackStats> {
  const data = await callPortalApi<{ stats: OpsFeedbackStats }>('/v1/ops/feedback/stats', getToken)
  return data.stats
}

export async function listOpsFeedback (
  getToken: TokenProvider,
  params: {
    status?: OpsFeedbackStatus
    category?: OpsFeedbackCategory
    q?: string
    limit?: number
    offset?: number
  } = {}
): Promise<OpsFeedbackListResponse> {
  const search = new URLSearchParams()
  if (params.status) search.set('status', params.status)
  if (params.category) search.set('category', params.category)
  if (params.q) search.set('q', params.q)
  if (params.limit) search.set('limit', String(params.limit))
  if (params.offset) search.set('offset', String(params.offset))
  const suffix = search.toString() ? `?${search.toString()}` : ''
  return await callPortalApi<OpsFeedbackListResponse>(`/v1/ops/feedback${suffix}`, getToken)
}

export async function getOpsFeedbackDetail (
  getToken: TokenProvider,
  id: string
): Promise<{
  feedback: OpsFeedbackDetail
  sessionMessages: OpsFeedbackSessionMessage[]
  categories: Array<{ id: OpsFeedbackCategory; label: string }>
  statuses: OpsFeedbackStatus[]
  fixSuggestions: OpsFeedbackFixSuggestions
}> {
  return await callPortalApi(`/v1/ops/feedback/${id}`, getToken)
}

export async function updateOpsFeedback (
  getToken: TokenProvider,
  id: string,
  payload: { status?: OpsFeedbackStatus; operatorNotes?: string | null }
): Promise<OpsFeedbackDetail> {
  const data = await callPortalApi<{ feedback: OpsFeedbackDetail }>(`/v1/ops/feedback/${id}`, getToken, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
  return data.feedback
}

export async function actionOpsFeedback (
  getToken: TokenProvider,
  id: string,
  payload: {
    sourceUrls?: string[] | string
    status?: OpsFeedbackStatus
    operatorNotes?: string | null
    operatorSummary?: string | null
    actionType?: string
  }
): Promise<OpsFeedbackActionResult> {
  return await callPortalApi<OpsFeedbackActionResult>(`/v1/ops/feedback/${id}/action`, getToken, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function kickoffOpsFeedbackFix (
  getToken: TokenProvider,
  id: string,
  payload: {
    sourceUrls?: string[] | string
    operatorNotes?: string | null
    operatorSummary?: string | null
    runIngest?: boolean
    ingestLimit?: number
  } = {}
): Promise<OpsFeedbackFixResult> {
  return await callPortalApi<OpsFeedbackFixResult>(`/v1/ops/feedback/${id}/fix`, getToken, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function deleteOpsFeedback (
  getToken: TokenProvider,
  id: string
): Promise<{ deleted: boolean }> {
  return await callPortalApi<{ deleted: boolean }>(`/v1/ops/feedback/${id}`, getToken, {
    method: 'DELETE'
  })
}

import { portalFetch } from '../../lib/portalApi'

export type RiskLevel = 'low' | 'medium' | 'high'

export type TaxgptRetrievalMode = 'rag' | 'degraded'

export type TaxgptSourceBucket = 'cra' | 'legislation' | 'case_law'

export type TaxgptConfidence = 'high' | 'medium' | 'low'

export type Citation = {
  id: string
  chunkId: string
  sourceTitle: string
  sourceUrl: string
  sectionHeading?: string
  pageNumber?: number
  retrievedAt: string
  similarityScore?: number
  sourceBucket?: TaxgptSourceBucket
  summary?: string
}

export type TaxgptSourceAnalysisEntry = {
  citationIndex: number
  summary: string
}

export type TaxgptSourceGroup = {
  bucket: TaxgptSourceBucket
  label: string
  entries: Citation[]
  emptyMessage: string
}

export type TaxgptStructuredResponse = {
  directAnswer: string
  sourceAnalysis: {
    cra: TaxgptSourceAnalysisEntry[]
    legislation: TaxgptSourceAnalysisEntry[]
    caseLaw: TaxgptSourceAnalysisEntry[]
  }
  complianceRisk?: string
  keyPoints: string[]
  whatThisMeansForYou: string
  considerations: string[]
  suggestedNextSteps: string[]
  confidence: TaxgptConfidence
  groupedSources?: Record<TaxgptSourceBucket, TaxgptSourceGroup>
}

export type TaxgptCorpusStats = {
  sourceCount: number
  ingestedSourceCount: number
  pendingSourceCount: number
  chunkCount: number
  embeddingCount: number
  retrievalReady: boolean
}

export type TaxgptStatus = {
  configured: boolean
  model: string
  embedModel: string
  corpus: TaxgptCorpusStats
}

export type TaxgptChatResponse = {
  response: string
  structuredResponse?: TaxgptStructuredResponse
  citations: Citation[]
  sources: Array<{ id: string; title: string; url: string }>
  riskLevel: RiskLevel
  sessionId: string
  retrievalMode: TaxgptRetrievalMode
  retrievalNotice: string | null
  corpus: Pick<TaxgptCorpusStats, 'retrievalReady' | 'embeddingCount' | 'ingestedSourceCount'>
  reasoning?: string[]
  actions?: Array<{ type: string; description: string }>
}

export type SendTaxgptChatPayload = {
  sessionId?: string | null
  message: string
  agentic?: boolean
}

export async function sendTaxgptChatMessage (
  getToken: () => Promise<string | null>,
  payload: SendTaxgptChatPayload
): Promise<TaxgptChatResponse> {
  return portalFetch<TaxgptChatResponse>('/v1/taxgpt/chat', getToken, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function fetchTaxgptStatus (getToken: () => Promise<string | null>): Promise<TaxgptStatus> {
  return portalFetch<TaxgptStatus>('/v1/taxgpt/status', getToken)
}

export async function fetchTaxgptCorpus (getToken: () => Promise<string | null>): Promise<TaxgptCorpusStats> {
  return portalFetch<TaxgptCorpusStats>('/v1/taxgpt/corpus', getToken)
}

export type TaxgptFeedbackCategory = 'feedback' | 'suggestion' | 'answer_quality' | 'corpus_gap'

export type TaxgptFeedbackItem = {
  id: string
  category: TaxgptFeedbackCategory
  subject: string
  message: string
  rating: number | null
  sessionId: string | null
  status: string
  createdAt: string
}

export type SubmitTaxgptFeedbackPayload = {
  category: TaxgptFeedbackCategory
  subject: string
  message: string
  rating?: number | null
  sessionId?: string | null
  sourcePage?: string
}

export async function fetchTaxgptFeedbackCategories (
  getToken: () => Promise<string | null>
): Promise<Array<{ id: TaxgptFeedbackCategory; label: string }>> {
  const data = await portalFetch<{ categories: Array<{ id: TaxgptFeedbackCategory; label: string }> }>(
    '/v1/taxgpt/feedback/categories',
    getToken
  )
  return data.categories
}

export async function fetchTaxgptFeedbackHistory (
  getToken: () => Promise<string | null>
): Promise<TaxgptFeedbackItem[]> {
  const data = await portalFetch<{ items: TaxgptFeedbackItem[] }>('/v1/taxgpt/feedback', getToken)
  return data.items
}

export async function submitTaxgptFeedback (
  getToken: () => Promise<string | null>,
  payload: SubmitTaxgptFeedbackPayload
): Promise<TaxgptFeedbackItem> {
  const data = await portalFetch<{ item: TaxgptFeedbackItem }>('/v1/taxgpt/feedback', getToken, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return data.item
}

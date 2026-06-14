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
  citationIndex?: number
  summary?: string
  highlights?: string[]
  excerpt?: string
}

export type TaxgptSourceReference = {
  citationIndex: number
  id?: string
  chunkId: string
  sourceTitle: string
  sourceUrl: string
  sectionHeading?: string
  pageNumber?: number
  sourceBucket?: TaxgptSourceBucket
  excerpt?: string
}

export type TaxgptLanguage = 'en' | 'fr'

export type TaxgptSourceAnalysisEntry = {
  citationIndex: number
  summary?: string
  highlights?: string[]
}

export type TaxgptComplianceRiskSource = {
  citationIndex: number
  sourceTitle: string
  sourceUrl: string
  sectionHeading?: string
  sourceBucket?: TaxgptSourceBucket
}

export type TaxgptComplianceRisk = {
  risk: string
  citationIndices: number[]
  basis?: TaxgptSourceBucket | null
  sources?: TaxgptComplianceRiskSource[]
}

export type TaxgptFilingDeadline = {
  title: string
  deadline: string
  note?: string
  citationIndices: number[]
  sources?: TaxgptComplianceRiskSource[]
}

export type TaxgptPenaltyInterest = {
  description: string
  citationIndices: number[]
  sources?: TaxgptComplianceRiskSource[]
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
  complianceRisks?: TaxgptComplianceRisk[]
  /** @deprecated Legacy single-string field from older responses */
  complianceRisk?: string
  taxTips?: string[]
  filingDeadlines?: TaxgptFilingDeadline[]
  penaltiesAndInterest?: TaxgptPenaltyInterest[]
  keyPoints: string[]
  whatThisMeansForYou: string
  considerations: string[]
  suggestedNextSteps: string[]
  confidence: TaxgptConfidence
  sourceReferences?: TaxgptSourceReference[]
  groupedSources?: Record<TaxgptSourceBucket, TaxgptSourceGroup>
}

export type TaxgptCorpusStats = {
  sourceCount: number
  ingestedSourceCount: number
  pendingSourceCount?: number
  chunkCount?: number
  embeddingCount: number
  retrievalReady: boolean
}

export type TaxgptModelRouting = {
  routing: 'multi_tier'
  models: {
    fast: string
    standard: string
    complex: string
  }
  defaults: {
    fast: string
    standard: string
    complex: string
  }
}

export type TaxgptStatus = {
  configured: boolean
  model: string
  modelRouting?: TaxgptModelRouting
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
  model?: string
  modelTier?: 'fast' | 'standard' | 'complex'
  modelRoutingReason?: string
  language?: TaxgptLanguage
}

export type SendTaxgptChatPayload = {
  sessionId?: string | null
  message: string
  agentic?: boolean
  language?: TaxgptLanguage
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

export async function fetchTaxgptStatus (
  getToken: () => Promise<string | null>,
  options: { signal?: AbortSignal } = {}
): Promise<TaxgptStatus> {
  return portalFetch<TaxgptStatus>('/v1/taxgpt/status', getToken, { signal: options.signal })
}

export async function fetchTaxgptCorpus (getToken: () => Promise<string | null>): Promise<TaxgptCorpusStats> {
  return portalFetch<TaxgptCorpusStats>('/v1/taxgpt/corpus', getToken)
}

export type {
  CreateTaxgptDonationCheckoutPayload,
  TaxgptDonationCheckoutResponse,
  TaxgptDonationConfig
} from './donations'
export {
  createTaxgptDonationCheckout,
  fetchTaxgptDonationConfig
} from './donations'

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

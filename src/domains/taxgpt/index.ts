import { portalFetch } from '../../lib/portalApi'

export type RiskLevel = 'low' | 'medium' | 'high'

export type TaxgptRetrievalMode = 'rag' | 'degraded'

export type Citation = {
  id: string
  chunkId: string
  sourceTitle: string
  sourceUrl: string
  sectionHeading?: string
  pageNumber?: number
  retrievedAt: string
  similarityScore?: number
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

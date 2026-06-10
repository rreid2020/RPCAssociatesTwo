import type { Citation, RiskLevel, TaxgptStructuredResponse } from '../../domains/taxgpt'

export type { Citation, RiskLevel, TaxgptStructuredResponse }

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  structuredResponse?: TaxgptStructuredResponse
  citations?: Citation[]
  createdAt: Date
  reasoning?: string[]
  actions?: Array<{ type: string; description: string }>
}

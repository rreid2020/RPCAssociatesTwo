import type { Citation, RiskLevel, TaxgptFeedbackSuggestion, TaxgptStructuredResponse } from '../../domains/taxgpt'

export type { Citation, RiskLevel, TaxgptFeedbackSuggestion, TaxgptStructuredResponse }

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  structuredResponse?: TaxgptStructuredResponse
  feedbackSuggestion?: TaxgptFeedbackSuggestion | null
  citations?: Citation[]
  createdAt: Date
  reasoning?: string[]
  actions?: Array<{ type: string; description: string }>
}

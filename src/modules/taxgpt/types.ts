import type { Citation, RiskLevel } from '../../domains/taxgpt'

export type { Citation, RiskLevel }

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  citations?: Citation[]
  createdAt: Date
  reasoning?: string[]
  actions?: Array<{ type: string; description: string }>
}

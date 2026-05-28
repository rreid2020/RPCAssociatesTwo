import type { TaxgptCitation, TaxgptMessage } from '../../lib/taxgptApi'

export type ChatRole = 'user' | 'assistant' | 'system'

export type LocalMessage = {
  id: string
  role: ChatRole
  message_content: string
  created_at: string
  conversation_id: string
  citations: TaxgptCitation[]
  model_used: string | null
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  risk_level: 'low' | 'medium' | 'high' | null
}

export type ComposerState = {
  text: string
  submitting: boolean
  streamMessageId: string | null
}

export function toLocalMessage (message: TaxgptMessage): LocalMessage {
  return {
    id: message.id,
    role: message.role,
    message_content: message.message_content,
    created_at: message.created_at,
    conversation_id: message.conversation_id,
    citations: message.citations || [],
    model_used: message.model_used,
    input_tokens: message.input_tokens,
    output_tokens: message.output_tokens,
    total_tokens: message.total_tokens,
    risk_level: message.risk_level
  }
}

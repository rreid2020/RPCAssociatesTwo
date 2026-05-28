import type { useAuth } from '@clerk/clerk-react'

type GetToken = ReturnType<typeof useAuth>['getToken']

export type TaxgptConversation = {
  id: string
  user_id: string
  workspace_id: string | null
  title: string
  created_at: string
  updated_at: string
  last_message_at: string
  message_count: number
}

export type TaxgptCitation = {
  id: string
  message_id: string
  source_chunk_id: string | null
  excerpt: string
  confidence_score: number | null
  source_type: string | null
  source_title: string | null
  section_reference: string | null
  source_url: string | null
  created_at: string
}

export type TaxgptMessage = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  message_content: string
  model_used: string | null
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  risk_level: 'low' | 'medium' | 'high' | null
  created_at: string
  citations: TaxgptCitation[]
}

export type TaxgptUsage = {
  promptCount: number
  tokenUsage: number
  dailyLimit: number
  remaining: number
  limited: boolean
  planType: string
}

export type TaxgptFeedbackType =
  | 'thumbs_up'
  | 'thumbs_down'
  | 'not_helpful'
  | 'incorrect'
  | 'outdated'

function getApiPrefix (): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || ''
  return base ? `${base}/api/taxgpt` : '/api/taxgpt'
}

async function taxgptFetch<T> (
  path: string,
  getToken: GetToken,
  init: RequestInit = {}
): Promise<T> {
  const token = await getToken()
  if (!token) throw new Error('Not signed in')
  const res = await fetch(`${getApiPrefix()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers
    }
  })
  const text = await res.text()
  if (!res.ok) {
    try {
      const parsed = JSON.parse(text)
      throw new Error(parsed.error || res.statusText)
    } catch {
      throw new Error(text.trim() || `${res.status} ${res.statusText}`.trim() || 'Request failed')
    }
  }
  if (!text.trim()) return undefined as T
  return JSON.parse(text) as T
}

export async function listTaxgptConversations (getToken: GetToken): Promise<TaxgptConversation[]> {
  const response = await taxgptFetch<{ conversations: TaxgptConversation[] }>('/conversations', getToken)
  return response.conversations || []
}

export async function createTaxgptConversation (
  getToken: GetToken,
  payload: { title?: string; workspaceId?: string | null } = {}
): Promise<TaxgptConversation> {
  const response = await taxgptFetch<{ conversation: TaxgptConversation }>('/conversations', getToken, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return response.conversation
}

export async function renameTaxgptConversation (
  getToken: GetToken,
  conversationId: string,
  title: string
): Promise<TaxgptConversation> {
  const response = await taxgptFetch<{ conversation: TaxgptConversation }>(`/conversations/${conversationId}`, getToken, {
    method: 'PATCH',
    body: JSON.stringify({ title })
  })
  return response.conversation
}

export async function deleteTaxgptConversation (
  getToken: GetToken,
  conversationId: string
): Promise<void> {
  await taxgptFetch<void>(`/conversations/${conversationId}`, getToken, {
    method: 'DELETE'
  })
}

export async function listTaxgptMessages (
  getToken: GetToken,
  conversationId: string
): Promise<TaxgptMessage[]> {
  const encoded = encodeURIComponent(conversationId)
  const response = await taxgptFetch<{ messages: TaxgptMessage[] }>(`/messages?conversationId=${encoded}`, getToken)
  return response.messages || []
}

export async function submitTaxgptFeedback (
  getToken: GetToken,
  payload: { messageId: string; feedbackType: TaxgptFeedbackType; comments?: string }
): Promise<void> {
  await taxgptFetch('/feedback', getToken, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function getTaxgptUsage (getToken: GetToken): Promise<TaxgptUsage> {
  const response = await taxgptFetch<{ usage: TaxgptUsage }>('/usage', getToken)
  return response.usage
}

type StreamHandlers = {
  onMeta?: (payload: { conversationId: string; userMessageId: string }) => void
  onDelta?: (text: string) => void
  onDone?: (payload: { conversationId: string; assistantMessageId: string; citations: TaxgptCitation[]; usage: TaxgptUsage }) => void
}

function parseSseEventBlock (block: string): { event: string; data: string } | null {
  const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length === 0) return null
  let event = 'message'
  let data = ''
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    if (line.startsWith('data:')) data += line.slice(5).trim()
  }
  return { event, data }
}

export async function streamTaxgptChat (
  getToken: GetToken,
  payload: { conversationId?: string | null; message?: string; regenerateMessageId?: string | null },
  handlers: StreamHandlers
): Promise<void> {
  const token = await getToken()
  if (!token) throw new Error('Not signed in')
  const response = await fetch(`${getApiPrefix()}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const body = await response.text()
    try {
      const parsed = JSON.parse(body)
      throw new Error(parsed.error || 'Chat request failed')
    } catch {
      throw new Error(body.trim() || 'Chat request failed')
    }
  }

  if (!response.body) {
    throw new Error('Streaming response is not available')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() || ''
    for (const block of blocks) {
      const parsed = parseSseEventBlock(block)
      if (!parsed) continue
      if (parsed.event === 'complete') continue
      if (parsed.event === 'error') {
        let errorMessage = 'Chat request failed'
        try {
          const payload = JSON.parse(parsed.data) as { error?: string }
          if (payload?.error) errorMessage = payload.error
        } catch {}
        throw new Error(errorMessage)
      }
      if (!parsed.data) continue
      let data: any = null
      try {
        data = JSON.parse(parsed.data)
      } catch {
        continue
      }
      if (parsed.event === 'meta') handlers.onMeta?.(data)
      if (parsed.event === 'delta' && typeof data.text === 'string') handlers.onDelta?.(data.text)
      if (parsed.event === 'done') handlers.onDone?.(data)
    }
  }
}

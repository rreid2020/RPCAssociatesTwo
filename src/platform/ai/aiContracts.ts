export type AIModelFamily = 'taxgpt' | 'general' | 'extraction'

export interface AIRequestContext {
  workspaceId: string
  actorUserId: string
  feature: string
}

export interface AIUsageRecord {
  workspaceId: string
  modelFamily: AIModelFamily
  tokens: number
  timestamp: string
}

export function createAIUsageRecord (workspaceId: string, modelFamily: AIModelFamily, tokens: number): AIUsageRecord {
  return {
    workspaceId,
    modelFamily,
    tokens,
    timestamp: new Date().toISOString()
  }
}

export interface WorkspaceSummaryDto {
  id: string
  name: string
  workspace_type: 'business' | 'firm'
  role: string | null
}

export interface EngagementSummaryDto {
  id: string
  client_id: string
  name: string
  status: string
  period_end: string
}


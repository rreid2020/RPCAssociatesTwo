export type WorkspaceType = 'business' | 'firm'

export interface AccountingWorkspaceSummary {
  id: string
  name: string
  workspaceType: WorkspaceType
  profileBusinessType: string | null
  role: string
}


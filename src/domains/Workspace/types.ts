export type WorkspaceType = 'business' | 'firm'

export interface WorkspaceSummary {
  id: string
  name: string
  workspaceType: WorkspaceType
  role: string
  onboardingCompletedAt: string | null
}

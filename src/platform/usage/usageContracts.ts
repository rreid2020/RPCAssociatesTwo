export interface WorkspaceUsageSnapshot {
  workspaceId: string
  storageMbUsed: number
  activeUsers: number
  aiCreditsUsedThisMonth: number
  month: string
}

export function createDefaultUsageSnapshot (workspaceId: string): WorkspaceUsageSnapshot {
  return {
    workspaceId,
    storageMbUsed: 0,
    activeUsers: 1,
    aiCreditsUsedThisMonth: 0,
    month: new Date().toISOString().slice(0, 7)
  }
}

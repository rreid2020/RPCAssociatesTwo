export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'

export interface PlatformJob {
  id: string
  workspaceId: string
  type: string
  status: JobStatus
  progressPercent: number
  createdAt: string
  updatedAt: string
}

export function createQueuedJob (type: string, workspaceId: string): PlatformJob {
  const now = new Date().toISOString()
  return {
    id: `job_${Date.now().toString(36)}`,
    workspaceId,
    type,
    status: 'queued',
    progressPercent: 0,
    createdAt: now,
    updatedAt: now
  }
}

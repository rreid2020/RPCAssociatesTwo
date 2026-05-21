export type PlatformEntityId = string

export interface PlatformEntityBase {
  id: PlatformEntityId
  workspace_id: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at?: string | null
}

export interface WorkspaceScopedRequest {
  workspaceId: string
  actorUserId: string
}

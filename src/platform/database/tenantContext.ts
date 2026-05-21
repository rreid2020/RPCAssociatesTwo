export interface TenantContext {
  workspaceId: string
  actorUserId: string
}

export function assertTenantContext (context: TenantContext | null | undefined): asserts context is TenantContext {
  if (!context?.workspaceId || !context?.actorUserId) {
    throw new Error('Tenant context is required')
  }
}

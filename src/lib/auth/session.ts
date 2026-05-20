export interface TenantSessionScope {
  workspaceId?: string
  engagementId?: string
}

export function getTenantSessionScope (): TenantSessionScope {
  if (typeof window === 'undefined') return {}
  return {
    workspaceId: window.localStorage.getItem('accounting.workspaceId') || undefined,
    engagementId: window.localStorage.getItem('accounting.engagementId') || undefined
  }
}


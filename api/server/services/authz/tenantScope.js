export function resolveTenantScope (headers = {}, params = {}) {
  return {
    workspaceId: headers['x-accounting-workspace-id'] || null,
    engagementId: params.engagementId || null
  }
}

export function assertWorkspaceScope (scope) {
  if (!scope.workspaceId) throw new Error('Workspace scope is required')
}

export function assertEngagementScope (scope) {
  if (!scope.engagementId) throw new Error('Engagement scope is required')
}


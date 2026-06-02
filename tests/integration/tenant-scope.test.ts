import { describe, expect, it } from 'vitest'
import { resolveTenantScope } from '../../api/server/services/authz/tenantScope.js'

describe('tenant scope resolver', () => {
  it('ignores legacy workspace header and reads engagement param', () => {
    const scope = resolveTenantScope(
      { 'x-accounting-workspace-id': 'ws_123' },
      { engagementId: 'eng_999' }
    )
    expect(scope.workspaceId).toBeNull()
    expect(scope.engagementId).toBe('eng_999')
  })

  it('returns null fields when scope values are absent', () => {
    const scope = resolveTenantScope({}, {})
    expect(scope.workspaceId).toBeNull()
    expect(scope.engagementId).toBeNull()
  })
})


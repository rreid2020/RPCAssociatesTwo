import { describe, expect, it } from 'vitest'
import {
  assertWorkspaceMemberRole,
  normalizeWorkspaceMemberRole
} from '../../api/server/services/authz/workspaceRoleCatalog.js'

describe('workspace role catalog', () => {
  it('accepts organization portal roles owner, admin, manager, and employee', () => {
    expect(assertWorkspaceMemberRole('owner')).toBe('owner')
    expect(assertWorkspaceMemberRole('admin')).toBe('admin')
    expect(assertWorkspaceMemberRole('manager')).toBe('manager')
    expect(assertWorkspaceMemberRole('employee')).toBe('employee')
  })

  it('maps legacy organization roles to employee', () => {
    expect(normalizeWorkspaceMemberRole('preparer')).toBe('employee')
    expect(normalizeWorkspaceMemberRole('reviewer')).toBe('employee')
    expect(normalizeWorkspaceMemberRole('read_only')).toBe('employee')
    expect(normalizeWorkspaceMemberRole('client')).toBe('employee')
  })
})

import { describe, expect, it } from 'vitest'
import {
  inheritEngagementAssignmentRole,
  mapWorkspaceRoleToEngagementAssignmentRole,
  staffAssignmentsFromEmployeeIds
} from '../../src/modules/accounting/utils/engagementStaffAssignments'

describe('engagement staff assignment role inheritance', () => {
  it('maps workspace RBAC roles to engagement assignment roles', () => {
    expect(mapWorkspaceRoleToEngagementAssignmentRole('preparer')).toBe('preparer')
    expect(mapWorkspaceRoleToEngagementAssignmentRole('reviewer')).toBe('reviewer')
    expect(mapWorkspaceRoleToEngagementAssignmentRole('manager')).toBe('manager')
    expect(mapWorkspaceRoleToEngagementAssignmentRole('owner')).toBe('manager')
    expect(mapWorkspaceRoleToEngagementAssignmentRole('admin')).toBe('manager')
    expect(mapWorkspaceRoleToEngagementAssignmentRole('read_only')).toBe('member')
    expect(mapWorkspaceRoleToEngagementAssignmentRole('client')).toBe('member')
  })

  it('inherits workspace roles when building assignments from employee ids', () => {
    const roleByUserId = {
      'user-preparer': 'preparer',
      'user-owner': 'owner'
    }
    expect(staffAssignmentsFromEmployeeIds(['user-preparer', 'user-owner'], roleByUserId)).toEqual([
      { clerk_user_id: 'user-preparer', assignment_role: 'preparer' },
      { clerk_user_id: 'user-owner', assignment_role: 'manager' }
    ])
  })

  it('upgrades generic member assignments from workspace RBAC', () => {
    const roleByUserId = { 'user-preparer': 'preparer' }
    expect(inheritEngagementAssignmentRole({
      clerk_user_id: 'user-preparer',
      assignment_role: 'member'
    }, roleByUserId)).toEqual({
      clerk_user_id: 'user-preparer',
      assignment_role: 'preparer'
    })
  })

  it('preserves explicit engagement role overrides', () => {
    const roleByUserId = { 'user-preparer': 'preparer' }
    expect(inheritEngagementAssignmentRole({
      clerk_user_id: 'user-preparer',
      assignment_role: 'reviewer'
    }, roleByUserId)).toEqual({
      clerk_user_id: 'user-preparer',
      assignment_role: 'reviewer'
    })
  })

  it('leaves member assignments unchanged when workspace role also maps to member', () => {
    const roleByUserId = { 'user-client': 'client' }
    expect(inheritEngagementAssignmentRole({
      clerk_user_id: 'user-client',
      assignment_role: 'member'
    }, roleByUserId)).toEqual({
      clerk_user_id: 'user-client',
      assignment_role: 'member'
    })
  })
})

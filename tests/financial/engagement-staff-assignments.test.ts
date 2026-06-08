import { describe, expect, it } from 'vitest'
import {
  normalizeEngagementAssignmentRole,
  staffAssignmentsFromEmployeeIds
} from '../../src/modules/accounting/utils/engagementStaffAssignments'

describe('engagement staff assignments', () => {
  it('defaults legacy employee ids to partner engagement roles', () => {
    expect(staffAssignmentsFromEmployeeIds(['user-a', 'user-b'])).toEqual([
      { clerk_user_id: 'user-a', assignment_role: 'partner' },
      { clerk_user_id: 'user-b', assignment_role: 'partner' }
    ])
  })

  it('supports engagement roles preparer, reviewer, manager, and partner', () => {
    expect(normalizeEngagementAssignmentRole('preparer')).toBe('preparer')
    expect(normalizeEngagementAssignmentRole('reviewer')).toBe('reviewer')
    expect(normalizeEngagementAssignmentRole('manager')).toBe('manager')
    expect(normalizeEngagementAssignmentRole('partner')).toBe('partner')
    expect(normalizeEngagementAssignmentRole('member')).toBe('partner')
    expect(normalizeEngagementAssignmentRole('unknown')).toBe('partner')
  })
})

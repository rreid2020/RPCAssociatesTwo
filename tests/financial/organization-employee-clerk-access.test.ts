import { describe, expect, it } from 'vitest'
import { isIgnorableClerkRemovalError } from '../../api/server/services/clerkAdminService.js'

describe('organization employee Clerk access helpers', () => {
  it('treats missing Clerk membership as ignorable during removal', () => {
    expect(isIgnorableClerkRemovalError('Membership not found')).toBe(true)
    expect(isIgnorableClerkRemovalError('User is not a member of this organization')).toBe(true)
  })

  it('does not treat unrelated Clerk failures as ignorable', () => {
    expect(isIgnorableClerkRemovalError('Invalid API key')).toBe(false)
    expect(isIgnorableClerkRemovalError('Rate limit exceeded')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import {
  MUST_CHANGE_PASSWORD_METADATA_KEY,
  generateTemporaryPassword
} from '../../api/server/services/clerkAdminService.js'

describe('organization employee provisioning helpers', () => {
  it('generates temporary passwords with minimum length', () => {
    const password = generateTemporaryPassword()
    expect(password.length).toBeGreaterThanOrEqual(12)
    expect(password.startsWith('Ax-')).toBe(true)
  })

  it('uses a stable metadata key for forced password changes', () => {
    expect(MUST_CHANGE_PASSWORD_METADATA_KEY).toBe('must_change_password')
  })
})

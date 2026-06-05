import { afterEach, describe, expect, it } from 'vitest'
import { resolveDatabasePoolSizing } from '../../api/server/db/pool.js'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('database pool sizing', () => {
  it('uses production defaults for SaaS scale', () => {
    delete process.env.DATABASE_POOL_MAX
    delete process.env.DATABASE_POOL_MIN
    delete process.env.DATABASE_POOL_LOW_RESOURCE
    process.env.NODE_ENV = 'production'
    expect(resolveDatabasePoolSizing()).toEqual({ max: 12, min: 2, mode: 'production_default' })
  })

  it('honors explicit per-instance overrides', () => {
    process.env.DATABASE_POOL_MAX = '20'
    process.env.DATABASE_POOL_MIN = '4'
    expect(resolveDatabasePoolSizing()).toEqual({ max: 20, min: 4, mode: 'explicit' })
  })

  it('supports low-resource staging databases', () => {
    delete process.env.DATABASE_POOL_MAX
    process.env.DATABASE_POOL_LOW_RESOURCE = 'true'
    expect(resolveDatabasePoolSizing()).toEqual({ max: 1, min: 1, mode: 'low_resource' })
  })
})

/**
 * Run once (or any time) to create taxgpt.* portal tables.
 * Usage (from api/server): npm run db:ensure-portal
 * Requires DB_* (or same env as server) in .env or the environment.
 */
import dotenv from 'dotenv'
import { createPool } from '../db/pool.js'
import { ensurePortalSchema } from '../db/ensurePortalSchema.js'

dotenv.config()

const pool = createPool()

try {
  await ensurePortalSchema(pool)
  console.log('db:ensure-portal finished successfully.')
} catch (e) {
  console.error('db:ensure-portal failed:', e)
  process.exitCode = 1
} finally {
  await pool.end()
}

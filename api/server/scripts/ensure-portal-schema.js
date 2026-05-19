/**
 * Run once (or any time) to create taxgpt.* portal tables.
 * Usage (from api/server): npm run db:ensure-portal
 * Requires DB_* (or same env as server) in .env or the environment.
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { ensurePortalSchema } from '../db/ensurePortalSchema.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const apiEnvPath = path.resolve(__dirname, '../.env')
const portalEnvPath = path.resolve(__dirname, '../../../client-portal/.env')

dotenv.config({ path: apiEnvPath })
dotenv.config({ path: portalEnvPath, override: false })

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

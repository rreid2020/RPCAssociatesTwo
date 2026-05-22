/**
 * Run once (or any time) to create taxgpt.* portal tables.
 * Usage (from api/server): npm run db:ensure-portal
 * Uses api/server/.env as the single runtime DB env source.
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { ensurePortalSchema } from '../db/ensurePortalSchema.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const apiEnvPath = path.resolve(__dirname, '../.env')

dotenv.config({ path: apiEnvPath })

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

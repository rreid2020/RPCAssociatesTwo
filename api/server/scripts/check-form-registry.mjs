import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
try {
  const { rows: [stats] } = await pool.query(`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE status = 'active')::int AS active,
      count(*) FILTER (WHERE status = 'archived')::int AS archived
    FROM taxgpt.form_registry
  `)
  const { rows: sample } = await pool.query(`
    SELECT form_number, title, status, landing_url
    FROM taxgpt.form_registry
    ORDER BY catalog_discovered_at DESC
    LIMIT 3
  `)
  console.log(JSON.stringify({ stats, sample }, null, 2))
} finally {
  await pool.end()
}

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
      count(*) FILTER (WHERE title ILIKE '%slip%' OR title ILIKE '%statement of%')::int AS slip_like,
      count(*) FILTER (WHERE form_number ~ '^T[0-9]')::int AS t_numbered,
      count(*) FILTER (WHERE form_number ~ '^RC[0-9]')::int AS rc_numbered
    FROM taxgpt.form_registry
    WHERE status = 'active'
  `)
  const { rows: slips } = await pool.query(`
    SELECT form_number, title
    FROM taxgpt.form_registry
    WHERE status = 'active'
      AND (
        title ILIKE '%(slip)%'
        OR title ILIKE '%statement of%'
        OR form_number IN ('T4','T5','T3','T4A','T4E','T4RSP','T4RIF','T5008','T2202','T5007','T5013','T5018','T4PS','T4FHSA','T4A(OAS)','T4AP')
      )
    ORDER BY form_number
    LIMIT 80
  `)
  console.log(JSON.stringify({ stats, slipCount: slips.length, slips }, null, 2))
} finally {
  await pool.end()
}

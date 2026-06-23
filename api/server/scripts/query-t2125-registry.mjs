import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
try {
  const { rows } = await pool.query(`
    SELECT form_number, title, status, form_family, landing_url, metadata
    FROM taxgpt.form_registry
    WHERE form_number ILIKE '%2125%'
       OR title ILIKE '%business or professional%'
    ORDER BY form_number
  `)
  console.log('form_registry:', JSON.stringify(rows, null, 2))

  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'taxgpt'
      AND (table_name ILIKE '%form%' OR table_name ILIKE '%schedule%' OR table_name ILIKE '%field%')
    ORDER BY table_name
  `)
  console.log('tables:', tables.rows.map((r) => r.table_name))
} finally {
  await pool.end()
}

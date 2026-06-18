import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
try {
  const codes = ['T4', 'T5', 'T3', 'T4A', 'T2125', 'SCHEDULE3', '5000-S3']
  for (const c of codes) {
    const { rows } = await pool.query(
      `
        SELECT form_number, title, form_family, metadata
        FROM taxgpt.form_registry
        WHERE form_number ILIKE $1
           OR title ILIKE $2
        ORDER BY CASE WHEN form_number = $3 THEN 0 ELSE 1 END
        LIMIT 3
      `,
      [`${c}%`, `%${c}%`, c.replace(/\s+/g, '')]
    )
    console.log(`\n=== ${c} ===`)
    console.log(JSON.stringify(rows, null, 2))
  }
} finally {
  await pool.end()
}

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { classifyFormRegistryFamily } from '../lib/taxSlips/formScope.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
try {
  const { rows } = await pool.query(`
    SELECT id, form_number, title, form_family
    FROM taxgpt.form_registry
    ORDER BY form_number ASC
  `)

  let updated = 0
  const familyCounts = new Map()

  for (const row of rows) {
    const nextFamily = classifyFormRegistryFamily(row.form_number, row.title)
    familyCounts.set(nextFamily, (familyCounts.get(nextFamily) || 0) + 1)
    if (row.form_family === nextFamily) continue
    await pool.query(
      `UPDATE taxgpt.form_registry
       SET form_family = $2, updated_at = now()
       WHERE id = $1::uuid`,
      [row.id, nextFamily]
    )
    updated += 1
  }

  console.log(JSON.stringify({
    total: rows.length,
    updated,
    familyCounts: Object.fromEntries(familyCounts.entries())
  }, null, 2))
} finally {
  await pool.end()
}

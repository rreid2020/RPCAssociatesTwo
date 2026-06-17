import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
try {
  const patterns = [
    { label: 'services/taxes hub paths', sql: `LOWER(url) LIKE '%canada.ca/en/services/taxes%'` },
    { label: 'CRA revenue-agency services', sql: `LOWER(url) LIKE '%revenue-agency/services%'` },
    { label: 'individuals topics (line guides)', sql: `LOWER(url) LIKE '%individuals/topics%'` },
    { label: 'completing-a-tax-return', sql: `LOWER(url) LIKE '%completing-a-tax-return%'` },
    { label: 'GST/HST', sql: `LOWER(url) LIKE '%gst%' OR LOWER(url) LIKE '%hst%'` },
    { label: 'payroll', sql: `LOWER(url) LIKE '%payroll%'` },
    { label: 'business/corporation', sql: `LOWER(url) LIKE '%business%' OR LOWER(url) LIKE '%corporation%'` }
  ]

  for (const p of patterns) {
    const { rows: [row] } = await pool.query(`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE ingest_status = 'ingested')::int AS ingested,
        count(*) FILTER (WHERE ingest_status = 'pending')::int AS pending,
        count(*) FILTER (WHERE ingest_status = 'skipped')::int AS skipped
      FROM taxgpt.sources
      WHERE ${p.sql}
    `)
    console.log(p.label, row)
  }

  const { rows: samples } = await pool.query(`
    SELECT title, url, ingest_status, category
    FROM taxgpt.sources
    WHERE ingest_status = 'ingested'
      AND (
        LOWER(url) LIKE '%individuals/topics%'
        OR LOWER(url) LIKE '%completing-a-tax-return%'
        OR LOWER(url) LIKE '%services/taxes%'
      )
    ORDER BY url
    LIMIT 15
  `)
  console.log('\nSample ingested taxes-hub-adjacent sources:', samples.length)
  for (const row of samples) {
    console.log(`  [${row.category}] ${row.title?.slice(0, 70)}`)
  }

  const { rows: lineGuides } = await pool.query(`
    SELECT title, url, ingest_status
    FROM taxgpt.sources
    WHERE LOWER(url) LIKE '%line-12700%'
       OR LOWER(url) LIKE '%stock-splits%'
       OR LOWER(url) LIKE '%capital-gains/shares%'
    LIMIT 20
  `)
  console.log('\nLine-12700 / capital gains HTML pages:', lineGuides.length)
  for (const row of lineGuides) {
    console.log(`  [${row.ingest_status}] ${row.url?.split('/').slice(-3).join('/')}`)
  }
} finally {
  await pool.end()
}

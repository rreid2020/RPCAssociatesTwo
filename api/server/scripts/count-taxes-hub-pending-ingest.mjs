import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
try {
  const { rows: [r] } = await pool.query(`
    SELECT
      count(*)::int AS taxes_hub_total,
      count(*) FILTER (WHERE ingest_status = 'pending')::int AS pending,
      count(*) FILTER (WHERE ingest_status = 'ingested')::int AS ingested,
      count(*) FILTER (WHERE ingest_status = 'failed')::int AS failed,
      count(*) FILTER (WHERE ingest_status = 'skipped')::int AS skipped,
      count(*) FILTER (
        WHERE ingest_status = 'pending'
          AND page_kind = 'content'
      )::int AS pending_content
    FROM taxgpt.sources
    WHERE metadata::text LIKE '%"corpusRole":"taxes_hub"%'
       OR metadata::text LIKE '%"corpusRole": "taxes_hub"%'
  `)
  console.log(JSON.stringify(r, null, 2))

  const { rows: byStatus } = await pool.query(`
    SELECT ingest_status, count(*)::int AS count
    FROM taxgpt.sources
    WHERE metadata::text LIKE '%taxes_hub%'
    GROUP BY ingest_status
    ORDER BY ingest_status
  `)
  const { rows: [eligible] } = await pool.query(`
    SELECT count(*)::int AS pending_ingest_eligible
    FROM taxgpt.sources
    WHERE metadata::text LIKE '%taxes_hub%'
      AND ingest_status = 'pending'
      AND page_kind = 'content'
      AND coalesce(title, '') !~* '(archived|cancelled|canceled|annul)'
  `)
  console.log('eligible', JSON.stringify(eligible, null, 2))
} finally {
  await pool.end()
}

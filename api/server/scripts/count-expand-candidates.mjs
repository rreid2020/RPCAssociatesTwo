import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
try {
  const { rows } = await pool.query(`
    SELECT
      coalesce(metadata::jsonb->>'corpusRole', '(none)') AS corpus_role,
      page_kind,
      count(*)::int AS count
    FROM taxgpt.sources
    WHERE ingest_status = 'pending'
      AND page_kind IN ('unknown', 'directory')
      AND (
        metadata::text LIKE '%taxes_hub%'
        OR url LIKE '%/en/services/taxes/%'
        OR url LIKE '%canada.ca/en/revenue-agency%'
      )
    GROUP BY 1, 2
    ORDER BY count DESC
    LIMIT 20
  `)
  console.log(JSON.stringify(rows, null, 2))

  const { rows: [strict] } = await pool.query(`
    SELECT count(*)::int AS strict_candidates
    FROM taxgpt.sources
    WHERE ingest_status = 'pending'
      AND page_kind IN ('unknown', 'directory')
      AND (
        metadata::jsonb->>'corpusRole' = 'taxes_hub'
        OR source_type = 'taxes_hub_directory'
      )
  `)
  console.log('strict_candidates', strict.strict_candidates)

  const { rows: metaSamples } = await pool.query(`
    SELECT left(metadata::text, 120) AS metadata_text, page_kind, left(url, 80) AS url
    FROM taxgpt.sources
    WHERE ingest_status = 'pending' AND page_kind = 'unknown'
    LIMIT 3
  `)
  console.log('metadata_samples', JSON.stringify(metaSamples, null, 2))
} finally {
  await pool.end()
}

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
      count(*)::int AS total,
      count(*) FILTER (WHERE page_kind = 'unknown')::int AS unknown,
      count(*) FILTER (WHERE page_kind = 'content')::int AS content,
      count(*) FILTER (WHERE page_kind = 'unknown' AND (metadata::jsonb)->>'corpusRole' = 'taxes_hub')::int AS unknown_taxes_hub,
      count(*) FILTER (WHERE (metadata::jsonb)->>'taxesHubExpanded' = 'true')::int AS marked_expanded,
      count(*) FILTER (
        WHERE ingest_status = 'pending'
          AND (metadata::jsonb)->>'corpusRole' = 'taxes_hub'
          AND page_kind IN ('unknown', 'directory')
      )::int AS expand_candidates
    FROM taxgpt.sources
    WHERE metadata::text LIKE '%taxes_hub%'
       OR url LIKE '%/en/services/taxes/%'
  `)
  console.log(JSON.stringify(r, null, 2))

  const { rows: samples } = await pool.query(`
    SELECT page_kind, ingest_status, metadata, left(url, 90) AS url
    FROM taxgpt.sources
    WHERE metadata::text LIKE '%taxes_hub%'
       OR url LIKE '%/en/services/taxes/%'
    ORDER BY url
    LIMIT 5
  `)
  console.log('samples', JSON.stringify(samples, null, 2))
} finally {
  await pool.end()
}

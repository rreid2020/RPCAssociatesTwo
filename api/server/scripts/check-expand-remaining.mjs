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
      count(*)::int AS pending_total,
      count(*) FILTER (
        WHERE coalesce(metadata->>'taxesHubExpanded', 'false') <> 'true'
      )::int AS pending_not_expanded,
      count(*) FILTER (
        WHERE ingest_status = 'pending'
          AND page_kind IN ('unknown', 'directory')
          AND coalesce(metadata->>'corpusRole', '') = 'taxes_hub'
      )::int AS directory_candidates,
      count(*) FILTER (
        WHERE ingest_status = 'pending'
          AND coalesce(metadata->>'taxesHubExpandTimedOut', 'false') = 'true'
      )::int AS expand_timed_out
    FROM taxgpt.sources
    WHERE metadata::text LIKE '%taxes_hub%'
       OR url LIKE '%/revenue-agency/services/%'
  `)
  console.log(JSON.stringify(r, null, 2))
} finally {
  await pool.end()
}

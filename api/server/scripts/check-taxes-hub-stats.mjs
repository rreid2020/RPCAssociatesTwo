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
      count(*) FILTER (WHERE ingest_status = 'pending')::int AS pending,
      count(*) FILTER (WHERE ingest_status = 'ingested')::int AS ingested,
      count(*) FILTER (WHERE ingest_status = 'skipped')::int AS skipped,
      count(*) FILTER (WHERE page_kind = 'unknown')::int AS unknown,
      count(*) FILTER (WHERE page_kind = 'content')::int AS content
    FROM taxgpt.sources
    WHERE metadata::text LIKE '%taxes_hub%'
       OR url LIKE '%/en/services/taxes/%'
  `)
  const { rows: [hubSeed] } = await pool.query(`
    SELECT count(*)::int AS hub_seed_sources
    FROM taxgpt.sources
    WHERE url = 'https://www.canada.ca/en/services/taxes.html'
  `)
  console.log(JSON.stringify({ ...stats, hubSeedSources: hubSeed.hub_seed_sources }, null, 2))
} finally {
  await pool.end()
}

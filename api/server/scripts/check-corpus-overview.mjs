import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
try {
  const { rows: [corpus] } = await pool.query(`
    SELECT
      count(*)::int AS sources,
      count(*) FILTER (WHERE ingest_status = 'ingested')::int AS ingested,
      count(*) FILTER (WHERE ingest_status = 'pending')::int AS pending,
      count(*) FILTER (WHERE ingest_status = 'failed')::int AS failed,
      count(*) FILTER (WHERE ingest_status = 'skipped')::int AS skipped,
      (SELECT count(*)::int FROM taxgpt.chunks) AS chunks,
      (SELECT count(*)::int FROM taxgpt.embeddings WHERE embedding IS NOT NULL) AS embeddings
    FROM taxgpt.sources
  `)
  const { rows: [feedback] } = await pool.query(`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE status = 'submitted')::int AS submitted,
      count(*) FILTER (WHERE status = 'implemented')::int AS implemented
    FROM taxgpt.feedback
  `)
  const { rows: [feedbackSources] } = await pool.query(`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE ingest_status = 'ingested')::int AS ingested,
      count(*) FILTER (WHERE ingest_status = 'pending')::int AS pending
    FROM taxgpt.sources
    WHERE metadata->>'corpusRole' = 'feedback_action'
       OR metadata->>'feedbackId' IS NOT NULL
  `)
  console.log(JSON.stringify({ corpus, feedback, feedbackSources }, null, 2))
} finally {
  await pool.end()
}

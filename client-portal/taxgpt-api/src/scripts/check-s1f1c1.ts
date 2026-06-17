import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { sql } from 'drizzle-orm'
import { ensureDbValidated, getDb } from '@shared/types'

const __dirname = dirname(fileURLToPath(import.meta.url))

for (const envPath of [
  resolve(__dirname, '../../../../.env'),
  resolve(__dirname, '../../../../api/server/.env'),
  resolve(__dirname, '../../../.env')
]) {
  config({ path: envPath })
}

await ensureDbValidated()
const db = getDb()

const folio = await db.execute(sql`
  SELECT s.title, s.url, s.ingest_status AS "ingestStatus", s.category,
    (SELECT count(*)::int FROM taxgpt.chunks c
     JOIN taxgpt.documents d ON d.id = c.document_id
     WHERE d.source_id = s.id) AS "chunkCount"
  FROM taxgpt.sources s
  WHERE s.url ILIKE '%income-tax-folio-s1-f1-c1-medical%'
`)

const stats = await db.execute(sql`
  SELECT
    (SELECT count(*)::int FROM taxgpt.sources WHERE ingest_status = 'ingested') AS ingested,
    (SELECT count(*)::int FROM taxgpt.embeddings) AS embeddings,
    (SELECT count(*)::int FROM taxgpt.sources WHERE url ILIKE '%income-tax-folio%' AND ingest_status = 'ingested') AS folioIngested
`)

console.log(JSON.stringify({ folio, stats }, null, 2))

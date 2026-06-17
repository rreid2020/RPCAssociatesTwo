import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { retrieveTaxgptChunks } from '../services/taxgptRetrievalRepository.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
const query = 'When is the deadline to file a personal income tax return in Canada?'

try {
  const corpus = await pool.query(`
    SELECT title, url, ingest_status AS "ingestStatus", page_kind AS "pageKind"
    FROM taxgpt.sources
    WHERE url ILIKE '%5000-g%'
       OR url ILIKE '%general-income-tax-benefit%'
       OR title ILIKE '%general income tax%'
       OR title ILIKE '%T1%'
    ORDER BY ingest_status, title
    LIMIT 30
  `)
  console.log('CORPUS MATCHES:', JSON.stringify(corpus.rows, null, 2))

  const chunks = await retrieveTaxgptChunks(pool, query, { topK: 10, minSimilarity: 0.25, language: 'en' })
  console.log('RETRIEVAL:', JSON.stringify(chunks.map((c) => ({
    similarity: c.similarity,
    title: c.citation.sourceTitle,
    url: c.citation.sourceUrl,
    excerpt: c.content.slice(0, 180)
  })), null, 2))
} finally {
  await pool.end()
}

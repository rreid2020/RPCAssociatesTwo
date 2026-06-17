import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { retrieveTaxgptChunks } from '../services/taxgptRetrievalRepository.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
const query = 'Review CRA Guide RC4110, Employee or self-employed?'

const chunks = await retrieveTaxgptChunks(pool, query, { topK: 10, minSimilarity: 0.25, language: 'en' })
console.log('RETRIEVAL:')
console.log(JSON.stringify(chunks.map((c) => ({
  sim: c.similarity,
  title: c.citation.sourceTitle,
  url: c.citation.sourceUrl
})), null, 2))

const { rows } = await pool.query(`
  SELECT title, url, ingest_status, category
  FROM taxgpt.sources
  WHERE url ILIKE '%rc4110%'
     OR title ILIKE '%rc4110%'
     OR title ILIKE '%employee or self-employed%'
  ORDER BY url
  LIMIT 20
`)
console.log('\nCORPUS:')
console.log(JSON.stringify(rows, null, 2))

await pool.end()

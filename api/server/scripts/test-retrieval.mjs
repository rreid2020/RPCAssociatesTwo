import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { retrieveTaxgptChunks } from '../services/taxgptRetrievalRepository.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
const query = 'S1-F1-C1 Medical Expense Tax Credit'

try {
  const chunks = await retrieveTaxgptChunks(pool, query, { topK: 10, minSimilarity: 0.25, language: 'en' })
  console.log(JSON.stringify(chunks.map((c) => ({
    similarity: c.similarity,
    title: c.citation.sourceTitle,
    url: c.citation.sourceUrl,
    excerpt: c.content.slice(0, 120)
  })), null, 2))
} finally {
  await pool.end()
}

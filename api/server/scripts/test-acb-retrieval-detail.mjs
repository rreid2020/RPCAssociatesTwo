import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { embedTaxgptQuery, formatEmbeddingVector } from '../services/taxgptEmbeddingService.js'
import { retrieveTaxgptChunks } from '../services/taxgptRetrievalRepository.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()

try {
  const queries = [
    'Can you provide the ACB calculation rules?',
    'adjusted cost base shares calculation rules',
    'how to calculate adjusted cost base for publicly traded shares'
  ]

  for (const query of queries) {
    console.log('\n===', query)
    const chunks = await retrieveTaxgptChunks(pool, query, { topK: 8, minSimilarity: 0.25 })
    for (const c of chunks) {
      console.log(`  ${c.similarity?.toFixed(3)} | ${c.citation.sourceTitle?.slice(0, 70)}`)
    }
  }

  const vec = formatEmbeddingVector(await embedTaxgptQuery('adjusted cost base ACB shares'))
  const { rows } = await pool.query(
    `
      SELECT
        1 - (e.embedding <=> $1::vector) AS sim,
        s.title,
        LEFT(c.content, 180) AS excerpt
      FROM taxgpt.embeddings e
      JOIN taxgpt.chunks c ON e.chunk_id = c.id
      JOIN taxgpt.documents d ON c.document_id = d.id
      JOIN taxgpt.sources s ON d.source_id = s.id
      WHERE LOWER(s.url) LIKE '%t4037-25e%'
      ORDER BY e.embedding <=> $1::vector
      LIMIT 5
    `,
    [vec]
  )
  console.log('\n=== Direct T4037-25e chunks for ACB query')
  for (const row of rows) {
    console.log(`  ${Number(row.sim).toFixed(3)} | ${row.excerpt?.replace(/\s+/g, ' ')}`)
  }
} finally {
  await pool.end()
}

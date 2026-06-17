import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { embedTaxgptQuery, formatEmbeddingVector } from '../services/taxgptEmbeddingService.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
const query = 'S1-F1-C1 Medical Expense Tax Credit'
const embeddingVector = formatEmbeddingVector(await embedTaxgptQuery(query))

const { rows } = await pool.query(
  `
    WITH top_embeddings AS (
      SELECT e.chunk_id, 1 - (e.embedding <=> $1::vector) AS base_similarity
      FROM taxgpt.embeddings e
      WHERE e.embedding IS NOT NULL
      ORDER BY e.embedding <=> $1::vector
      LIMIT 80
    )
    SELECT te.base_similarity, s.url, s.title, left(c.content, 80) AS excerpt
    FROM top_embeddings te
    JOIN taxgpt.chunks c ON c.id = te.chunk_id
    JOIN taxgpt.documents d ON d.id = c.document_id
    JOIN taxgpt.sources s ON s.id = d.source_id
    WHERE s.url ILIKE '%s1-f1-c1%' OR s.url ILIKE '%medical-expense-tax-credit%'
    ORDER BY te.base_similarity DESC
    LIMIT 15
  `,
  [embeddingVector]
)

console.log('Folio S1-F1-C1 chunks in top 80:', rows.length)
console.log(JSON.stringify(rows, null, 2))

const top = await pool.query(
  `
    WITH top_embeddings AS (
      SELECT e.chunk_id, 1 - (e.embedding <=> $1::vector) AS base_similarity
      FROM taxgpt.embeddings e
      WHERE e.embedding IS NOT NULL
      ORDER BY e.embedding <=> $1::vector
      LIMIT 20
    )
    SELECT te.base_similarity, s.url, s.title
    FROM top_embeddings te
    JOIN taxgpt.chunks c ON c.id = te.chunk_id
    JOIN taxgpt.documents d ON d.id = c.document_id
    JOIN taxgpt.sources s ON s.id = d.source_id
    ORDER BY te.base_similarity DESC
  `,
  [embeddingVector]
)
console.log('\nTop 20 overall:')
console.log(JSON.stringify(top.rows, null, 2))

await pool.end()

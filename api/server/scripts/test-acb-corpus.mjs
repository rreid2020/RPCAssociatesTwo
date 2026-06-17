import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { retrieveTaxgptChunks } from '../services/taxgptRetrievalRepository.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()

try {
  const { rows: sources } = await pool.query(`
    SELECT title, url, ingest_status, category
    FROM taxgpt.sources
    WHERE (
      LOWER(title) LIKE '%adjusted cost%'
      OR LOWER(title) LIKE '%capital gain%'
      OR LOWER(url) LIKE '%folio-s3%'
      OR LOWER(url) LIKE '%s3-f10%'
      OR LOWER(url) LIKE '%it-456%'
      OR LOWER(title) LIKE '%cost base%'
      OR LOWER(title) LIKE '%shares%'
    )
    ORDER BY ingest_status, title
    LIMIT 40
  `)
  console.log('ACB-related sources in corpus:', sources.length)
  for (const row of sources) {
    console.log(`  [${row.ingest_status}] ${row.category} | ${row.title?.slice(0, 90)}`)
  }

  const { rows: keySources } = await pool.query(`
    SELECT title, url, ingest_status, page_kind, error_message
    FROM taxgpt.sources
    WHERE LOWER(url) LIKE '%s3-f10%'
       OR LOWER(title) LIKE '%capital gains 202%'
       OR LOWER(title) LIKE '%folio 1 shares%'
       OR LOWER(title) LIKE '%adjustments to cost base%'
    ORDER BY title
  `)
  console.log('\nKey ACB authority sources:')
  for (const row of keySources) {
    console.log(`  [${row.ingest_status}] ${row.page_kind} | ${row.title}`)
    console.log(`    ${row.url}`)
    if (row.error_message) console.log(`    reason: ${row.error_message}`)
  }

  const query = 'Can you provide the ACB calculation rules?'
  const chunks = await retrieveTaxgptChunks(pool, query, { topK: 10, minSimilarity: 0.25 })
  console.log('\nRetrieval for:', query)
  console.log('Chunks:', chunks.length)
  for (const chunk of chunks) {
    console.log(`  ${chunk.similarity?.toFixed(3)} | ${chunk.citation.sourceTitle?.slice(0, 90)}`)
  }

  const { rows: sharesTree } = await pool.query(`
    SELECT title, url, ingest_status
    FROM taxgpt.sources
    WHERE LOWER(url) LIKE '%folio-1-shares%'
       OR LOWER(url) LIKE '%folio-s3-f1%'
       OR parent_source_id IN (
         SELECT id FROM taxgpt.sources WHERE LOWER(url) LIKE '%folio-1-shares%'
       )
    ORDER BY ingest_status, title
    LIMIT 30
  `)
  console.log('\nShares folio tree:', sharesTree.length)
  for (const row of sharesTree) {
    console.log(`  [${row.ingest_status}] ${row.title?.slice(0, 85)}`)
  }

  const { rows: t4037Tree } = await pool.query(`
    SELECT title, url, ingest_status
    FROM taxgpt.sources
    WHERE LOWER(url) LIKE '%t4037%'
       OR parent_source_id IN (
         SELECT id FROM taxgpt.sources WHERE LOWER(url) LIKE '%publications/t4037%'
       )
    ORDER BY ingest_status, title
    LIMIT 20
  `)
  console.log('\nT4037 capital gains tree:', t4037Tree.length)
  for (const row of t4037Tree) {
    console.log(`  [${row.ingest_status}] ${row.title?.slice(0, 85)} | ${row.url?.split('/').pop()}`)
  }

  const { rows: recentT4037 } = await pool.query(`
    SELECT title, url, ingest_status
    FROM taxgpt.sources
    WHERE LOWER(url) LIKE '%t4037%'
      AND (LOWER(url) LIKE '%25%' OR LOWER(url) LIKE '%24%' OR LOWER(url) LIKE '%23%')
    ORDER BY title
    LIMIT 20
  `)
  console.log('\nRecent T4037 editions:', recentT4037.length)
  for (const row of recentT4037) {
    console.log(`  [${row.ingest_status}] ${row.title} | ${row.url?.split('/').pop()}`)
  }

  const { rows: sharesFolioChapters } = await pool.query(`
    SELECT title, url, ingest_status
    FROM taxgpt.sources
    WHERE LOWER(url) LIKE '%folio-s3-f1%'
       OR LOWER(title) LIKE '%shares%securities%'
    ORDER BY ingest_status, title
    LIMIT 20
  `)
  console.log('\nS3-F1 shares folio chapters:', sharesFolioChapters.length)
  for (const row of sharesFolioChapters) {
    console.log(`  [${row.ingest_status}] ${row.title?.slice(0, 85)}`)
  }
} finally {
  await pool.end()
}

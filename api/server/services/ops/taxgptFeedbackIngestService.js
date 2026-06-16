import crypto from 'crypto'
import { embedTaxgptTexts, formatEmbeddingVector, getEmbedModel } from '../taxgptEmbeddingService.js'

const CHUNK_SIZE = 3000
const CHUNK_OVERLAP = 300
const FETCH_TIMEOUT_MS = 45_000

function contentHash (text) {
  return crypto.createHash('sha256').update(text).digest('hex')
}

function chunkText (text) {
  const chunks = []
  const normalized = String(text || '').trim()
  if (!normalized) return chunks

  for (let index = 0; index < normalized.length; index += CHUNK_SIZE - CHUNK_OVERLAP) {
    const content = normalized.slice(index, index + CHUNK_SIZE).trim()
    if (!content) continue
    chunks.push({
      content,
      chunkIndex: chunks.length
    })
  }
  return chunks
}

function extractTextFromHtml (html, fallbackTitle = '') {
  const cleaned = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
  const titleMatch = cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = (titleMatch?.[1] || fallbackTitle || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const bodyMatch = cleaned.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i)
  const body = bodyMatch?.[1] || cleaned
  const text = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return { text, title }
}

async function fetchHtml (url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RPCAssociates-TaxGPT-Feedback-Ingest/1.0',
        Accept: 'text/html,application/xhtml+xml'
      }
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error(`Unsupported content type: ${contentType || 'unknown'}`)
    }
    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

async function ingestHtmlSource (pool, source) {
  const html = await fetchHtml(source.url)
  const extracted = extractTextFromHtml(html, source.title)
  if (extracted.text.length < 80) {
    await pool.query(
      `UPDATE taxgpt.sources
       SET ingest_status = 'skipped',
           error_message = 'Extracted HTML text was too short',
           last_attempt_at = now()
       WHERE id = $1::uuid`,
      [source.id]
    )
    return { sourceId: source.id, status: 'skipped', reason: 'Extracted HTML text was too short' }
  }

  const hash = contentHash(extracted.text)
  const { rows: existingDocs } = await pool.query(
    `SELECT id FROM taxgpt.documents
     WHERE source_id = $1::uuid AND content_hash = $2
     LIMIT 1`,
    [source.id, hash]
  )
  if (existingDocs[0]?.id) {
    await pool.query(
      `UPDATE taxgpt.sources
       SET ingest_status = 'ingested',
           last_ingested_at = now(),
           last_attempt_at = now(),
           error_code = NULL,
           error_message = NULL
       WHERE id = $1::uuid`,
      [source.id]
    )
    return { sourceId: source.id, status: 'ingested', reason: 'Already ingested with same content hash' }
  }

  const metadata = {
    url: source.url,
    title: extracted.title || source.title,
    type: 'html',
    ingestPath: 'feedback_ops'
  }

  const { rows: [document] } = await pool.query(
    `INSERT INTO taxgpt.documents (source_id, content_hash, metadata)
     VALUES ($1::uuid, $2, $3::jsonb)
     RETURNING id`,
    [source.id, hash, JSON.stringify(metadata)]
  )

  const chunks = chunkText(extracted.text)
  if (chunks.length === 0) {
    throw new Error('Chunking produced zero chunks')
  }

  const embeddings = await embedTaxgptTexts(chunks.map((chunk) => chunk.content))
  const model = getEmbedModel()

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index]
    const { rows: [chunkRow] } = await pool.query(
      `INSERT INTO taxgpt.chunks (document_id, content, chunk_index, metadata)
       VALUES ($1::uuid, $2, $3, $4::jsonb)
       RETURNING id`,
      [
        document.id,
        chunk.content,
        chunk.chunkIndex,
        JSON.stringify({
          documentId: document.id,
          url: source.url,
          title: extracted.title || source.title,
          feedbackIngest: true
        })
      ]
    )
    await pool.query(
      `INSERT INTO taxgpt.embeddings (chunk_id, embedding, model)
       VALUES ($1::uuid, $2::vector, $3)
       ON CONFLICT (chunk_id) DO UPDATE
       SET embedding = EXCLUDED.embedding,
           model = EXCLUDED.model`,
      [chunkRow.id, formatEmbeddingVector(embeddings[index]), model]
    )
  }

  await pool.query(
    `UPDATE taxgpt.sources
     SET ingest_status = 'ingested',
         title = COALESCE(NULLIF($2, ''), title),
         content_hash = $3,
         last_ingested_at = now(),
         last_attempt_at = now(),
         error_code = NULL,
         error_message = NULL
     WHERE id = $1::uuid`,
    [source.id, extracted.title || source.title, hash]
  )

  return {
    sourceId: source.id,
    status: 'ingested',
    chunkCount: chunks.length,
    url: source.url
  }
}

export async function ingestFeedbackSources (pool, sourceIds = [], options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 5, 1), 10)
  const uniqueIds = [...new Set((sourceIds || []).filter(Boolean))].slice(0, limit)
  if (uniqueIds.length === 0) {
    return { ingested: 0, failed: 0, skipped: 0, results: [] }
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required to ingest feedback sources')
  }

  const { rows: sources } = await pool.query(
    `SELECT id, url, title, source_type AS "sourceType", ingest_status AS "ingestStatus"
     FROM taxgpt.sources
     WHERE id = ANY($1::uuid[])`,
    [uniqueIds]
  )

  const results = []
  let ingested = 0
  let failed = 0
  let skipped = 0

  for (const source of sources) {
    if (source.ingestStatus === 'ingested') {
      skipped += 1
      results.push({ sourceId: source.id, status: 'skipped', reason: 'Already ingested' })
      continue
    }
    if (source.sourceType !== 'html' && !String(source.url || '').toLowerCase().endsWith('.html')) {
      skipped += 1
      results.push({ sourceId: source.id, status: 'skipped', reason: 'Only HTML feedback ingest is supported from the portal' })
      continue
    }
    try {
      const result = await ingestHtmlSource(pool, source)
      if (result.status === 'ingested') ingested += 1
      else skipped += 1
      results.push(result)
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : 'Ingest failed'
      await pool.query(
        `UPDATE taxgpt.sources
         SET ingest_status = 'failed',
             error_message = $2,
             last_attempt_at = now()
         WHERE id = $1::uuid`,
        [source.id, message.slice(0, 1000)]
      )
      results.push({ sourceId: source.id, status: 'failed', error: message })
    }
  }

  return { ingested, failed, skipped, results }
}

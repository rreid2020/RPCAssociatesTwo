const CORPUS_STATS_TTL_MS = 60_000
const CORPUS_STATS_QUERY_TIMEOUT_MS = 8_000
let corpusStatsCache = null
let corpusStatsCacheAt = 0

const DEFAULT_CORPUS_STATS = {
  sourceCount: 0,
  ingestedSourceCount: 0,
  pendingSourceCount: 0,
  chunkCount: 0,
  embeddingCount: 0,
  retrievalReady: false
}

function mapCorpusStatsRow (stats = {}) {
  return {
    sourceCount: stats.source_count || 0,
    ingestedSourceCount: stats.ingested_source_count || 0,
    pendingSourceCount: stats.pending_source_count || 0,
    chunkCount: stats.chunk_count || 0,
    embeddingCount: stats.embedding_count || 0,
    retrievalReady: Boolean(stats.retrieval_ready)
  }
}

export async function getTaxgptCorpusStats (pool) {
  if (corpusStatsCache && Date.now() - corpusStatsCacheAt < CORPUS_STATS_TTL_MS) {
    return corpusStatsCache
  }

  const client = await pool.connect()
  try {
    await client.query(`SET statement_timeout = ${CORPUS_STATS_QUERY_TIMEOUT_MS}`)
    const { rows } = await client.query(`
      SELECT
        (SELECT count(*)::int FROM taxgpt.sources) AS source_count,
        (SELECT count(*)::int FROM taxgpt.sources WHERE ingest_status = 'ingested') AS ingested_source_count,
        (SELECT count(*)::int FROM taxgpt.sources WHERE ingest_status = 'pending') AS pending_source_count,
        COALESCE((
          SELECT GREATEST(0, c.reltuples::bigint)::int
          FROM pg_class c
          INNER JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'taxgpt' AND c.relname = 'chunks'
        ), 0) AS chunk_count,
        COALESCE((
          SELECT GREATEST(0, c.reltuples::bigint)::int
          FROM pg_class c
          INNER JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'taxgpt' AND c.relname = 'embeddings'
        ), 0) AS embedding_count,
        EXISTS (
          SELECT 1
          FROM taxgpt.embeddings
          WHERE embedding IS NOT NULL
          LIMIT 1
        ) AS retrieval_ready
    `)
    const result = mapCorpusStatsRow(rows[0] || {})
    corpusStatsCache = result
    corpusStatsCacheAt = Date.now()
    return result
  } catch (error) {
    if (corpusStatsCache) {
      return corpusStatsCache
    }
    return { ...DEFAULT_CORPUS_STATS }
  } finally {
    try {
      await client.query('RESET statement_timeout')
    } catch {}
    client.release()
  }
}

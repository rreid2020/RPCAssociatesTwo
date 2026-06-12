const CORPUS_STATS_TTL_MS = 60_000
const CORPUS_STATS_QUERY_TIMEOUT_MS = 3_000
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

function assumeRetrievalReadyDuringIngest () {
  return process.env.TAXGPT_ASSUME_RETRIEVAL_READY !== 'false'
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

export function getTaxgptCorpusStatsSnapshot () {
  if (corpusStatsCache) {
    return { ...corpusStatsCache }
  }
  return {
    ...DEFAULT_CORPUS_STATS,
    retrievalReady: assumeRetrievalReadyDuringIngest()
  }
}

export function refreshTaxgptCorpusStatsInBackground (pool) {
  void getTaxgptCorpusStats(pool).catch(() => {})
}

export async function getTaxgptCorpusStats (pool) {
  if (corpusStatsCache && Date.now() - corpusStatsCacheAt < CORPUS_STATS_TTL_MS) {
    return { ...corpusStatsCache }
  }

  try {
    const { rows } = await pool.query(`
      SELECT
        COALESCE((
          SELECT GREATEST(0, c.reltuples::bigint)::int
          FROM pg_class c
          INNER JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'taxgpt' AND c.relname = 'sources'
        ), 0) AS source_count,
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
    const stats = rows[0] || {}
    const result = {
      sourceCount: stats.source_count || 0,
      ingestedSourceCount: stats.source_count || 0,
      pendingSourceCount: 0,
      chunkCount: stats.chunk_count || 0,
      embeddingCount: stats.embedding_count || 0,
      retrievalReady: Boolean(stats.retrieval_ready) || assumeRetrievalReadyDuringIngest()
    }
    corpusStatsCache = result
    corpusStatsCacheAt = Date.now()
    return { ...result }
  } catch {
    if (corpusStatsCache) {
      return { ...corpusStatsCache }
    }
    return getTaxgptCorpusStatsSnapshot()
  }
}

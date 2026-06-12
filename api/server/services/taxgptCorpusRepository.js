const CORPUS_STATS_TTL_MS = 60_000
let corpusStatsCache = null
let corpusStatsCacheAt = 0

export async function getTaxgptCorpusStats (pool) {
  if (corpusStatsCache && Date.now() - corpusStatsCacheAt < CORPUS_STATS_TTL_MS) {
    return corpusStatsCache
  }

  const { rows } = await pool.query(`
    SELECT
      (SELECT count(*)::int FROM taxgpt.sources) AS source_count,
      (SELECT count(*)::int FROM taxgpt.sources WHERE ingest_status = 'ingested') AS ingested_source_count,
      (SELECT count(*)::int FROM taxgpt.sources WHERE ingest_status = 'pending') AS pending_source_count,
      (SELECT count(*)::int FROM taxgpt.chunks) AS chunk_count,
      (SELECT count(*)::int FROM taxgpt.embeddings WHERE embedding IS NOT NULL) AS embedding_count
  `)
  const stats = rows[0] || {}
  const result = {
    sourceCount: stats.source_count || 0,
    ingestedSourceCount: stats.ingested_source_count || 0,
    pendingSourceCount: stats.pending_source_count || 0,
    chunkCount: stats.chunk_count || 0,
    embeddingCount: stats.embedding_count || 0,
    retrievalReady: (stats.embedding_count || 0) > 0
  }
  corpusStatsCache = result
  corpusStatsCacheAt = Date.now()
  return result
}

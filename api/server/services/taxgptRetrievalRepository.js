import { embedTaxgptQuery, formatEmbeddingVector } from './taxgptEmbeddingService.js'
import { resolveDocumentDisplayTitle } from './taxgptSourceDisplay.js'
import { filterRetrievedChunks } from './taxgptRetrievalFilters.js'

const DEFAULT_TOP_K = 5
const MAX_TOP_K = 20

function escapeLikePattern (value) {
  return String(value || '').toLowerCase().replace(/'/g, "''")
}

function buildCitation (row, index) {
  const sourceTitle = resolveDocumentDisplayTitle({
    sourceTitle: row.sourceTitle,
    sourceUrl: row.sourceUrl,
    sourceMetadata: row.sourceMetadata,
    parentSourceTitle: row.parentSourceTitle,
    documentMetadata: row.documentMetadata
  })

  return {
    id: `citation-${index}`,
    chunkId: row.chunkId,
    sourceTitle,
    sourceUrl: row.sourceUrl || '',
    sectionHeading: row.sectionHeading || undefined,
    pageNumber: row.pageNumber ?? undefined,
    retrievedAt: new Date().toISOString(),
    similarityScore: Number(row.similarity) || 0
  }
}

export async function retrieveTaxgptChunks (pool, query, options = {}) {
  const topK = Math.min(options.topK || DEFAULT_TOP_K, MAX_TOP_K)
  const minSimilarity = options.minSimilarity ?? 0.25
  const queryEmbedding = await embedTaxgptQuery(query)
  const embeddingVector = formatEmbeddingVector(queryEmbedding)
  const sanitizedQuery = escapeLikePattern(query)
  const vectorLimit = Math.min(topK * 8, 80)

  const { rows } = await pool.query(
    `
      WITH top_embeddings AS (
        SELECT
          e.chunk_id,
          1 - (e.embedding <=> $1::vector) AS base_similarity
        FROM taxgpt.embeddings e
        WHERE e.embedding IS NOT NULL
        ORDER BY e.embedding <=> $1::vector
        LIMIT $2
      ),
      ranked_chunks AS (
        SELECT
          c.id AS "chunkId",
          c.content,
          c.section_heading AS "sectionHeading",
          c.page_number AS "pageNumber",
          s.id AS "sourceId",
          s.url AS "sourceUrl",
          s.title AS "sourceTitle",
          s.category AS "sourceCategory",
          s.metadata AS "sourceMetadata",
          s.parent_source_id AS "parentSourceId",
          s.last_ingested_at AS "lastIngestedAt",
          parent.title AS "parentSourceTitle",
          parent.metadata AS "parentSourceMetadata",
          d.metadata AS "documentMetadata",
          te.base_similarity,
          LEAST(
            1.0,
            te.base_similarity + CASE
              WHEN s.title IS NOT NULL AND LOWER(s.title) LIKE '%' || $3 || '%' THEN 0.15
              WHEN s.url IS NOT NULL AND LOWER(s.url) LIKE '%' || $3 || '%' THEN 0.10
              ELSE 0
            END
          ) AS similarity
        FROM top_embeddings te
        INNER JOIN taxgpt.chunks c ON te.chunk_id = c.id
        INNER JOIN taxgpt.documents d ON c.document_id = d.id
        LEFT JOIN taxgpt.sources s ON d.source_id = s.id
        LEFT JOIN taxgpt.sources parent ON parent.id = s.parent_source_id
      )
      SELECT *
      FROM ranked_chunks
      ORDER BY similarity DESC
      LIMIT $4
    `,
    [embeddingVector, vectorLimit, sanitizedQuery, topK]
  )

  return filterRetrievedChunks(
    rows.filter((row) => (Number(row.similarity) || 0) >= minSimilarity),
    topK,
    { language: options.language }
  ).map((row, index) => ({
    chunkId: row.chunkId,
    content: row.content,
    similarity: Number(row.similarity) || 0,
    sourceCategory: row.sourceCategory,
    sourceMetadata: row.sourceMetadata,
    citation: buildCitation(row, index)
  }))
}

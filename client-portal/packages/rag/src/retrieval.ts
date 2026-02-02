import { sql } from 'drizzle-orm';
import { getDb, DEFAULT_TOP_K, MAX_TOP_K, type Citation } from '@shared/types';
import { EmbeddingService } from './embedding';

export interface RetrievalOptions {
  topK?: number;
  jurisdictionTags?: string[];
  contextDocIds?: string[];
  minSimilarity?: number;
}

export interface RetrievedChunk {
  chunkId: string;
  content: string;
  similarity: number;
  citation: Citation;
}

export class RetrievalService {
  private embeddingService = new EmbeddingService();

  async retrieve(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievedChunk[]> {
    const topK = Math.min(options.topK || DEFAULT_TOP_K, MAX_TOP_K);
    
    // Generate query embedding
    const queryEmbedding = await this.embeddingService.embed(query);

    const db = getDb();

    // Format embedding array for pgvector
    // Use array literal format for pgvector
    const embeddingArrayStr = `[${queryEmbedding.join(',')}]`;

    // Build WHERE conditions for the final filtering (after vector search)
    const filterConditions: string[] = [];

    if (options.contextDocIds && options.contextDocIds.length > 0) {
      // Use IN clause with properly formatted UUIDs
      const uuidList = options.contextDocIds.map(id => `'${id}'`).join(', ');
      filterConditions.push(`documents.id IN (${uuidList})`);
    }

    // Filter by jurisdiction tags if provided
    // Make this filter permissive: include sources with no tags or matching tags
    // Only exclude sources that explicitly have non-matching tags
    if (options.jurisdictionTags && options.jurisdictionTags.length > 0) {
      // Format tags as JSONB array for the query
      // Escape single quotes in the JSON string for SQL safety
      const tagsJson = JSON.stringify(options.jurisdictionTags).replace(/'/g, "''");
      // Include sources if:
      // 1. They have no tags (NULL or empty array) - treat as matching any jurisdiction
      // 2. They have invalid/non-array tags - treat as matching any jurisdiction (permissive)
      // 3. They have tags that match (array with overlapping elements)
      filterConditions.push(
        `(sources.jurisdiction_tags IS NULL OR sources.jurisdiction_tags = '[]'::jsonb OR jsonb_typeof(sources.jurisdiction_tags) != 'array' OR (jsonb_typeof(sources.jurisdiction_tags) = 'array' AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(sources.jurisdiction_tags) AS tag1 CROSS JOIN jsonb_array_elements_text('${tagsJson}'::jsonb) AS tag2 WHERE tag1 = tag2)))`
      );
    }

    // Build WHERE clause for final filtering
    const filterClause = filterConditions.length > 0 
      ? `WHERE ${filterConditions.join(' AND ')}`
      : '';

    // Extract key terms from query for source title matching (sanitized)
    const queryLower = query.toLowerCase();
    const sanitizedQuery = queryLower.replace(/'/g, "''"); // Escape single quotes for SQL
    
    // Optimized query: Use HNSW index efficiently with CTE
    // 1. First, get top K*3 embeddings using the HNSW index (fast vector search)
    // 2. Then join to get metadata and apply filters
    // 3. Boost similarity for sources whose titles/URLs match query terms (up to +0.25 boost)
    // 4. Finally, limit to top K results
    // This approach minimizes the amount of data processed in joins and improves relevance
    const results = await db.execute(sql`
      WITH top_embeddings AS (
        SELECT 
          embeddings.chunk_id,
          1 - (embeddings.embedding <=> ${sql.raw(`'${embeddingArrayStr}'`)}::vector) as base_similarity
        FROM taxgpt.embeddings as embeddings
        WHERE embeddings.embedding IS NOT NULL
        ORDER BY embeddings.embedding <=> ${sql.raw(`'${embeddingArrayStr}'`)}::vector
        LIMIT ${Math.min(topK * 3, 50)}
      ),
      ranked_chunks AS (
        SELECT 
          chunks.id as "chunkId",
          chunks.content,
          chunks.section_heading as "sectionHeading",
          chunks.page_number as "pageNumber",
          documents.id as "documentId",
          sources.id as "sourceId",
          sources.url as "sourceUrl",
          sources.title as "sourceTitle",
          top_embeddings.base_similarity,
          -- Boost similarity if source title or URL contains query terms
          -- This helps prioritize sources that are actually about the topic
          LEAST(1.0, top_embeddings.base_similarity + 
            CASE 
              WHEN sources.title IS NOT NULL AND LOWER(sources.title) LIKE ${sql.raw(`'%${sanitizedQuery}%'`)} THEN 0.15
              WHEN sources.url IS NOT NULL AND LOWER(sources.url) LIKE ${sql.raw(`'%${sanitizedQuery}%'`)} THEN 0.10
              ELSE 0
            END
          ) as similarity
        FROM top_embeddings
        INNER JOIN taxgpt.chunks as chunks ON top_embeddings.chunk_id = chunks.id
        INNER JOIN taxgpt.documents as documents ON chunks.document_id = documents.id
        LEFT JOIN taxgpt.sources as sources ON documents.source_id = sources.id
        ${sql.raw(filterClause)}
      )
      SELECT *
      FROM ranked_chunks
      ORDER BY similarity DESC
      LIMIT ${topK}
    `);

    // Filter by min similarity if provided and format as RetrievedChunk
    const minSim = options.minSimilarity || 0;
    interface ResultRow {
      chunkId: string;
      content: string;
      sectionHeading?: string;
      pageNumber?: number;
      documentId: string;
      sourceId?: string;
      sourceUrl?: string;
      sourceTitle?: string;
      similarity: number;
    }
    // Cast through unknown to handle SQL result type
    const typedResults = results as unknown as ResultRow[];
    return typedResults
      .filter((r) => (r.similarity || 0) >= minSim)
      .map((r, idx) => ({
        chunkId: r.chunkId,
        content: r.content,
        similarity: r.similarity || 0,
        citation: {
          id: `citation-${idx}`,
          chunkId: r.chunkId,
          sourceTitle: r.sourceTitle || 'Unknown',
          sourceUrl: r.sourceUrl || '',
          sectionHeading: r.sectionHeading || undefined,
          pageNumber: r.pageNumber || undefined,
          retrievedAt: new Date(),
          similarityScore: r.similarity || 0,
        },
      }));
  }
}

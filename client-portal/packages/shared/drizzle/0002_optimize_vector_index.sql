-- Optimize vector similarity search index
-- This migration ensures the HNSW index exists with optimal parameters for fast retrieval

-- Drop existing index if it exists (to recreate with better parameters)
DROP INDEX IF EXISTS taxgpt.embeddings_embedding_idx;

-- Create HNSW index with optimized parameters for better performance
-- m = 16: Number of connections per node (higher = more accurate but slower to build)
-- ef_construction = 64: Size of candidate list during construction (higher = more accurate but slower)
CREATE INDEX embeddings_embedding_idx 
ON taxgpt.embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Update table statistics for better query planning
ANALYZE taxgpt.embeddings;
ANALYZE taxgpt.chunks;
ANALYZE taxgpt.documents;
ANALYZE taxgpt.sources;





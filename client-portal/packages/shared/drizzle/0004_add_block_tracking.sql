-- Add block tracking fields to sources table for handling 403/WAF blocks
-- This migration adds support for:
-- - Tracking when sources are blocked
-- - Classifying block types (generic_403, waf_challenge, bot_detection, etc.)
-- - Storing block signatures for analysis

-- Add blocked_at column
ALTER TABLE taxgpt.sources
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP;

-- Add block_type column
ALTER TABLE taxgpt.sources
ADD COLUMN IF NOT EXISTS block_type VARCHAR(50);

-- Add block_reason column
ALTER TABLE taxgpt.sources
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Add block_signature column (JSONB for storing full block signature)
ALTER TABLE taxgpt.sources
ADD COLUMN IF NOT EXISTS block_signature JSONB;

-- Add index on blocked_at for efficient queries
CREATE INDEX IF NOT EXISTS sources_blocked_at_idx ON taxgpt.sources(blocked_at);

-- Add index on block_type for filtering
CREATE INDEX IF NOT EXISTS sources_block_type_idx ON taxgpt.sources(block_type);

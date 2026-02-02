-- Add folio-related fields to sources table for CRA Income Tax Folio ingestion
-- This migration adds support for:
-- - URL normalization and deduplication
-- - Parent-child relationships for directory/content pages
-- - Page kind classification (directory/content/unknown)

-- Add normalized_url column (nullable initially, will be populated and then made unique)
ALTER TABLE taxgpt.sources
ADD COLUMN IF NOT EXISTS normalized_url TEXT;

-- Add parent_source_id column for tracking directory -> content relationships
ALTER TABLE taxgpt.sources
ADD COLUMN IF NOT EXISTS parent_source_id UUID;

-- Add page_kind column to classify pages as directory, content, or unknown
ALTER TABLE taxgpt.sources
ADD COLUMN IF NOT EXISTS page_kind VARCHAR(20);

-- Add foreign key constraint for parent_source_id
DO $$ BEGIN
  ALTER TABLE taxgpt.sources 
  ADD CONSTRAINT sources_parent_source_id_sources_id_fk 
  FOREIGN KEY (parent_source_id) 
  REFERENCES taxgpt.sources(id) 
  ON DELETE SET NULL 
  ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add index on parent_source_id for efficient lookups
CREATE INDEX IF NOT EXISTS sources_parent_source_id_idx ON taxgpt.sources(parent_source_id);

-- Increase source_type column length to accommodate new folio types
-- (cra_folio_directory and cra_folio_content are longer than the original 10 character limit)
ALTER TABLE taxgpt.sources
ALTER COLUMN source_type TYPE VARCHAR(25);

-- Note: UNIQUE constraint on normalized_url will be added in a follow-up migration
-- after existing data has been normalized. This prevents constraint violations during migration.


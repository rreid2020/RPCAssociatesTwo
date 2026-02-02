-- Add error tracking fields to sources table
ALTER TABLE taxgpt.sources
ADD COLUMN IF NOT EXISTS error_code INTEGER,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP;





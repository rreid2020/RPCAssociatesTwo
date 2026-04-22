/**
 * Creates taxgpt schema and portal tables if missing.
 * Idempotent; safe to run on every server start.
 */
export async function ensurePortalSchema (pool) {
  await pool.query('CREATE SCHEMA IF NOT EXISTS taxgpt')
  // Inline SQL to avoid path issues when deployed
  const sql = `
CREATE TABLE IF NOT EXISTS taxgpt.portal_open_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  sort_order INTEGER NOT NULL DEFAULT 0,
  due_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_open_items_clerk_idx ON taxgpt.portal_open_items(clerk_user_id);
CREATE TABLE IF NOT EXISTS taxgpt.portal_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_at TIMESTAMP NOT NULL,
  category VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_deadlines_clerk_due_idx ON taxgpt.portal_deadlines(clerk_user_id, due_at);
CREATE TABLE IF NOT EXISTS taxgpt.portal_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  kind VARCHAR(32) NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_activity_clerk_idx ON taxgpt.portal_activity(clerk_user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS taxgpt.portal_client_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime TEXT,
  size_bytes INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_client_files_clerk_idx ON taxgpt.portal_client_files(clerk_user_id);
CREATE TABLE IF NOT EXISTS taxgpt.portal_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS taxgpt.portal_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES taxgpt.portal_checklists(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS taxgpt.portal_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  provider VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'disconnected',
  connected_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_integrations_clerk_idx ON taxgpt.portal_integrations(clerk_user_id);
`
  await pool.query(sql)
  console.log('Portal schema tables ensured (taxgpt.*)')
}

/**
 * Creates taxgpt schema and portal tables if missing.
 * Idempotent; safe on every run. Uses one statement per query (reliable in node-pg).
 */
const STATEMENTS = [
  'CREATE SCHEMA IF NOT EXISTS taxgpt',
  `CREATE TABLE IF NOT EXISTS taxgpt.portal_open_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  sort_order INTEGER NOT NULL DEFAULT 0,
  due_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS portal_open_items_clerk_idx ON taxgpt.portal_open_items(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.portal_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_at TIMESTAMP NOT NULL,
  category VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS portal_deadlines_clerk_due_idx ON taxgpt.portal_deadlines(clerk_user_id, due_at)',

  `CREATE TABLE IF NOT EXISTS taxgpt.portal_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  kind VARCHAR(32) NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS portal_activity_clerk_idx ON taxgpt.portal_activity(clerk_user_id, created_at DESC)',

  `CREATE TABLE IF NOT EXISTS taxgpt.portal_client_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime TEXT,
  size_bytes INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS portal_client_files_clerk_idx ON taxgpt.portal_client_files(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.portal_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  parent_id UUID NULL REFERENCES taxgpt.portal_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT portal_folders_name_len CHECK (char_length(trim(name)) > 0 AND char_length(btrim(name)) < 200)
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS portal_folders_sibling_name_ux
  ON taxgpt.portal_folders (clerk_user_id, (COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)), (lower(btrim(name))))`,

  'CREATE INDEX IF NOT EXISTS portal_folders_clerk_idx ON taxgpt.portal_folders(clerk_user_id)',
  'CREATE INDEX IF NOT EXISTS portal_folders_parent_idx ON taxgpt.portal_folders(clerk_user_id, parent_id)',

  'ALTER TABLE taxgpt.portal_client_files ADD COLUMN IF NOT EXISTS folder_id UUID NULL REFERENCES taxgpt.portal_folders(id) ON DELETE SET NULL',
  'CREATE INDEX IF NOT EXISTS portal_client_files_clerk_folder_idx ON taxgpt.portal_client_files(clerk_user_id, folder_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.portal_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.portal_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES taxgpt.portal_checklists(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,

  `CREATE TABLE IF NOT EXISTS taxgpt.portal_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  provider VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'disconnected',
  connected_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS portal_integrations_clerk_idx ON taxgpt.portal_integrations(clerk_user_id)'
]

export async function ensurePortalSchema (pool) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const sql of STATEMENTS) {
      await client.query(sql)
    }
    await client.query('COMMIT')
  } catch (e) {
    try {
      await client.query('ROLLBACK')
    } catch { /* ignore */ }
    throw e
  } finally {
    client.release()
  }
  const filesOk = await pool.query(
    `SELECT to_regclass('taxgpt.portal_client_files') IS NOT NULL AS ok`
  )
  if (!filesOk.rows[0]?.ok) {
    throw new Error('ensurePortalSchema: taxgpt.portal_client_files was not created')
  }
  const foldersOk = await pool.query(
    `SELECT to_regclass('taxgpt.portal_folders') IS NOT NULL AS ok`
  )
  if (!foldersOk.rows[0]?.ok) {
    throw new Error('ensurePortalSchema: taxgpt.portal_folders was not created')
  }
  console.log('Portal schema tables ensured (taxgpt.*, verified portal_client_files, portal_folders)')
}

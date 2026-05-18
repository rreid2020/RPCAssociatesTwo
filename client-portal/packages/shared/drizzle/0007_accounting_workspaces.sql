-- Accounting workspace / membership layer

CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  role VARCHAR(24) NOT NULL DEFAULT 'preparer',
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  invited_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, clerk_user_id)
);

CREATE INDEX IF NOT EXISTS accounting_workspace_members_user_idx
  ON taxgpt.accounting_workspace_members(clerk_user_id, status);

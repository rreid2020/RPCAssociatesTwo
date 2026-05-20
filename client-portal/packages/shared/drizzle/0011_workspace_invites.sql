-- Workspace invites for employee onboarding workflow

CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  invite_email TEXT,
  invite_token TEXT NOT NULL UNIQUE,
  role VARCHAR(24) NOT NULL DEFAULT 'preparer',
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  invited_by TEXT NOT NULL,
  accepted_by TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_workspace_invites_workspace_idx
  ON taxgpt.accounting_workspace_invites(workspace_id, status, created_at DESC);

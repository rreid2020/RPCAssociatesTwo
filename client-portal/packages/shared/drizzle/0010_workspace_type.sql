-- Workspace type classification for accounting workspace UX
-- business = company internal accounting team
-- firm = accounting firm serving many client entities

ALTER TABLE taxgpt.accounting_workspaces
  ADD COLUMN IF NOT EXISTS workspace_type VARCHAR(16);

UPDATE taxgpt.accounting_workspaces
SET workspace_type = 'business'
WHERE workspace_type IS NULL;

ALTER TABLE taxgpt.accounting_workspaces
  ALTER COLUMN workspace_type SET DEFAULT 'business';

ALTER TABLE taxgpt.accounting_workspaces
  ALTER COLUMN workspace_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'accounting_workspaces_workspace_type_chk'
  ) THEN
    ALTER TABLE taxgpt.accounting_workspaces
      ADD CONSTRAINT accounting_workspaces_workspace_type_chk
      CHECK (workspace_type IN ('business', 'firm'));
  END IF;
END $$;

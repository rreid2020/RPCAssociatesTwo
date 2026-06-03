-- Cached effective permissions for company/firm employees (organization members).
-- workspace_id references the legacy execution scope where custom roles are stored today.
CREATE TABLE IF NOT EXISTS taxgpt.organization_member_rbac_cache (
  organization_id UUID NOT NULL REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL,
  platform_role TEXT NOT NULL,
  custom_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  computed_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, clerk_user_id)
);

CREATE INDEX IF NOT EXISTS organization_member_rbac_cache_workspace_idx
  ON taxgpt.organization_member_rbac_cache(workspace_id);

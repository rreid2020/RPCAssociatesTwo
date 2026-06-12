-- Add individual workspace type for personal taxpayer accounts

ALTER TABLE taxgpt.accounting_workspaces
  DROP CONSTRAINT IF EXISTS accounting_workspaces_workspace_type_chk;

ALTER TABLE taxgpt.accounting_workspaces
  ADD CONSTRAINT accounting_workspaces_workspace_type_chk
  CHECK (workspace_type IN ('business', 'firm', 'individual'));

ALTER TABLE taxgpt.accounting_organizations
  DROP CONSTRAINT IF EXISTS accounting_organizations_org_type_chk;

ALTER TABLE taxgpt.accounting_organizations
  ADD CONSTRAINT accounting_organizations_org_type_chk
  CHECK (organization_type IN ('business', 'firm', 'individual'));

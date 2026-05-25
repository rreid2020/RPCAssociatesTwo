-- Transitional repair for legacy rows where organization_id stored a workspace id.
-- This migration is additive and safe to rerun.

WITH workspace_to_org AS (
  SELECT w.id AS legacy_workspace_id, w.organization_id AS canonical_organization_id
  FROM taxgpt.accounting_workspaces w
  WHERE w.organization_id IS NOT NULL
)
UPDATE taxgpt.accounting_clients c
SET organization_id = m.canonical_organization_id
FROM workspace_to_org m
WHERE c.organization_id = m.legacy_workspace_id
  AND c.organization_id <> m.canonical_organization_id;

WITH workspace_to_org AS (
  SELECT w.id AS legacy_workspace_id, w.organization_id AS canonical_organization_id
  FROM taxgpt.accounting_workspaces w
  WHERE w.organization_id IS NOT NULL
)
UPDATE taxgpt.accounting_engagements e
SET organization_id = m.canonical_organization_id
FROM workspace_to_org m
WHERE e.organization_id = m.legacy_workspace_id
  AND e.organization_id <> m.canonical_organization_id;

WITH workspace_to_org AS (
  SELECT w.id AS legacy_workspace_id, w.organization_id AS canonical_organization_id
  FROM taxgpt.accounting_workspaces w
  WHERE w.organization_id IS NOT NULL
)
UPDATE taxgpt.source_connections s
SET organization_id = m.canonical_organization_id
FROM workspace_to_org m
WHERE s.organization_id = m.legacy_workspace_id
  AND s.organization_id <> m.canonical_organization_id;

WITH workspace_to_org AS (
  SELECT w.id AS legacy_workspace_id, w.organization_id AS canonical_organization_id
  FROM taxgpt.accounting_workspaces w
  WHERE w.organization_id IS NOT NULL
)
UPDATE taxgpt.account_mapping_groups g
SET organization_id = m.canonical_organization_id
FROM workspace_to_org m
WHERE g.organization_id = m.legacy_workspace_id
  AND g.organization_id <> m.canonical_organization_id;

WITH workspace_to_org AS (
  SELECT w.id AS legacy_workspace_id, w.organization_id AS canonical_organization_id
  FROM taxgpt.accounting_workspaces w
  WHERE w.organization_id IS NOT NULL
)
UPDATE taxgpt.accounting_audit_log a
SET organization_id = m.canonical_organization_id
FROM workspace_to_org m
WHERE a.organization_id = m.legacy_workspace_id
  AND a.organization_id <> m.canonical_organization_id;

-- Backfill engagement workspace scope where possible using client -> workspace mapping.
UPDATE taxgpt.accounting_engagements e
SET workspace_id = w.id
FROM taxgpt.accounting_clients c
JOIN taxgpt.accounting_workspaces w
  ON w.organization_id = c.organization_id
WHERE e.workspace_id IS NULL
  AND e.client_id = c.id
  AND (e.organization_id IS NULL OR e.organization_id = c.organization_id);

-- Phase 1: add organization_id fields for accounting tenant scoping

ALTER TABLE taxgpt.accounting_clients
  ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE taxgpt.accounting_engagements
  ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE taxgpt.account_mapping_groups
  ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE taxgpt.accounting_audit_log
  ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE taxgpt.source_connections
  ADD COLUMN IF NOT EXISTS organization_id UUID;

CREATE INDEX IF NOT EXISTS accounting_clients_org_idx
  ON taxgpt.accounting_clients(organization_id);

CREATE INDEX IF NOT EXISTS accounting_engagements_org_idx
  ON taxgpt.accounting_engagements(organization_id, status);

CREATE INDEX IF NOT EXISTS accounting_audit_log_org_idx
  ON taxgpt.accounting_audit_log(organization_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS account_mapping_groups_code_org_ux
  ON taxgpt.account_mapping_groups(organization_id, code)
  WHERE organization_id IS NOT NULL;

-- Phase 2: create default personal workspaces for existing accounting rows when missing
WITH distinct_users AS (
  SELECT clerk_user_id AS user_id FROM taxgpt.accounting_clients WHERE clerk_user_id IS NOT NULL
  UNION
  SELECT clerk_user_id AS user_id FROM taxgpt.accounting_engagements WHERE clerk_user_id IS NOT NULL
  UNION
  SELECT clerk_user_id AS user_id FROM taxgpt.source_connections WHERE clerk_user_id IS NOT NULL
  UNION
  SELECT clerk_user_id AS user_id FROM taxgpt.account_mapping_groups WHERE clerk_user_id IS NOT NULL
),
missing_personal AS (
  SELECT d.user_id
  FROM distinct_users d
  LEFT JOIN taxgpt.accounting_workspaces w
    ON w.owner_user_id = d.user_id AND w.is_personal = true
  WHERE w.id IS NULL
),
inserted_workspaces AS (
  INSERT INTO taxgpt.accounting_workspaces (owner_user_id, name, slug, is_personal, created_at, updated_at)
  SELECT
    m.user_id,
    'My Accounting Workspace',
    'personal-' || substring(md5(m.user_id) for 16),
    true,
    now(),
    now()
  FROM missing_personal m
  RETURNING id, owner_user_id
)
INSERT INTO taxgpt.accounting_workspace_members (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
SELECT i.id, i.owner_user_id, 'owner', 'active', i.owner_user_id, now(), now()
FROM inserted_workspaces i
ON CONFLICT (workspace_id, clerk_user_id) DO NOTHING;

-- Ensure membership for pre-existing personal workspaces
INSERT INTO taxgpt.accounting_workspace_members (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
SELECT w.id, w.owner_user_id, 'owner', 'active', w.owner_user_id, now(), now()
FROM taxgpt.accounting_workspaces w
LEFT JOIN taxgpt.accounting_workspace_members m
  ON m.workspace_id = w.id AND m.clerk_user_id = w.owner_user_id
WHERE w.is_personal = true
  AND m.id IS NULL
ON CONFLICT (workspace_id, clerk_user_id) DO NOTHING;

-- Phase 3: backfill organization_id from personal workspace ownership
WITH personal_map AS (
  SELECT owner_user_id, id AS organization_id
  FROM taxgpt.accounting_workspaces
  WHERE is_personal = true
)
UPDATE taxgpt.accounting_clients c
SET organization_id = p.organization_id
FROM personal_map p
WHERE c.organization_id IS NULL
  AND c.clerk_user_id = p.owner_user_id;

WITH personal_map AS (
  SELECT owner_user_id, id AS organization_id
  FROM taxgpt.accounting_workspaces
  WHERE is_personal = true
)
UPDATE taxgpt.accounting_engagements e
SET organization_id = p.organization_id
FROM personal_map p
WHERE e.organization_id IS NULL
  AND e.clerk_user_id = p.owner_user_id;

WITH personal_map AS (
  SELECT owner_user_id, id AS organization_id
  FROM taxgpt.accounting_workspaces
  WHERE is_personal = true
)
UPDATE taxgpt.source_connections s
SET organization_id = p.organization_id
FROM personal_map p
WHERE s.organization_id IS NULL
  AND s.clerk_user_id = p.owner_user_id;

WITH personal_map AS (
  SELECT owner_user_id, id AS organization_id
  FROM taxgpt.accounting_workspaces
  WHERE is_personal = true
)
UPDATE taxgpt.account_mapping_groups g
SET organization_id = p.organization_id
FROM personal_map p
WHERE g.organization_id IS NULL
  AND g.clerk_user_id = p.owner_user_id;

WITH personal_map AS (
  SELECT owner_user_id, id AS organization_id
  FROM taxgpt.accounting_workspaces
  WHERE is_personal = true
)
UPDATE taxgpt.accounting_audit_log a
SET organization_id = p.organization_id
FROM personal_map p
WHERE a.organization_id IS NULL
  AND a.clerk_user_id = p.owner_user_id;

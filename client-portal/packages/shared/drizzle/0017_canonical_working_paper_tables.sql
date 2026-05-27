-- Canonical working-papers tables and tenant metadata hardening.
-- This migration is additive and idempotent.

CREATE TABLE IF NOT EXISTS taxgpt.leadsheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  legacy_lead_sheet_id UUID UNIQUE REFERENCES taxgpt.lead_sheets(id) ON DELETE SET NULL,
  section_code VARCHAR(8) NOT NULL,
  section_name TEXT NOT NULL,
  financial_statement_area VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'not_started',
  preparer_id TEXT,
  reviewer_id TEXT,
  prepared_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  conclusion_text TEXT,
  risk_level VARCHAR(16) NOT NULL DEFAULT 'medium',
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS leadsheets_engagement_section_ux
  ON taxgpt.leadsheets(engagement_id, section_code)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS leadsheets_workspace_idx
  ON taxgpt.leadsheets(workspace_id, engagement_id, status);

CREATE TABLE IF NOT EXISTS taxgpt.leadsheet_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  leadsheet_id UUID NOT NULL REFERENCES taxgpt.leadsheets(id) ON DELETE CASCADE,
  trial_balance_account_id UUID NOT NULL REFERENCES taxgpt.trial_balance_accounts(id) ON DELETE CASCADE,
  legacy_lead_sheet_account_id UUID UNIQUE REFERENCES taxgpt.lead_sheet_accounts(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS leadsheet_accounts_unique_row_ux
  ON taxgpt.leadsheet_accounts(leadsheet_id, trial_balance_account_id)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS leadsheet_accounts_engagement_idx
  ON taxgpt.leadsheet_accounts(engagement_id, leadsheet_id, sort_order);

CREATE TABLE IF NOT EXISTS taxgpt.adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  legacy_adjustment_entry_id UUID UNIQUE REFERENCES taxgpt.adjustment_entries(id) ON DELETE SET NULL,
  journal_entry_id UUID REFERENCES taxgpt.journal_entries(id) ON DELETE SET NULL,
  adjustment_number TEXT NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  source VARCHAR(24) NOT NULL DEFAULT 'manual',
  created_by TEXT NOT NULL,
  updated_by TEXT,
  approved_by TEXT,
  posted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS adjustments_number_ux
  ON taxgpt.adjustments(engagement_id, adjustment_number)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS adjustments_status_idx
  ON taxgpt.adjustments(workspace_id, engagement_id, status);

CREATE TABLE IF NOT EXISTS taxgpt.review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE SET NULL,
  review_note_id UUID REFERENCES taxgpt.review_notes(id) ON DELETE SET NULL,
  assignment_type VARCHAR(24) NOT NULL,
  assigned_to TEXT NOT NULL,
  assigned_by TEXT,
  assignment_state VARCHAR(24) NOT NULL DEFAULT 'active',
  due_date DATE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  completed_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS review_assignments_engagement_idx
  ON taxgpt.review_assignments(workspace_id, engagement_id, assignment_state, created_at DESC);

-- Harden existing core tables with tenant and actor metadata.
ALTER TABLE taxgpt.trial_balances ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE taxgpt.trial_balances ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE taxgpt.trial_balances ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE taxgpt.trial_balances ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trial_balances_organization_fk'
  ) THEN
    ALTER TABLE taxgpt.trial_balances
      ADD CONSTRAINT trial_balances_organization_fk
      FOREIGN KEY (organization_id) REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trial_balances_workspace_fk'
  ) THEN
    ALTER TABLE taxgpt.trial_balances
      ADD CONSTRAINT trial_balances_workspace_fk
      FOREIGN KEY (workspace_id) REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS engagement_id UUID;
ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trial_balance_accounts_organization_fk'
  ) THEN
    ALTER TABLE taxgpt.trial_balance_accounts
      ADD CONSTRAINT trial_balance_accounts_organization_fk
      FOREIGN KEY (organization_id) REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trial_balance_accounts_workspace_fk'
  ) THEN
    ALTER TABLE taxgpt.trial_balance_accounts
      ADD CONSTRAINT trial_balance_accounts_workspace_fk
      FOREIGN KEY (workspace_id) REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trial_balance_accounts_engagement_fk'
  ) THEN
    ALTER TABLE taxgpt.trial_balance_accounts
      ADD CONSTRAINT trial_balance_accounts_engagement_fk
      FOREIGN KEY (engagement_id) REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE taxgpt.review_notes ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE taxgpt.review_notes ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE taxgpt.review_notes ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE taxgpt.review_notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'review_notes_organization_fk'
  ) THEN
    ALTER TABLE taxgpt.review_notes
      ADD CONSTRAINT review_notes_organization_fk
      FOREIGN KEY (organization_id) REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'review_notes_workspace_fk'
  ) THEN
    ALTER TABLE taxgpt.review_notes
      ADD CONSTRAINT review_notes_workspace_fk
      FOREIGN KEY (workspace_id) REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill tenant metadata on trial balances.
UPDATE taxgpt.trial_balances tb
SET
  organization_id = e.organization_id,
  workspace_id = e.workspace_id,
  updated_by = COALESCE(tb.updated_by, tb.imported_by)
FROM taxgpt.accounting_engagements e
WHERE e.id = tb.engagement_id
  AND (tb.organization_id IS NULL OR tb.workspace_id IS NULL OR tb.updated_by IS NULL);

-- Backfill tenant metadata on trial balance accounts.
UPDATE taxgpt.trial_balance_accounts tba
SET
  organization_id = tb.organization_id,
  workspace_id = tb.workspace_id,
  engagement_id = tb.engagement_id,
  created_by = COALESCE(tba.created_by, tb.imported_by),
  updated_by = COALESCE(tba.updated_by, tb.imported_by)
FROM taxgpt.trial_balances tb
WHERE tb.id = tba.trial_balance_id
  AND (
    tba.organization_id IS NULL
    OR tba.workspace_id IS NULL
    OR tba.engagement_id IS NULL
    OR tba.created_by IS NULL
    OR tba.updated_by IS NULL
  );

-- Backfill tenant metadata on review notes.
UPDATE taxgpt.review_notes rn
SET
  organization_id = e.organization_id,
  workspace_id = e.workspace_id,
  updated_by = COALESCE(rn.updated_by, rn.created_by)
FROM taxgpt.accounting_engagements e
WHERE e.id = rn.engagement_id
  AND (rn.organization_id IS NULL OR rn.workspace_id IS NULL OR rn.updated_by IS NULL);

-- Backfill canonical leadsheets from legacy lead_sheets.
INSERT INTO taxgpt.leadsheets (
  legacy_lead_sheet_id,
  organization_id,
  workspace_id,
  engagement_id,
  section_code,
  section_name,
  financial_statement_area,
  status,
  preparer_id,
  reviewer_id,
  prepared_at,
  reviewed_at,
  conclusion_text,
  risk_level,
  created_by,
  updated_by,
  created_at,
  updated_at
)
SELECT
  ls.id,
  e.organization_id,
  e.workspace_id,
  ls.engagement_id,
  ls.section_code,
  ls.section_name,
  ls.financial_statement_area,
  ls.status,
  ls.preparer_id,
  ls.reviewer_id,
  ls.prepared_at,
  ls.reviewed_at,
  ls.conclusion_text,
  ls.risk_level,
  COALESCE(ls.preparer_id, e.created_by),
  COALESCE(ls.reviewer_id, ls.preparer_id, e.created_by),
  ls.created_at,
  ls.updated_at
FROM taxgpt.lead_sheets ls
INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
WHERE NOT EXISTS (
  SELECT 1 FROM taxgpt.leadsheets nls WHERE nls.legacy_lead_sheet_id = ls.id
);

-- Backfill review assignments from lead sheet preparer/reviewer ownership and open review notes.
INSERT INTO taxgpt.review_assignments (
  organization_id,
  workspace_id,
  engagement_id,
  lead_sheet_id,
  review_note_id,
  assignment_type,
  assigned_to,
  assigned_by,
  assignment_state,
  due_date,
  metadata,
  created_at,
  updated_at
)
SELECT
  e.organization_id,
  e.workspace_id,
  ls.engagement_id,
  ls.id,
  NULL,
  'preparer',
  ls.preparer_id,
  ls.preparer_id,
  CASE WHEN ls.prepared_at IS NOT NULL THEN 'completed' ELSE 'active' END,
  e.due_date,
  jsonb_build_object('source', 'lead_sheets.preparer_id'),
  ls.created_at,
  ls.updated_at
FROM taxgpt.lead_sheets ls
INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
WHERE ls.preparer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM taxgpt.review_assignments ra
    WHERE ra.lead_sheet_id = ls.id
      AND ra.assignment_type = 'preparer'
      AND ra.assigned_to = ls.preparer_id
      AND ra.deleted_at IS NULL
  );

INSERT INTO taxgpt.review_assignments (
  organization_id,
  workspace_id,
  engagement_id,
  lead_sheet_id,
  review_note_id,
  assignment_type,
  assigned_to,
  assigned_by,
  assignment_state,
  due_date,
  metadata,
  created_at,
  updated_at,
  completed_at
)
SELECT
  e.organization_id,
  e.workspace_id,
  ls.engagement_id,
  ls.id,
  NULL,
  'reviewer',
  ls.reviewer_id,
  ls.preparer_id,
  CASE WHEN ls.reviewed_at IS NOT NULL THEN 'completed' ELSE 'active' END,
  e.due_date,
  jsonb_build_object('source', 'lead_sheets.reviewer_id'),
  ls.created_at,
  ls.updated_at,
  ls.reviewed_at
FROM taxgpt.lead_sheets ls
INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
WHERE ls.reviewer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM taxgpt.review_assignments ra
    WHERE ra.lead_sheet_id = ls.id
      AND ra.assignment_type = 'reviewer'
      AND ra.assigned_to = ls.reviewer_id
      AND ra.deleted_at IS NULL
  );

INSERT INTO taxgpt.review_assignments (
  organization_id,
  workspace_id,
  engagement_id,
  lead_sheet_id,
  review_note_id,
  assignment_type,
  assigned_to,
  assigned_by,
  assignment_state,
  due_date,
  metadata,
  created_at,
  updated_at,
  completed_at
)
SELECT
  rn.organization_id,
  rn.workspace_id,
  rn.engagement_id,
  rn.lead_sheet_id,
  rn.id,
  'review_note',
  rn.assigned_to,
  rn.created_by,
  CASE WHEN rn.status IN ('addressed', 'cleared') THEN 'completed' ELSE 'active' END,
  e.due_date,
  jsonb_build_object('source', 'review_notes.assigned_to', 'priority', rn.priority),
  rn.created_at,
  rn.updated_at,
  rn.resolved_at
FROM taxgpt.review_notes rn
INNER JOIN taxgpt.accounting_engagements e ON e.id = rn.engagement_id
WHERE rn.assigned_to IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM taxgpt.review_assignments ra
    WHERE ra.review_note_id = rn.id
      AND ra.assignment_type = 'review_note'
      AND ra.assigned_to = rn.assigned_to
      AND ra.deleted_at IS NULL
  );

-- Backfill canonical leadsheet accounts from legacy lead_sheet_accounts.
INSERT INTO taxgpt.leadsheet_accounts (
  legacy_lead_sheet_account_id,
  organization_id,
  workspace_id,
  engagement_id,
  leadsheet_id,
  trial_balance_account_id,
  sort_order,
  created_by,
  updated_by,
  created_at,
  updated_at
)
SELECT
  lsa.id,
  nls.organization_id,
  nls.workspace_id,
  nls.engagement_id,
  nls.id,
  lsa.trial_balance_account_id,
  lsa.sort_order,
  nls.created_by,
  nls.updated_by,
  lsa.created_at,
  lsa.updated_at
FROM taxgpt.lead_sheet_accounts lsa
INNER JOIN taxgpt.leadsheets nls ON nls.legacy_lead_sheet_id = lsa.lead_sheet_id
WHERE NOT EXISTS (
  SELECT 1
  FROM taxgpt.leadsheet_accounts nlsa
  WHERE nlsa.legacy_lead_sheet_account_id = lsa.id
);

-- Backfill canonical adjustments from legacy adjustment_entries.
INSERT INTO taxgpt.adjustments (
  legacy_adjustment_entry_id,
  organization_id,
  workspace_id,
  engagement_id,
  adjustment_number,
  description,
  status,
  source,
  created_by,
  updated_by,
  approved_by,
  posted_at,
  created_at,
  updated_at
)
SELECT
  ae.id,
  e.organization_id,
  e.workspace_id,
  ae.engagement_id,
  ae.entry_number,
  ae.description,
  ae.status,
  ae.source,
  ae.created_by,
  COALESCE(ae.approved_by, ae.created_by),
  ae.approved_by,
  ae.posted_at,
  ae.created_at,
  ae.updated_at
FROM taxgpt.adjustment_entries ae
INNER JOIN taxgpt.accounting_engagements e ON e.id = ae.engagement_id
WHERE NOT EXISTS (
  SELECT 1 FROM taxgpt.adjustments na WHERE na.legacy_adjustment_entry_id = ae.id
);


CREATE TABLE IF NOT EXISTS taxgpt.working_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE SET NULL,
  paper_code VARCHAR(24) NOT NULL,
  title TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'not_started',
  due_date DATE,
  prepared_by TEXT,
  reviewed_by TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS working_papers_engagement_code_ux ON taxgpt.working_papers(engagement_id, paper_code);
CREATE INDEX IF NOT EXISTS working_papers_engagement_idx ON taxgpt.working_papers(engagement_id, status);

CREATE TABLE IF NOT EXISTS taxgpt.working_paper_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  working_paper_id UUID NOT NULL REFERENCES taxgpt.working_papers(id) ON DELETE CASCADE,
  section_key VARCHAR(32) NOT NULL,
  section_label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'not_started',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS working_paper_sections_key_ux ON taxgpt.working_paper_sections(working_paper_id, section_key);

CREATE TABLE IF NOT EXISTS taxgpt.working_paper_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID NOT NULL REFERENCES taxgpt.lead_sheets(id) ON DELETE CASCADE,
  working_paper_id UUID REFERENCES taxgpt.working_papers(id) ON DELETE SET NULL,
  section_id UUID REFERENCES taxgpt.working_paper_sections(id) ON DELETE SET NULL,
  trial_balance_account_id UUID NOT NULL REFERENCES taxgpt.trial_balance_accounts(id) ON DELETE CASCADE,
  row_label TEXT NOT NULL,
  reconciliation_state VARCHAR(24) NOT NULL DEFAULT 'not_started',
  review_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  signoff_state VARCHAR(24) NOT NULL DEFAULT 'unsigned',
  assigned_preparer_id TEXT,
  assigned_reviewer_id TEXT,
  due_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS working_paper_rows_lead_sheet_idx ON taxgpt.working_paper_rows(lead_sheet_id, review_status);
CREATE INDEX IF NOT EXISTS working_paper_rows_engagement_idx ON taxgpt.working_paper_rows(engagement_id, due_date);

CREATE TABLE IF NOT EXISTS taxgpt.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  adjustment_entry_id UUID REFERENCES taxgpt.adjustment_entries(id) ON DELETE SET NULL,
  entry_number TEXT NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  source VARCHAR(24) NOT NULL DEFAULT 'manual',
  created_by TEXT NOT NULL,
  approved_by TEXT,
  posted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS journal_entries_number_ux ON taxgpt.journal_entries(engagement_id, entry_number);

CREATE TABLE IF NOT EXISTS taxgpt.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES taxgpt.journal_entries(id) ON DELETE CASCADE,
  adjustment_entry_line_id UUID REFERENCES taxgpt.adjustment_entry_lines(id) ON DELETE SET NULL,
  account_number TEXT,
  account_name TEXT NOT NULL,
  debit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  memo TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxgpt.tickmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID NOT NULL REFERENCES taxgpt.lead_sheets(id) ON DELETE CASCADE,
  working_paper_row_id UUID NOT NULL REFERENCES taxgpt.working_paper_rows(id) ON DELETE CASCADE,
  tickmark_code VARCHAR(12) NOT NULL,
  label TEXT,
  color VARCHAR(16),
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickmarks_row_idx ON taxgpt.tickmarks(working_paper_row_id, created_at DESC);

CREATE TABLE IF NOT EXISTS taxgpt.evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID NOT NULL REFERENCES taxgpt.lead_sheets(id) ON DELETE CASCADE,
  working_paper_row_id UUID REFERENCES taxgpt.working_paper_rows(id) ON DELETE SET NULL,
  document_id UUID REFERENCES taxgpt.working_paper_documents(id) ON DELETE SET NULL,
  link_type VARCHAR(24) NOT NULL DEFAULT 'document',
  label TEXT,
  source_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS evidence_links_lead_sheet_idx ON taxgpt.evidence_links(lead_sheet_id, created_at DESC);

CREATE TABLE IF NOT EXISTS taxgpt.assignment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE SET NULL,
  working_paper_row_id UUID REFERENCES taxgpt.working_paper_rows(id) ON DELETE SET NULL,
  assignment_type VARCHAR(24) NOT NULL,
  clerk_user_id TEXT NOT NULL,
  role VARCHAR(24) NOT NULL,
  state VARCHAR(24) NOT NULL DEFAULT 'active',
  assigned_by TEXT NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT now(),
  due_date DATE,
  completed_at TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assignment_tracking_engagement_idx ON taxgpt.assignment_tracking(engagement_id, assignment_type, state);

CREATE TABLE IF NOT EXISTS taxgpt.review_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE SET NULL,
  signoff_type VARCHAR(24) NOT NULL,
  signoff_state VARCHAR(24) NOT NULL DEFAULT 'signed',
  signed_by TEXT NOT NULL,
  signed_at TIMESTAMP NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_signoffs_engagement_idx ON taxgpt.review_signoffs(engagement_id, signoff_type, signed_at DESC);

CREATE TABLE IF NOT EXISTS taxgpt.workflow_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE SET NULL,
  working_paper_row_id UUID REFERENCES taxgpt.working_paper_rows(id) ON DELETE SET NULL,
  status_type VARCHAR(24) NOT NULL,
  status_value VARCHAR(24) NOT NULL,
  transitioned_by TEXT NOT NULL,
  transitioned_at TIMESTAMP NOT NULL DEFAULT now(),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workflow_statuses_engagement_idx ON taxgpt.workflow_statuses(engagement_id, status_type, transitioned_at DESC);

CREATE TABLE IF NOT EXISTS taxgpt.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE SET NULL,
  working_paper_row_id UUID REFERENCES taxgpt.working_paper_rows(id) ON DELETE SET NULL,
  event_type VARCHAR(48) NOT NULL,
  entity_type VARCHAR(64),
  entity_id TEXT,
  actor_id TEXT,
  before_value JSONB,
  after_value JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_engagement_idx ON taxgpt.audit_events(engagement_id, created_at DESC);

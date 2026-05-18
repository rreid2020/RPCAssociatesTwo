-- Working Papers module tables

CREATE TABLE IF NOT EXISTS taxgpt.accounting_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  legal_name TEXT,
  business_number TEXT,
  fiscal_year_end_month INTEGER,
  fiscal_year_end_day INTEGER,
  default_currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_clients_user_idx ON taxgpt.accounting_clients(clerk_user_id);

CREATE TABLE IF NOT EXISTS taxgpt.accounting_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES taxgpt.accounting_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  engagement_type VARCHAR(48) NOT NULL,
  fiscal_year INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  source_type VARCHAR(32) NOT NULL DEFAULT 'manual',
  materiality_amount NUMERIC(14,2),
  reporting_currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  created_by TEXT NOT NULL,
  assigned_preparer_id TEXT,
  assigned_reviewer_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_engagements_user_idx ON taxgpt.accounting_engagements(clerk_user_id, status);
CREATE INDEX IF NOT EXISTS accounting_engagements_client_idx ON taxgpt.accounting_engagements(client_id);

CREATE TABLE IF NOT EXISTS taxgpt.source_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES taxgpt.accounting_clients(id) ON DELETE CASCADE,
  provider VARCHAR(48) NOT NULL,
  provider_realm_id TEXT,
  connection_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS source_connections_user_idx ON taxgpt.source_connections(clerk_user_id, provider);

CREATE TABLE IF NOT EXISTS taxgpt.trial_balance_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type VARCHAR(16) NOT NULL,
  column_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  warning_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trial_balance_import_batches_engagement_idx ON taxgpt.trial_balance_import_batches(engagement_id);

CREATE TABLE IF NOT EXISTS taxgpt.trial_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  source_connection_id UUID REFERENCES taxgpt.source_connections(id) ON DELETE SET NULL,
  import_batch_id UUID REFERENCES taxgpt.trial_balance_import_batches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  imported_at TIMESTAMP NOT NULL DEFAULT now(),
  imported_by TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trial_balances_engagement_idx ON taxgpt.trial_balances(engagement_id);

CREATE TABLE IF NOT EXISTS taxgpt.account_mapping_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  code VARCHAR(16) NOT NULL,
  name TEXT NOT NULL,
  financial_statement_area VARCHAR(64) NOT NULL,
  default_lead_sheet_section VARCHAR(8),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS account_mapping_groups_code_user_ux ON taxgpt.account_mapping_groups(clerk_user_id, code);

CREATE TABLE IF NOT EXISTS taxgpt.trial_balance_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_balance_id UUID NOT NULL REFERENCES taxgpt.trial_balances(id) ON DELETE CASCADE,
  source_account_id TEXT,
  account_number TEXT,
  account_name TEXT NOT NULL,
  account_type VARCHAR(64) NOT NULL,
  normal_balance VARCHAR(8),
  current_period_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  prior_period_balance NUMERIC(14,2),
  variance_amount NUMERIC(14,2),
  variance_percent NUMERIC(14,6),
  variance_label VARCHAR(32),
  mapped_group_id UUID REFERENCES taxgpt.account_mapping_groups(id) ON DELETE SET NULL,
  lead_sheet_section VARCHAR(8),
  is_material BOOLEAN NOT NULL DEFAULT false,
  is_unusual BOOLEAN NOT NULL DEFAULT false,
  flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trial_balance_accounts_tb_idx ON taxgpt.trial_balance_accounts(trial_balance_id);

CREATE TABLE IF NOT EXISTS taxgpt.lead_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
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
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lead_sheets_engagement_section_ux ON taxgpt.lead_sheets(engagement_id, section_code);

CREATE TABLE IF NOT EXISTS taxgpt.lead_sheet_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_sheet_id UUID NOT NULL REFERENCES taxgpt.lead_sheets(id) ON DELETE CASCADE,
  trial_balance_account_id UUID NOT NULL REFERENCES taxgpt.trial_balance_accounts(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lead_sheet_accounts_unique_ux ON taxgpt.lead_sheet_accounts(lead_sheet_id, trial_balance_account_id);

CREATE TABLE IF NOT EXISTS taxgpt.working_paper_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE SET NULL,
  existing_document_id UUID REFERENCES taxgpt.portal_client_files(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type VARCHAR(64),
  storage_path TEXT,
  source VARCHAR(40) NOT NULL,
  description TEXT,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT now(),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS working_paper_documents_engagement_idx ON taxgpt.working_paper_documents(engagement_id);

CREATE TABLE IF NOT EXISTS taxgpt.review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE SET NULL,
  trial_balance_account_id UUID REFERENCES taxgpt.trial_balance_accounts(id) ON DELETE SET NULL,
  document_id UUID REFERENCES taxgpt.working_paper_documents(id) ON DELETE SET NULL,
  note_text TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'open',
  priority VARCHAR(16) NOT NULL DEFAULT 'medium',
  created_by TEXT NOT NULL,
  assigned_to TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_notes_engagement_idx ON taxgpt.review_notes(engagement_id, status);

CREATE TABLE IF NOT EXISTS taxgpt.engagement_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'not_started',
  assigned_to TEXT,
  due_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS engagement_tasks_engagement_idx ON taxgpt.engagement_tasks(engagement_id, status);

CREATE TABLE IF NOT EXISTS taxgpt.adjustment_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
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

CREATE UNIQUE INDEX IF NOT EXISTS adjustment_entries_engagement_number_ux ON taxgpt.adjustment_entries(engagement_id, entry_number);

CREATE TABLE IF NOT EXISTS taxgpt.adjustment_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_entry_id UUID NOT NULL REFERENCES taxgpt.adjustment_entries(id) ON DELETE CASCADE,
  account_number TEXT,
  account_name TEXT NOT NULL,
  debit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxgpt.accounting_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id TEXT NOT NULL,
  action VARCHAR(64) NOT NULL,
  actor_id TEXT NOT NULL,
  before_value JSONB,
  after_value JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_audit_log_user_idx ON taxgpt.accounting_audit_log(clerk_user_id, created_at DESC);

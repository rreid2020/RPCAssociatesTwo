/**
 * Creates taxgpt schema and portal tables if missing.
 * Idempotent; safe on every run. Uses one statement per query (reliable in node-pg).
 */
const STATEMENTS = [
  'CREATE SCHEMA IF NOT EXISTS taxgpt',
  `CREATE TABLE IF NOT EXISTS taxgpt.portal_open_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  sort_order INTEGER NOT NULL DEFAULT 0,
  due_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS portal_open_items_clerk_idx ON taxgpt.portal_open_items(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.portal_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_at TIMESTAMP NOT NULL,
  category VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS portal_deadlines_clerk_due_idx ON taxgpt.portal_deadlines(clerk_user_id, due_at)',

  `CREATE TABLE IF NOT EXISTS taxgpt.portal_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  kind VARCHAR(32) NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS portal_activity_clerk_idx ON taxgpt.portal_activity(clerk_user_id, created_at DESC)',

  `CREATE TABLE IF NOT EXISTS taxgpt.portal_client_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime TEXT,
  size_bytes INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS portal_client_files_clerk_idx ON taxgpt.portal_client_files(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.portal_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  parent_id UUID NULL REFERENCES taxgpt.portal_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT portal_folders_name_len CHECK (char_length(trim(name)) > 0 AND char_length(btrim(name)) < 200)
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS portal_folders_sibling_name_ux
  ON taxgpt.portal_folders (clerk_user_id, (COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)), (lower(btrim(name))))`,

  'CREATE INDEX IF NOT EXISTS portal_folders_clerk_idx ON taxgpt.portal_folders(clerk_user_id)',
  'CREATE INDEX IF NOT EXISTS portal_folders_parent_idx ON taxgpt.portal_folders(clerk_user_id, parent_id)',

  'ALTER TABLE taxgpt.portal_client_files ADD COLUMN IF NOT EXISTS folder_id UUID NULL REFERENCES taxgpt.portal_folders(id) ON DELETE SET NULL',
  'CREATE INDEX IF NOT EXISTS portal_client_files_clerk_folder_idx ON taxgpt.portal_client_files(clerk_user_id, folder_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.portal_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.portal_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES taxgpt.portal_checklists(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,

  `CREATE TABLE IF NOT EXISTS taxgpt.portal_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  provider VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'disconnected',
  connected_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS portal_integrations_clerk_idx ON taxgpt.portal_integrations(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.taxpayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT NOT NULL,
  sin TEXT,
  sin_last4 TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS taxpayers_clerk_idx ON taxgpt.taxpayers(clerk_user_id)',
  'ALTER TABLE taxgpt.taxpayers ADD COLUMN IF NOT EXISTS sin TEXT',

  `CREATE TABLE IF NOT EXISTS taxgpt.tax_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  taxpayer_id UUID NOT NULL REFERENCES taxgpt.taxpayers(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  workspace_role VARCHAR(16) NOT NULL DEFAULT 'primary',
  parent_tax_return_id UUID REFERENCES taxgpt.tax_returns(id) ON DELETE SET NULL,
  related_person_name TEXT,
  interview_stage VARCHAR(32) NOT NULL DEFAULT 'setup',
  title TEXT,
  province_code VARCHAR(4) NOT NULL DEFAULT 'ON',
  setup_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS tax_returns_clerk_year_idx ON taxgpt.tax_returns(clerk_user_id, tax_year)',
  'CREATE INDEX IF NOT EXISTS tax_returns_taxpayer_idx ON taxgpt.tax_returns(taxpayer_id)',
  'ALTER TABLE taxgpt.tax_returns ADD COLUMN IF NOT EXISTS workspace_role VARCHAR(16) NOT NULL DEFAULT \'primary\'',
  'ALTER TABLE taxgpt.tax_returns ADD COLUMN IF NOT EXISTS parent_tax_return_id UUID REFERENCES taxgpt.tax_returns(id) ON DELETE SET NULL',
  'ALTER TABLE taxgpt.tax_returns ADD COLUMN IF NOT EXISTS related_person_name TEXT',
  'ALTER TABLE taxgpt.tax_returns ADD COLUMN IF NOT EXISTS interview_stage VARCHAR(32) NOT NULL DEFAULT \'setup\'',
  'CREATE INDEX IF NOT EXISTS tax_returns_parent_idx ON taxgpt.tax_returns(parent_tax_return_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.taxpayer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  tax_return_id UUID NOT NULL REFERENCES taxgpt.tax_returns(id) ON DELETE CASCADE,
  marital_status VARCHAR(32) NOT NULL DEFAULT 'single',
  spouse_return_mode VARCHAR(16) NOT NULL DEFAULT 'summary',
  email TEXT,
  mailing_address_line1 TEXT,
  mailing_address_po_box TEXT,
  mailing_address_rr TEXT,
  mailing_city TEXT,
  mailing_province_code VARCHAR(8),
  mailing_postal_code VARCHAR(16),
  residence_province_dec31 VARCHAR(8),
  residence_province_current VARCHAR(8),
  self_employment_provinces TEXT,
  language_correspondence VARCHAR(2) NOT NULL DEFAULT 'en',
  became_resident_date DATE,
  ceased_resident_date DATE,
  marital_status_change_date DATE,
  deceased_date DATE,
  elections_canadian_citizen BOOLEAN,
  elections_authorize BOOLEAN,
  first_time_filer BOOLEAN,
  sold_principal_residence BOOLEAN,
  treaty_exempt_foreign_service BOOLEAN,
  indian_act_exempt_income BOOLEAN NOT NULL DEFAULT false,
  foreign_property_over_100k BOOLEAN,
  organ_donor_consent BOOLEAN,
  cra_email_notifications_consent BOOLEAN,
  cra_email_confirmed BOOLEAN,
  cra_has_foreign_mailing_address BOOLEAN,
  spouse_same_address BOOLEAN NOT NULL DEFAULT true,
  spouse_self_employed BOOLEAN NOT NULL DEFAULT false,
  spouse_net_income_23600 NUMERIC(14,2) NOT NULL DEFAULT 0,
  spouse_uccb_11700 NUMERIC(14,2) NOT NULL DEFAULT 0,
  spouse_uccb_repayment_21300 NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE UNIQUE INDEX IF NOT EXISTS taxpayer_profiles_return_ux ON taxgpt.taxpayer_profiles(tax_return_id)',
  'CREATE INDEX IF NOT EXISTS taxpayer_profiles_clerk_idx ON taxgpt.taxpayer_profiles(clerk_user_id)',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS spouse_return_mode VARCHAR(16) NOT NULL DEFAULT \'summary\'',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS email TEXT',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS mailing_address_line1 TEXT',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS mailing_address_po_box TEXT',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS mailing_address_rr TEXT',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS mailing_city TEXT',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS mailing_province_code VARCHAR(8)',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS mailing_postal_code VARCHAR(16)',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS residence_province_dec31 VARCHAR(8)',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS residence_province_current VARCHAR(8)',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS self_employment_provinces TEXT',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS language_correspondence VARCHAR(2) NOT NULL DEFAULT \'en\'',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS became_resident_date DATE',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS ceased_resident_date DATE',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS marital_status_change_date DATE',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS deceased_date DATE',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS elections_canadian_citizen BOOLEAN',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS elections_authorize BOOLEAN',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS first_time_filer BOOLEAN',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS sold_principal_residence BOOLEAN',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS treaty_exempt_foreign_service BOOLEAN',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS indian_act_exempt_income BOOLEAN NOT NULL DEFAULT false',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS foreign_property_over_100k BOOLEAN',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS organ_donor_consent BOOLEAN',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS cra_email_notifications_consent BOOLEAN',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS cra_email_confirmed BOOLEAN',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS cra_has_foreign_mailing_address BOOLEAN',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS spouse_same_address BOOLEAN NOT NULL DEFAULT true',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS spouse_self_employed BOOLEAN NOT NULL DEFAULT false',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS spouse_net_income_23600 NUMERIC(14,2) NOT NULL DEFAULT 0',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS spouse_uccb_11700 NUMERIC(14,2) NOT NULL DEFAULT 0',
  'ALTER TABLE taxgpt.taxpayer_profiles ADD COLUMN IF NOT EXISTS spouse_uccb_repayment_21300 NUMERIC(14,2) NOT NULL DEFAULT 0',

  `CREATE TABLE IF NOT EXISTS taxgpt.taxpayer_spouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  tax_return_id UUID NOT NULL REFERENCES taxgpt.tax_returns(id) ON DELETE CASCADE,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  full_sin TEXT,
  sin_last4 TEXT,
  net_income NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE UNIQUE INDEX IF NOT EXISTS taxpayer_spouses_return_ux ON taxgpt.taxpayer_spouses(tax_return_id)',
  'CREATE INDEX IF NOT EXISTS taxpayer_spouses_clerk_idx ON taxgpt.taxpayer_spouses(clerk_user_id)',
  'ALTER TABLE taxgpt.taxpayer_spouses ADD COLUMN IF NOT EXISTS full_sin TEXT',
  'ALTER TABLE taxgpt.taxpayer_spouses ADD COLUMN IF NOT EXISTS first_name TEXT',
  'ALTER TABLE taxgpt.taxpayer_spouses ADD COLUMN IF NOT EXISTS last_name TEXT',
  'ALTER TABLE taxgpt.taxpayer_spouses ADD COLUMN IF NOT EXISTS date_of_birth DATE',

  `CREATE TABLE IF NOT EXISTS taxgpt.taxpayer_dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  tax_return_id UUID NOT NULL REFERENCES taxgpt.tax_returns(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT,
  date_of_birth DATE,
  has_disability BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS taxpayer_dependents_return_idx ON taxgpt.taxpayer_dependents(tax_return_id, sort_order)',
  'CREATE INDEX IF NOT EXISTS taxpayer_dependents_clerk_idx ON taxgpt.taxpayer_dependents(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  tax_return_id UUID NOT NULL REFERENCES taxgpt.tax_returns(id) ON DELETE CASCADE,
  source_type VARCHAR(32) NOT NULL,
  source_ref_id UUID,
  category VARCHAR(32) NOT NULL,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'CAD',
  is_manual BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS income_entries_return_idx ON taxgpt.income_entries(tax_return_id)',
  'CREATE INDEX IF NOT EXISTS income_entries_clerk_idx ON taxgpt.income_entries(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  tax_return_id UUID NOT NULL REFERENCES taxgpt.tax_returns(id) ON DELETE CASCADE,
  category VARCHAR(64) NOT NULL,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_credit BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS deductions_return_idx ON taxgpt.deductions(tax_return_id)',
  'CREATE INDEX IF NOT EXISTS deductions_clerk_idx ON taxgpt.deductions(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  tax_return_id UUID NOT NULL REFERENCES taxgpt.tax_returns(id) ON DELETE CASCADE,
  net_income NUMERIC(14,2) NOT NULL DEFAULT 0,
  taxable_income NUMERIC(14,2) NOT NULL DEFAULT 0,
  federal_tax NUMERIC(14,2) NOT NULL DEFAULT 0,
  provincial_tax NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_credits NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_payable NUMERIC(14,2) NOT NULL DEFAULT 0,
  taxes_withheld NUMERIC(14,2) NOT NULL DEFAULT 0,
  refund_or_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'CAD',
  engine_version VARCHAR(32) NOT NULL DEFAULT 'v1',
  assumptions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE UNIQUE INDEX IF NOT EXISTS tax_calculations_return_ux ON taxgpt.tax_calculations(tax_return_id)',
  'CREATE INDEX IF NOT EXISTS tax_calculations_clerk_idx ON taxgpt.tax_calculations(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.audit_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  tax_return_id UUID NOT NULL REFERENCES taxgpt.tax_returns(id) ON DELETE CASCADE,
  rule_code VARCHAR(64) NOT NULL,
  severity VARCHAR(16) NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS audit_flags_return_idx ON taxgpt.audit_flags(tax_return_id)',
  'CREATE INDEX IF NOT EXISTS audit_flags_clerk_idx ON taxgpt.audit_flags(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.documents_tax_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  document_id UUID NOT NULL REFERENCES taxgpt.portal_client_files(id) ON DELETE CASCADE,
  tax_return_id UUID REFERENCES taxgpt.tax_returns(id) ON DELETE SET NULL,
  tax_year INTEGER,
  document_type VARCHAR(32),
  taxpayer_name TEXT,
  suggested_match BOOLEAN NOT NULL DEFAULT false,
  suggestion_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE UNIQUE INDEX IF NOT EXISTS documents_tax_metadata_doc_ux ON taxgpt.documents_tax_metadata(document_id)',
  'CREATE INDEX IF NOT EXISTS documents_tax_metadata_return_idx ON taxgpt.documents_tax_metadata(tax_return_id)',
  'CREATE INDEX IF NOT EXISTS documents_tax_metadata_clerk_idx ON taxgpt.documents_tax_metadata(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.document_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  document_id UUID NOT NULL REFERENCES taxgpt.portal_client_files(id) ON DELETE CASCADE,
  tax_return_id UUID REFERENCES taxgpt.tax_returns(id) ON DELETE SET NULL,
  extraction_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  extraction_type VARCHAR(16) NOT NULL DEFAULT 'OCR',
  confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  review_required BOOLEAN NOT NULL DEFAULT false,
  ocr_text TEXT,
  extracted_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  parser_version VARCHAR(32) NOT NULL DEFAULT 'v1',
  reviewed_by_user BOOLEAN NOT NULL DEFAULT false,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS document_extractions_doc_idx ON taxgpt.document_extractions(document_id)',
  'CREATE INDEX IF NOT EXISTS document_extractions_return_idx ON taxgpt.document_extractions(tax_return_id)',
  'CREATE INDEX IF NOT EXISTS document_extractions_clerk_idx ON taxgpt.document_extractions(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.optimization_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  tax_return_id UUID NOT NULL REFERENCES taxgpt.tax_returns(id) ON DELETE CASCADE,
  base_calculation_id UUID REFERENCES taxgpt.tax_calculations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  scenario_type VARCHAR(32) NOT NULL DEFAULT 'manual',
  input_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  comparison_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS optimization_scenarios_return_idx ON taxgpt.optimization_scenarios(tax_return_id)',
  'CREATE INDEX IF NOT EXISTS optimization_scenarios_clerk_idx ON taxgpt.optimization_scenarios(clerk_user_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.accounting_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
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
)`,
  'ALTER TABLE taxgpt.accounting_clients ADD COLUMN IF NOT EXISTS organization_id UUID',
  'CREATE INDEX IF NOT EXISTS accounting_clients_user_idx ON taxgpt.accounting_clients(clerk_user_id)',
  'CREATE INDEX IF NOT EXISTS accounting_clients_org_idx ON taxgpt.accounting_clients(organization_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.accounting_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
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
)`,
  'ALTER TABLE taxgpt.accounting_engagements ADD COLUMN IF NOT EXISTS organization_id UUID',
  'CREATE INDEX IF NOT EXISTS accounting_engagements_user_idx ON taxgpt.accounting_engagements(clerk_user_id, status)',
  'CREATE INDEX IF NOT EXISTS accounting_engagements_client_idx ON taxgpt.accounting_engagements(client_id)',
  'CREATE INDEX IF NOT EXISTS accounting_engagements_org_idx ON taxgpt.accounting_engagements(organization_id, status)',

  `CREATE TABLE IF NOT EXISTS taxgpt.source_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  clerk_user_id TEXT NOT NULL,
  client_id UUID REFERENCES taxgpt.accounting_clients(id) ON DELETE CASCADE,
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
)`,
  'ALTER TABLE taxgpt.source_connections ADD COLUMN IF NOT EXISTS organization_id UUID',
  'ALTER TABLE taxgpt.source_connections ALTER COLUMN client_id DROP NOT NULL',
  'CREATE INDEX IF NOT EXISTS source_connections_user_idx ON taxgpt.source_connections(clerk_user_id, provider)',
  'CREATE INDEX IF NOT EXISTS source_connections_org_idx ON taxgpt.source_connections(organization_id, provider)',
  'CREATE UNIQUE INDEX IF NOT EXISTS source_connections_org_provider_ux ON taxgpt.source_connections(organization_id, provider) WHERE organization_id IS NOT NULL',

  `CREATE TABLE IF NOT EXISTS taxgpt.account_mapping_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  clerk_user_id TEXT NOT NULL,
  code VARCHAR(16) NOT NULL,
  name TEXT NOT NULL,
  financial_statement_area VARCHAR(64) NOT NULL,
  default_lead_sheet_section VARCHAR(8),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'ALTER TABLE taxgpt.account_mapping_groups ADD COLUMN IF NOT EXISTS organization_id UUID',
  'CREATE UNIQUE INDEX IF NOT EXISTS account_mapping_groups_code_user_ux ON taxgpt.account_mapping_groups(clerk_user_id, code)',
  'CREATE UNIQUE INDEX IF NOT EXISTS account_mapping_groups_code_org_ux ON taxgpt.account_mapping_groups(organization_id, code) WHERE organization_id IS NOT NULL',

  `CREATE TABLE IF NOT EXISTS taxgpt.trial_balance_import_batches (
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
)`,
  'CREATE INDEX IF NOT EXISTS trial_balance_import_batches_engagement_idx ON taxgpt.trial_balance_import_batches(engagement_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.trial_balances (
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
)`,
  'CREATE INDEX IF NOT EXISTS trial_balances_engagement_idx ON taxgpt.trial_balances(engagement_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.trial_balance_accounts (
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
)`,
  'CREATE INDEX IF NOT EXISTS trial_balance_accounts_tb_idx ON taxgpt.trial_balance_accounts(trial_balance_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.lead_sheets (
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
)`,
  'CREATE UNIQUE INDEX IF NOT EXISTS lead_sheets_engagement_section_ux ON taxgpt.lead_sheets(engagement_id, section_code)',

  `CREATE TABLE IF NOT EXISTS taxgpt.lead_sheet_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_sheet_id UUID NOT NULL REFERENCES taxgpt.lead_sheets(id) ON DELETE CASCADE,
  trial_balance_account_id UUID NOT NULL REFERENCES taxgpt.trial_balance_accounts(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE UNIQUE INDEX IF NOT EXISTS lead_sheet_accounts_unique_ux ON taxgpt.lead_sheet_accounts(lead_sheet_id, trial_balance_account_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.working_paper_documents (
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
)`,
  'CREATE INDEX IF NOT EXISTS working_paper_documents_engagement_idx ON taxgpt.working_paper_documents(engagement_id)',

  `CREATE TABLE IF NOT EXISTS taxgpt.review_notes (
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
)`,
  'CREATE INDEX IF NOT EXISTS review_notes_engagement_idx ON taxgpt.review_notes(engagement_id, status)',

  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_tasks (
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
)`,
  'CREATE INDEX IF NOT EXISTS engagement_tasks_engagement_idx ON taxgpt.engagement_tasks(engagement_id, status)',

  `CREATE TABLE IF NOT EXISTS taxgpt.adjustment_entries (
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
)`,
  'CREATE UNIQUE INDEX IF NOT EXISTS adjustment_entries_engagement_number_ux ON taxgpt.adjustment_entries(engagement_id, entry_number)',

  `CREATE TABLE IF NOT EXISTS taxgpt.adjustment_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_entry_id UUID NOT NULL REFERENCES taxgpt.adjustment_entries(id) ON DELETE CASCADE,
  account_number TEXT,
  account_name TEXT NOT NULL,
  debit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,

  `CREATE TABLE IF NOT EXISTS taxgpt.accounting_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  clerk_user_id TEXT NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id TEXT NOT NULL,
  action VARCHAR(64) NOT NULL,
  actor_id TEXT NOT NULL,
  before_value JSONB,
  after_value JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'ALTER TABLE taxgpt.accounting_audit_log ADD COLUMN IF NOT EXISTS organization_id UUID',
  'CREATE INDEX IF NOT EXISTS accounting_audit_log_user_idx ON taxgpt.accounting_audit_log(clerk_user_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS accounting_audit_log_org_idx ON taxgpt.accounting_audit_log(organization_id, created_at DESC)',

  `CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  workspace_type VARCHAR(16) NOT NULL DEFAULT 'business',
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  `ALTER TABLE taxgpt.accounting_workspaces
   ADD COLUMN IF NOT EXISTS workspace_type VARCHAR(16)`,
  `UPDATE taxgpt.accounting_workspaces
   SET workspace_type = 'business'
   WHERE workspace_type IS NULL`,
  `ALTER TABLE taxgpt.accounting_workspaces
   ALTER COLUMN workspace_type SET DEFAULT 'business'`,
  `ALTER TABLE taxgpt.accounting_workspaces
   ALTER COLUMN workspace_type SET NOT NULL`,
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'accounting_workspaces_workspace_type_chk'
     ) THEN
       ALTER TABLE taxgpt.accounting_workspaces
         ADD CONSTRAINT accounting_workspaces_workspace_type_chk
         CHECK (workspace_type IN ('business', 'firm'));
     END IF;
   END $$`,

  `CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  role VARCHAR(24) NOT NULL DEFAULT 'preparer',
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  invited_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, clerk_user_id)
)`,
  'CREATE INDEX IF NOT EXISTS accounting_workspace_members_user_idx ON taxgpt.accounting_workspace_members(clerk_user_id, status)',

  `CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspace_invites (
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
)`,
  'CREATE INDEX IF NOT EXISTS accounting_workspace_invites_workspace_idx ON taxgpt.accounting_workspace_invites(workspace_id, status, created_at DESC)',
  `CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspace_profiles (
  workspace_id UUID PRIMARY KEY REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  organization_type VARCHAR(16) NOT NULL DEFAULT 'business',
  company_legal_name TEXT NOT NULL,
  company_operating_name TEXT,
  industry TEXT,
  website_url TEXT,
  tax_identifier TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province_state TEXT,
  postal_code TEXT,
  country_code VARCHAR(2) NOT NULL DEFAULT 'CA',
  onboarding_completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS accounting_workspace_profiles_contact_email_idx ON taxgpt.accounting_workspace_profiles(primary_contact_email)'
]

export async function ensurePortalSchema (pool) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const sql of STATEMENTS) {
      await client.query(sql)
    }
    await client.query('COMMIT')
  } catch (e) {
    try {
      await client.query('ROLLBACK')
    } catch { /* ignore */ }
    throw e
  } finally {
    client.release()
  }
  const filesOk = await pool.query(
    `SELECT to_regclass('taxgpt.portal_client_files') IS NOT NULL AS ok`
  )
  if (!filesOk.rows[0]?.ok) {
    throw new Error('ensurePortalSchema: taxgpt.portal_client_files was not created')
  }
  const foldersOk = await pool.query(
    `SELECT to_regclass('taxgpt.portal_folders') IS NOT NULL AS ok`
  )
  if (!foldersOk.rows[0]?.ok) {
    throw new Error('ensurePortalSchema: taxgpt.portal_folders was not created')
  }
  console.log('Portal schema tables ensured (taxgpt.*, verified portal_client_files, portal_folders)')
}

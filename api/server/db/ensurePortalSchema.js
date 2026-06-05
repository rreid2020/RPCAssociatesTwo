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
  workspace_id UUID,
  clerk_user_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES taxgpt.accounting_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  engagement_type VARCHAR(48) NOT NULL,
  fiscal_year INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  source_type VARCHAR(32) NOT NULL DEFAULT 'manual',
  due_date DATE,
  review_flow_status VARCHAR(24) NOT NULL DEFAULT 'not_started',
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  materiality_amount NUMERIC(14,2),
  reporting_currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  created_by TEXT NOT NULL,
  assigned_preparer_id TEXT,
  assigned_reviewer_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'ALTER TABLE taxgpt.accounting_engagements ADD COLUMN IF NOT EXISTS organization_id UUID',
  'ALTER TABLE taxgpt.accounting_engagements ADD COLUMN IF NOT EXISTS workspace_id UUID',
  'ALTER TABLE taxgpt.accounting_engagements ADD COLUMN IF NOT EXISTS due_date DATE',
  'ALTER TABLE taxgpt.accounting_engagements ADD COLUMN IF NOT EXISTS review_flow_status VARCHAR(24)',
  "UPDATE taxgpt.accounting_engagements SET review_flow_status = 'not_started' WHERE review_flow_status IS NULL",
  "ALTER TABLE taxgpt.accounting_engagements ALTER COLUMN review_flow_status SET DEFAULT 'not_started'",
  'ALTER TABLE taxgpt.accounting_engagements ALTER COLUMN review_flow_status SET NOT NULL',
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'accounting_engagements_review_flow_status_chk'
     ) THEN
       ALTER TABLE taxgpt.accounting_engagements
         ADD CONSTRAINT accounting_engagements_review_flow_status_chk
         CHECK (review_flow_status IN ('not_started', 'preparer_in_progress', 'reviewer_in_progress', 'review_notes_open', 'approved'));
     END IF;
   END $$`,
  "ALTER TABLE taxgpt.accounting_engagements ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb",
  "UPDATE taxgpt.accounting_engagements SET deliverables = '[]'::jsonb WHERE deliverables IS NULL",
  "ALTER TABLE taxgpt.accounting_engagements ALTER COLUMN deliverables SET DEFAULT '[]'::jsonb",
  "ALTER TABLE taxgpt.accounting_engagements ALTER COLUMN deliverables SET NOT NULL",
  'CREATE INDEX IF NOT EXISTS accounting_engagements_user_idx ON taxgpt.accounting_engagements(clerk_user_id, status)',
  'CREATE INDEX IF NOT EXISTS accounting_engagements_client_idx ON taxgpt.accounting_engagements(client_id)',
  'CREATE INDEX IF NOT EXISTS accounting_engagements_org_idx ON taxgpt.accounting_engagements(organization_id, status)',
  'CREATE INDEX IF NOT EXISTS accounting_engagements_workspace_idx ON taxgpt.accounting_engagements(workspace_id, status)',

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
  'ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS adjustment_debit NUMERIC(14,2) NOT NULL DEFAULT 0',
  'ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS adjustment_credit NUMERIC(14,2) NOT NULL DEFAULT 0',
  'ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS review_status VARCHAR(24) NOT NULL DEFAULT \'needs_work\'',
  'ALTER TABLE taxgpt.trial_balance_accounts ADD COLUMN IF NOT EXISTS workpaper_note TEXT',

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

  `CREATE TABLE IF NOT EXISTS taxgpt.accounting_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  organization_type VARCHAR(16) NOT NULL DEFAULT 'business',
  clerk_org_id TEXT UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'accounting_organizations_org_type_chk'
     ) THEN
       ALTER TABLE taxgpt.accounting_organizations
         ADD CONSTRAINT accounting_organizations_org_type_chk
         CHECK (organization_type IN ('business', 'firm'));
     END IF;
   END $$`,
  `CREATE TABLE IF NOT EXISTS taxgpt.accounting_organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  role VARCHAR(24) NOT NULL DEFAULT 'member',
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  invited_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (organization_id, clerk_user_id)
)`,
  'CREATE INDEX IF NOT EXISTS accounting_org_members_user_idx ON taxgpt.accounting_organization_members(clerk_user_id, status)',
  `CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE SET NULL,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  clerk_org_id TEXT UNIQUE,
  org_sync_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  org_synced_at TIMESTAMP,
  workspace_type VARCHAR(16) NOT NULL DEFAULT 'business',
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS clerk_org_id TEXT',
  'ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS org_sync_status VARCHAR(24)',
  `UPDATE taxgpt.accounting_workspaces
   SET org_sync_status = 'pending'
   WHERE org_sync_status IS NULL`,
  `ALTER TABLE taxgpt.accounting_workspaces
   ALTER COLUMN org_sync_status SET DEFAULT 'pending'`,
  `ALTER TABLE taxgpt.accounting_workspaces
   ALTER COLUMN org_sync_status SET NOT NULL`,
  'ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS org_synced_at TIMESTAMP',
  'CREATE UNIQUE INDEX IF NOT EXISTS accounting_workspaces_clerk_org_id_ux ON taxgpt.accounting_workspaces(clerk_org_id) WHERE clerk_org_id IS NOT NULL',
  'ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE SET NULL',
  'CREATE INDEX IF NOT EXISTS accounting_workspaces_org_idx ON taxgpt.accounting_workspaces(organization_id, created_at DESC)',
  `DO $$
   BEGIN
     IF EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'taxgpt'
         AND table_name = 'accounting_engagements'
         AND column_name = 'workspace_id'
     ) AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'accounting_engagements_workspace_fk'
     ) THEN
       ALTER TABLE taxgpt.accounting_engagements
         ADD CONSTRAINT accounting_engagements_workspace_fk
         FOREIGN KEY (workspace_id)
         REFERENCES taxgpt.accounting_workspaces(id)
         ON DELETE SET NULL;
     END IF;
   END $$`,
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
  clerk_org_membership_id TEXT,
  invited_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, clerk_user_id)
)`,
  'ALTER TABLE taxgpt.accounting_workspace_members ADD COLUMN IF NOT EXISTS clerk_org_membership_id TEXT',
  'CREATE INDEX IF NOT EXISTS accounting_workspace_members_user_idx ON taxgpt.accounting_workspace_members(clerk_user_id, status)',

  `CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  invite_email TEXT,
  invite_token TEXT NOT NULL UNIQUE,
  role VARCHAR(24) NOT NULL DEFAULT 'preparer',
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  source VARCHAR(24) NOT NULL DEFAULT \'clerk\',
  clerk_invitation_id TEXT,
  invited_by TEXT NOT NULL,
  accepted_by TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'ALTER TABLE taxgpt.accounting_workspace_invites ADD COLUMN IF NOT EXISTS source VARCHAR(24)',
  `UPDATE taxgpt.accounting_workspace_invites
   SET source = 'clerk'
   WHERE source IS NULL`,
  'ALTER TABLE taxgpt.accounting_workspace_invites ALTER COLUMN source SET DEFAULT \'clerk\'',
  'ALTER TABLE taxgpt.accounting_workspace_invites ALTER COLUMN source SET NOT NULL',
  'ALTER TABLE taxgpt.accounting_workspace_invites ADD COLUMN IF NOT EXISTS clerk_invitation_id TEXT',
  'CREATE INDEX IF NOT EXISTS accounting_workspace_invites_workspace_idx ON taxgpt.accounting_workspace_invites(workspace_id, status, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS accounting_workspace_invites_clerk_invite_idx ON taxgpt.accounting_workspace_invites(clerk_invitation_id)',
  `CREATE TABLE IF NOT EXISTS taxgpt.workspace_custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  source_role TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, role_name)
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.workspace_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, role_name, permission_key)
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.workspace_member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  role_name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, clerk_user_id, role_name)
)`,
  'CREATE INDEX IF NOT EXISTS workspace_custom_roles_workspace_idx ON taxgpt.workspace_custom_roles(workspace_id)',
  'CREATE INDEX IF NOT EXISTS workspace_member_roles_workspace_user_idx ON taxgpt.workspace_member_roles(workspace_id, clerk_user_id)',
  `CREATE TABLE IF NOT EXISTS taxgpt.organization_member_rbac_cache (
  organization_id UUID NOT NULL REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL,
  platform_role TEXT NOT NULL,
  custom_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  computed_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, clerk_user_id)
)`,
  'CREATE INDEX IF NOT EXISTS organization_member_rbac_cache_workspace_idx ON taxgpt.organization_member_rbac_cache(workspace_id)',
  `CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspace_profiles (
  workspace_id UUID PRIMARY KEY REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  organization_type VARCHAR(16) NOT NULL DEFAULT 'business',
  business_type TEXT DEFAULT 'corporation',
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
  "ALTER TABLE taxgpt.accounting_workspace_profiles ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'corporation'",
  "ALTER TABLE taxgpt.accounting_workspace_profiles ALTER COLUMN business_type SET DEFAULT 'corporation'",
  'CREATE INDEX IF NOT EXISTS accounting_workspace_profiles_contact_email_idx ON taxgpt.accounting_workspace_profiles(primary_contact_email)',
  `CREATE TABLE IF NOT EXISTS taxgpt.workspace_stripe_customer_mappings (
  workspace_id UUID PRIMARY KEY REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS workspace_stripe_customer_mappings_user_idx ON taxgpt.workspace_stripe_customer_mappings(clerk_user_id)',
  `CREATE TABLE IF NOT EXISTS taxgpt.subscription_plans (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  stripe_product_id TEXT NOT NULL,
  stripe_price_monthly_id TEXT NOT NULL,
  stripe_price_annual_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.workspace_subscriptions (
  workspace_id UUID PRIMARY KEY REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'FREE',
  status VARCHAR(32) NOT NULL DEFAULT 'none',
  interval VARCHAR(16) NOT NULL DEFAULT 'monthly',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS workspace_subscriptions_status_idx ON taxgpt.workspace_subscriptions(status, current_period_end)',
  `CREATE TABLE IF NOT EXISTS taxgpt.workspace_entitlements (
  workspace_id UUID PRIMARY KEY REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  can_access_working_papers BOOLEAN NOT NULL DEFAULT false,
  can_access_taxgpt BOOLEAN NOT NULL DEFAULT true,
  can_use_qbo_integration BOOLEAN NOT NULL DEFAULT false,
  can_use_google_sheets_integration BOOLEAN NOT NULL DEFAULT false,
  can_invite_users BOOLEAN NOT NULL DEFAULT true,
  max_storage_mb INTEGER NOT NULL DEFAULT 512,
  max_users INTEGER NOT NULL DEFAULT 3,
  ai_monthly_credits INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.workspace_usage_tracking (
  workspace_id UUID PRIMARY KEY REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  storage_mb_used INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 1,
  ai_credits_used_this_month INTEGER NOT NULL DEFAULT 0,
  billing_cycle_month VARCHAR(7) NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.workspace_billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_event_id TEXT,
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.workspace_employee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  assignment_role VARCHAR(24) NOT NULL DEFAULT 'member',
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  assigned_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, clerk_user_id)
)`,
  'CREATE INDEX IF NOT EXISTS workspace_employee_assignments_user_idx ON taxgpt.workspace_employee_assignments(clerk_user_id, status)',
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_employee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  assignment_role VARCHAR(24) NOT NULL DEFAULT 'member',
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  assigned_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, clerk_user_id)
)`,
  'CREATE INDEX IF NOT EXISTS engagement_employee_assignments_user_idx ON taxgpt.engagement_employee_assignments(clerk_user_id, status)',
  `CREATE TABLE IF NOT EXISTS taxgpt.working_paper_employee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID NOT NULL REFERENCES taxgpt.lead_sheets(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  assignment_role VARCHAR(24) NOT NULL DEFAULT 'member',
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  assigned_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (lead_sheet_id, clerk_user_id)
)`,
  'CREATE INDEX IF NOT EXISTS working_paper_assignments_user_idx ON taxgpt.working_paper_employee_assignments(clerk_user_id, status)',
  `CREATE TABLE IF NOT EXISTS taxgpt.working_papers (
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
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, paper_code)
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.working_paper_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  working_paper_id UUID NOT NULL REFERENCES taxgpt.working_papers(id) ON DELETE CASCADE,
  section_key VARCHAR(32) NOT NULL,
  section_label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'not_started',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (working_paper_id, section_key)
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.working_paper_rows (
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
)`,
  `INSERT INTO taxgpt.working_paper_rows
   (organization_id, workspace_id, engagement_id, lead_sheet_id, trial_balance_account_id, row_label, sort_order, created_at, updated_at)
   SELECT e.organization_id, e.workspace_id, ls.engagement_id, ls.id, lsa.trial_balance_account_id,
          COALESCE(tba.account_name, 'Row'), lsa.sort_order, now(), now()
   FROM taxgpt.lead_sheet_accounts lsa
   INNER JOIN taxgpt.lead_sheets ls ON ls.id = lsa.lead_sheet_id
   INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
   INNER JOIN taxgpt.trial_balance_accounts tba ON tba.id = lsa.trial_balance_account_id
   WHERE NOT EXISTS (
     SELECT 1 FROM taxgpt.working_paper_rows existing
     WHERE existing.lead_sheet_id = lsa.lead_sheet_id
       AND existing.trial_balance_account_id = lsa.trial_balance_account_id
   )`,
  `CREATE TABLE IF NOT EXISTS taxgpt.journal_entries (
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
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, entry_number)
)`,
  `INSERT INTO taxgpt.journal_entries
   (organization_id, workspace_id, engagement_id, adjustment_entry_id, entry_number, description, status, source, created_by, approved_by, posted_at, created_at, updated_at)
   SELECT e.organization_id, e.workspace_id, ae.engagement_id, ae.id, ae.entry_number, ae.description, ae.status, ae.source,
          ae.created_by, ae.approved_by, ae.posted_at, ae.created_at, ae.updated_at
   FROM taxgpt.adjustment_entries ae
   INNER JOIN taxgpt.accounting_engagements e ON e.id = ae.engagement_id
   WHERE NOT EXISTS (
     SELECT 1 FROM taxgpt.journal_entries je WHERE je.adjustment_entry_id = ae.id
   )`,
  `CREATE TABLE IF NOT EXISTS taxgpt.journal_entry_lines (
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
)`,
  `INSERT INTO taxgpt.journal_entry_lines
   (journal_entry_id, adjustment_entry_line_id, account_number, account_name, debit_amount, credit_amount, memo, sort_order, created_at, updated_at)
   SELECT je.id, ael.id, ael.account_number, ael.account_name, ael.debit_amount, ael.credit_amount, ael.memo, 0, ael.created_at, ael.updated_at
   FROM taxgpt.adjustment_entry_lines ael
   INNER JOIN taxgpt.journal_entries je ON je.adjustment_entry_id = ael.adjustment_entry_id
   WHERE NOT EXISTS (
     SELECT 1 FROM taxgpt.journal_entry_lines jel WHERE jel.adjustment_entry_line_id = ael.id
   )`,
  `CREATE TABLE IF NOT EXISTS taxgpt.tickmarks (
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
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.evidence_links (
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
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.assignment_tracking (
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
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.review_signoffs (
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
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.workflow_statuses (
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
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.audit_events (
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
)`,
  'CREATE INDEX IF NOT EXISTS working_papers_engagement_idx ON taxgpt.working_papers(engagement_id, status)',
  'CREATE INDEX IF NOT EXISTS working_paper_rows_lead_sheet_idx ON taxgpt.working_paper_rows(lead_sheet_id, review_status)',
  'CREATE INDEX IF NOT EXISTS tickmarks_row_idx ON taxgpt.tickmarks(working_paper_row_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS evidence_links_lead_sheet_idx ON taxgpt.evidence_links(lead_sheet_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS review_signoffs_engagement_idx ON taxgpt.review_signoffs(engagement_id, signoff_type, signed_at DESC)',
  'CREATE INDEX IF NOT EXISTS workflow_statuses_engagement_idx ON taxgpt.workflow_statuses(engagement_id, status_type, transitioned_at DESC)',
  'CREATE INDEX IF NOT EXISTS audit_events_engagement_idx ON taxgpt.audit_events(engagement_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS workspace_billing_events_workspace_idx ON taxgpt.workspace_billing_events(workspace_id, created_at DESC)',

  `CREATE TABLE IF NOT EXISTS taxgpt.leadsheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_lead_sheet_id UUID UNIQUE,
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  section_code VARCHAR(16) NOT NULL,
  section_name TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'not_started',
  risk_level VARCHAR(16) NOT NULL DEFAULT 'moderate',
  preparer_user_id TEXT,
  reviewer_user_id TEXT,
  prepared_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  conclusion_text TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  'CREATE UNIQUE INDEX IF NOT EXISTS leadsheets_engagement_section_code_ux ON taxgpt.leadsheets(engagement_id, section_code) WHERE deleted_at IS NULL',
  `CREATE TABLE IF NOT EXISTS taxgpt.leadsheet_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_lead_sheet_account_id UUID UNIQUE,
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  leadsheet_id UUID NOT NULL REFERENCES taxgpt.leadsheets(id) ON DELETE CASCADE,
  trial_balance_account_id UUID NOT NULL REFERENCES taxgpt.trial_balance_accounts(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  'CREATE UNIQUE INDEX IF NOT EXISTS leadsheet_accounts_unique_link_ux ON taxgpt.leadsheet_accounts(leadsheet_id, trial_balance_account_id) WHERE deleted_at IS NULL',
  `CREATE TABLE IF NOT EXISTS taxgpt.adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_adjustment_entry_id UUID UNIQUE,
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  journal_entry_id UUID REFERENCES taxgpt.journal_entries(id) ON DELETE SET NULL,
  entry_number TEXT NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  'CREATE UNIQUE INDEX IF NOT EXISTS adjustments_engagement_entry_number_ux ON taxgpt.adjustments(engagement_id, entry_number) WHERE deleted_at IS NULL',
  `CREATE TABLE IF NOT EXISTS taxgpt.review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE CASCADE,
  review_note_id UUID REFERENCES taxgpt.review_notes(id) ON DELETE CASCADE,
  assignment_type VARCHAR(24) NOT NULL,
  assigned_to TEXT NOT NULL,
  assigned_by TEXT,
  due_at TIMESTAMP,
  status VARCHAR(24) NOT NULL DEFAULT 'open',
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_type_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  template_key VARCHAR(64) NOT NULL,
  template_name TEXT NOT NULL,
  engagement_type VARCHAR(64) NOT NULL,
  workflow_version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES taxgpt.engagement_type_templates(id) ON DELETE CASCADE,
  parent_section_id UUID REFERENCES taxgpt.engagement_template_sections(id) ON DELETE SET NULL,
  section_key VARCHAR(64) NOT NULL,
  section_label TEXT NOT NULL,
  section_type VARCHAR(32) NOT NULL DEFAULT 'working_paper',
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_template_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES taxgpt.engagement_type_templates(id) ON DELETE CASCADE,
  state_key VARCHAR(48) NOT NULL,
  state_label TEXT NOT NULL,
  is_initial BOOLEAN NOT NULL DEFAULT false,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  allowed_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  from_state VARCHAR(48),
  to_state VARCHAR(48) NOT NULL,
  transition_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.formula_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE CASCADE,
  working_paper_row_id UUID REFERENCES taxgpt.working_paper_rows(id) ON DELETE CASCADE,
  cell_key VARCHAR(64) NOT NULL,
  formula_text TEXT NOT NULL,
  evaluated_value NUMERIC(18,4),
  value_type VARCHAR(24) NOT NULL DEFAULT 'number',
  calculation_version INTEGER NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.formula_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  formula_cell_id UUID NOT NULL REFERENCES taxgpt.formula_cells(id) ON DELETE CASCADE,
  dependency_key VARCHAR(128) NOT NULL,
  dependency_type VARCHAR(24) NOT NULL DEFAULT 'cell',
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.evidence_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  evidence_link_id UUID NOT NULL REFERENCES taxgpt.evidence_links(id) ON DELETE CASCADE,
  annotation_type VARCHAR(24) NOT NULL DEFAULT 'note',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_number INTEGER,
  rect JSONB,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  snapshot_label TEXT NOT NULL,
  snapshot_type VARCHAR(24) NOT NULL DEFAULT 'manual',
  snapshot_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_state VARCHAR(48),
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.import_export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  job_type VARCHAR(24) NOT NULL,
  file_format VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'queued',
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  "ALTER TABLE taxgpt.accounting_engagements ADD COLUMN IF NOT EXISTS execution_phase VARCHAR(32) NOT NULL DEFAULT 'planning'",
  'ALTER TABLE taxgpt.accounting_engagements ADD COLUMN IF NOT EXISTS execution_locked_at TIMESTAMPTZ',
  'ALTER TABLE taxgpt.accounting_engagements ADD COLUMN IF NOT EXISTS execution_template_id UUID',
  'ALTER TABLE taxgpt.accounting_engagements ADD COLUMN IF NOT EXISTS execution_completion_pct NUMERIC(5,2) NOT NULL DEFAULT 0',
  "UPDATE taxgpt.accounting_engagements SET execution_phase = 'planning' WHERE execution_phase IS NULL",
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'accounting_engagements_execution_phase_chk') THEN
      ALTER TABLE taxgpt.accounting_engagements ADD CONSTRAINT accounting_engagements_execution_phase_chk
        CHECK (execution_phase IN ('planning', 'fieldwork', 'review', 'partner_review', 'completed', 'locked'));
    END IF;
  END $$`,
  'CREATE INDEX IF NOT EXISTS accounting_engagements_execution_phase_idx ON taxgpt.accounting_engagements(workspace_id, execution_phase)',
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  template_section_id UUID REFERENCES taxgpt.engagement_template_sections(id) ON DELETE SET NULL,
  section_key VARCHAR(64) NOT NULL,
  section_label TEXT NOT NULL,
  section_type VARCHAR(32) NOT NULL DEFAULT 'working_paper',
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  section_id UUID REFERENCES taxgpt.engagement_sections(id) ON DELETE SET NULL,
  checklist_key VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES taxgpt.engagement_checklists(id) ON DELETE CASCADE,
  item_key VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'not_started',
  assigned_to TEXT,
  due_date DATE,
  notes TEXT,
  signed_off_by TEXT,
  signed_off_at TIMESTAMP,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_checklist_item_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES taxgpt.engagement_checklist_items(id) ON DELETE CASCADE,
  document_id UUID REFERENCES taxgpt.working_paper_documents(id) ON DELETE SET NULL,
  file_key TEXT,
  label TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  section_id UUID REFERENCES taxgpt.engagement_sections(id) ON DELETE SET NULL,
  procedure_key VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  expected_result TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'not_started',
  assigned_to TEXT,
  prepared_by TEXT,
  prepared_at TIMESTAMP,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.procedure_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES taxgpt.engagement_procedures(id) ON DELETE CASCADE,
  signoff_type VARCHAR(24) NOT NULL DEFAULT 'approval',
  signed_by TEXT NOT NULL,
  signed_at TIMESTAMP NOT NULL DEFAULT now(),
  role_at_signoff VARCHAR(32),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.procedure_evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES taxgpt.engagement_procedures(id) ON DELETE CASCADE,
  document_id UUID REFERENCES taxgpt.working_paper_documents(id) ON DELETE SET NULL,
  evidence_link_id UUID REFERENCES taxgpt.evidence_links(id) ON DELETE SET NULL,
  label TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_template_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES taxgpt.engagement_type_templates(id) ON DELETE CASCADE,
  template_section_id UUID REFERENCES taxgpt.engagement_template_sections(id) ON DELETE SET NULL,
  checklist_key VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_template_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES taxgpt.engagement_type_templates(id) ON DELETE CASCADE,
  template_checklist_id UUID NOT NULL REFERENCES taxgpt.engagement_template_checklists(id) ON DELETE CASCADE,
  item_key VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  default_role VARCHAR(32),
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_template_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES taxgpt.engagement_type_templates(id) ON DELETE CASCADE,
  template_section_id UUID REFERENCES taxgpt.engagement_template_sections(id) ON DELETE SET NULL,
  procedure_key VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  expected_result TEXT,
  required_signoff_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  dataset_type VARCHAR(32) NOT NULL DEFAULT 'custom',
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  header_row_index INTEGER NOT NULL DEFAULT 0,
  column_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  row_count INTEGER NOT NULL DEFAULT 0,
  source_file_name TEXT,
  latest_import_batch_id UUID,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  'CREATE INDEX IF NOT EXISTS engagement_datasets_workspace_engagement_idx ON taxgpt.engagement_datasets(workspace_id, engagement_id) WHERE deleted_at IS NULL',
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_dataset_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES taxgpt.engagement_datasets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type VARCHAR(16) NOT NULL,
  header_row_index INTEGER NOT NULL DEFAULT 0,
  column_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  column_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  warning_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS engagement_dataset_import_batches_dataset_idx ON taxgpt.engagement_dataset_import_batches(dataset_id, created_at DESC)',
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_dataset_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES taxgpt.engagement_datasets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  source_row_number INTEGER NOT NULL,
  row_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS engagement_dataset_rows_dataset_idx ON taxgpt.engagement_dataset_rows(dataset_id, source_row_number)',
  `CREATE TABLE IF NOT EXISTS taxgpt.engagement_dataset_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES taxgpt.engagement_datasets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  'CREATE INDEX IF NOT EXISTS engagement_dataset_views_dataset_idx ON taxgpt.engagement_dataset_views(dataset_id) WHERE deleted_at IS NULL',
  `CREATE TABLE IF NOT EXISTS taxgpt.workspace_dataset_import_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dataset_type VARCHAR(32) NOT NULL DEFAULT 'custom',
  header_row_index INTEGER,
  column_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  mapping_hints JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
)`,
  'CREATE INDEX IF NOT EXISTS workspace_dataset_import_templates_workspace_idx ON taxgpt.workspace_dataset_import_templates(workspace_id) WHERE deleted_at IS NULL'
]

// Update when adding new tables in ensurePortalSchema so bootstrap re-runs once per release.
const SCHEMA_MARKER_TABLE = 'workspace_dataset_import_templates'

let portalSchemaEnsurePromise = null

async function isPortalSchemaCurrent (pool) {
  const { rows } = await pool.query(
    `SELECT to_regclass('taxgpt.${SCHEMA_MARKER_TABLE}') IS NOT NULL AS ok`
  )
  return Boolean(rows[0]?.ok)
}

async function runPortalSchemaBootstrap (pool) {
  // Run DDL statements individually (no wrapping transaction) to avoid long-lived locks.
  for (const sql of STATEMENTS) {
    await pool.query(sql)
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

export async function ensurePortalSchema (pool) {
  if (!portalSchemaEnsurePromise) {
    portalSchemaEnsurePromise = (async () => {
      if (await isPortalSchemaCurrent(pool)) {
        return
      }
      await runPortalSchemaBootstrap(pool)
    })().catch((error) => {
      portalSchemaEnsurePromise = null
      throw error
    })
  }
  return portalSchemaEnsurePromise
}

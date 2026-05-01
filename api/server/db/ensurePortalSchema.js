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
  'CREATE INDEX IF NOT EXISTS tax_returns_parent_idx ON taxgpt.tax_returns(parent_tax_return_id)',
  'ALTER TABLE taxgpt.tax_returns ADD COLUMN IF NOT EXISTS workspace_role VARCHAR(16) NOT NULL DEFAULT \'primary\'',
  'ALTER TABLE taxgpt.tax_returns ADD COLUMN IF NOT EXISTS parent_tax_return_id UUID REFERENCES taxgpt.tax_returns(id) ON DELETE SET NULL',
  'ALTER TABLE taxgpt.tax_returns ADD COLUMN IF NOT EXISTS related_person_name TEXT',
  'ALTER TABLE taxgpt.tax_returns ADD COLUMN IF NOT EXISTS interview_stage VARCHAR(32) NOT NULL DEFAULT \'setup\'',

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
  'CREATE INDEX IF NOT EXISTS optimization_scenarios_clerk_idx ON taxgpt.optimization_scenarios(clerk_user_id)'
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

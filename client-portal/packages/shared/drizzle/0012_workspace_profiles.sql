-- Company/firm profile metadata for workspace onboarding

CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspace_profiles (
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
);

CREATE INDEX IF NOT EXISTS accounting_workspace_profiles_contact_email_idx
  ON taxgpt.accounting_workspace_profiles(primary_contact_email);


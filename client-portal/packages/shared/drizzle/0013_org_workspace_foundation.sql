-- Milestone 1 foundation convergence for organization/workspace architecture.
-- Additive and idempotent by design.

CREATE TABLE IF NOT EXISTS taxgpt.accounting_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  organization_type VARCHAR(16) NOT NULL DEFAULT 'business',
  clerk_org_id TEXT UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounting_organizations_org_type_chk'
  ) THEN
    ALTER TABLE taxgpt.accounting_organizations
      ADD CONSTRAINT accounting_organizations_org_type_chk
      CHECK (organization_type IN ('business', 'firm'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS taxgpt.accounting_organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  role VARCHAR(24) NOT NULL DEFAULT 'member',
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  invited_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (organization_id, clerk_user_id)
);

CREATE INDEX IF NOT EXISTS accounting_org_members_user_idx
  ON taxgpt.accounting_organization_members(clerk_user_id, status);

ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE SET NULL;
ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS clerk_org_id TEXT;
ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS org_sync_status VARCHAR(24);
ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS org_synced_at TIMESTAMP;
UPDATE taxgpt.accounting_workspaces SET org_sync_status = 'pending' WHERE org_sync_status IS NULL;
ALTER TABLE taxgpt.accounting_workspaces ALTER COLUMN org_sync_status SET DEFAULT 'pending';
ALTER TABLE taxgpt.accounting_workspaces ALTER COLUMN org_sync_status SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS accounting_workspaces_clerk_org_id_ux
  ON taxgpt.accounting_workspaces(clerk_org_id) WHERE clerk_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS accounting_workspaces_org_idx
  ON taxgpt.accounting_workspaces(organization_id, created_at DESC);

ALTER TABLE taxgpt.accounting_workspace_members ADD COLUMN IF NOT EXISTS clerk_org_membership_id TEXT;

ALTER TABLE taxgpt.accounting_workspace_invites ADD COLUMN IF NOT EXISTS source VARCHAR(24);
ALTER TABLE taxgpt.accounting_workspace_invites ADD COLUMN IF NOT EXISTS clerk_invitation_id TEXT;
UPDATE taxgpt.accounting_workspace_invites SET source = 'clerk' WHERE source IS NULL;
ALTER TABLE taxgpt.accounting_workspace_invites ALTER COLUMN source SET DEFAULT 'clerk';
ALTER TABLE taxgpt.accounting_workspace_invites ALTER COLUMN source SET NOT NULL;
CREATE INDEX IF NOT EXISTS accounting_workspace_invites_clerk_invite_idx
  ON taxgpt.accounting_workspace_invites(clerk_invitation_id);

ALTER TABLE taxgpt.accounting_workspace_profiles ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'corporation';
ALTER TABLE taxgpt.accounting_workspace_profiles ALTER COLUMN business_type SET DEFAULT 'corporation';

CREATE TABLE IF NOT EXISTS taxgpt.workspace_stripe_customer_mappings (
  workspace_id UUID PRIMARY KEY REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspace_stripe_customer_mappings_user_idx
  ON taxgpt.workspace_stripe_customer_mappings(clerk_user_id);

CREATE TABLE IF NOT EXISTS taxgpt.subscription_plans (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  stripe_product_id TEXT NOT NULL,
  stripe_price_monthly_id TEXT NOT NULL,
  stripe_price_annual_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxgpt.workspace_subscriptions (
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
);

CREATE INDEX IF NOT EXISTS workspace_subscriptions_status_idx
  ON taxgpt.workspace_subscriptions(status, current_period_end);

CREATE TABLE IF NOT EXISTS taxgpt.workspace_entitlements (
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
);

CREATE TABLE IF NOT EXISTS taxgpt.workspace_usage_tracking (
  workspace_id UUID PRIMARY KEY REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  storage_mb_used INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 1,
  ai_credits_used_this_month INTEGER NOT NULL DEFAULT 0,
  billing_cycle_month VARCHAR(7) NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxgpt.workspace_billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_event_id TEXT,
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxgpt.workspace_custom_roles (
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
);

CREATE TABLE IF NOT EXISTS taxgpt.workspace_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, role_name, permission_key)
);

CREATE TABLE IF NOT EXISTS taxgpt.workspace_member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  role_name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, clerk_user_id, role_name)
);

CREATE INDEX IF NOT EXISTS workspace_custom_roles_workspace_idx
  ON taxgpt.workspace_custom_roles(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_member_roles_workspace_user_idx
  ON taxgpt.workspace_member_roles(workspace_id, clerk_user_id);

CREATE TABLE IF NOT EXISTS taxgpt.workspace_employee_assignments (
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
);

CREATE INDEX IF NOT EXISTS workspace_employee_assignments_user_idx
  ON taxgpt.workspace_employee_assignments(clerk_user_id, status);

ALTER TABLE taxgpt.accounting_engagements ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS accounting_engagements_workspace_idx ON taxgpt.accounting_engagements(workspace_id, status);

CREATE TABLE IF NOT EXISTS taxgpt.engagement_employee_assignments (
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
);

CREATE INDEX IF NOT EXISTS engagement_employee_assignments_user_idx
  ON taxgpt.engagement_employee_assignments(clerk_user_id, status);

CREATE TABLE IF NOT EXISTS taxgpt.working_paper_employee_assignments (
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
);

CREATE INDEX IF NOT EXISTS working_paper_assignments_user_idx
  ON taxgpt.working_paper_employee_assignments(clerk_user_id, status);

import { randomBytes } from 'crypto'
import {
  createClerkEmailInvite,
  createClerkOrganization,
  createClerkOrganizationInvitation
} from './clerkAdminService.js'
import {
  assertWorkspacePermissionWithCustomRoles,
  ensureWorkspaceRbacTables,
  resolveEffectiveWorkspacePermissions
} from './authz/workspaceRbacService.js'

const WORKSPACE_ROLES = new Set(['owner', 'admin', 'manager', 'reviewer', 'preparer', 'read_only', 'client'])
const WORKSPACE_TYPES = new Set(['business', 'firm'])

function assertRole (role) {
  if (!WORKSPACE_ROLES.has(role)) {
    throw new Error('Invalid workspace role')
  }
}

function normalizeWorkspaceType (value) {
  const type = String(value || 'business').trim().toLowerCase()
  if (!WORKSPACE_TYPES.has(type)) {
    throw new Error('Invalid workspace type')
  }
  return type
}

function canManageWorkspace (workspace) {
  return workspace.role === 'owner' || workspace.role === 'admin'
}

function slugifyWorkspaceName (name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'workspace'
}

function normalizeOptionalText (value) {
  const text = String(value || '').trim()
  return text ? text : null
}

function normalizeInviteEmail (value) {
  const inviteEmail = String(value || '').trim().toLowerCase()
  if (!inviteEmail) {
    throw new Error('Employee email is required')
  }
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)
  if (!isValidEmail) {
    throw new Error('Invalid employee email address')
  }
  return inviteEmail
}

function pickPublicPortalOrigin () {
  const fromExplicit = String(
    process.env.PORTAL_APP_URL ||
    process.env.APP_URL ||
    process.env.VITE_SITE_URL ||
    ''
  ).trim()
  if (fromExplicit) {
    return fromExplicit.replace(/\/$/, '')
  }

  const allowList = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  const publicOrigin = allowList.find((origin) => /^https?:\/\//i.test(origin) && !/localhost|127\.0\.0\.1/i.test(origin))
  if (publicOrigin) {
    return publicOrigin.replace(/\/$/, '')
  }

  return ''
}

function getInviteRedirectUrl () {
  const origin = pickPublicPortalOrigin()
  if (origin) return `${origin}/portal/post-auth`

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Portal invite redirect URL is not configured. Set PORTAL_APP_URL (preferred) or APP_URL to your public site origin.')
  }
  return 'http://localhost:5173/portal/post-auth'
}

function mapWorkspaceRoleToClerkOrgRole (workspaceRole) {
  if (workspaceRole === 'owner' || workspaceRole === 'admin' || workspaceRole === 'manager') {
    return 'org:admin'
  }
  return 'org:member'
}

async function getWorkspaceEntitlementSnapshot (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT can_invite_users, max_users
     FROM taxgpt.workspace_entitlements
     WHERE workspace_id = $1::uuid
     LIMIT 1`,
    [workspaceId]
  )
  return rows[0] || { can_invite_users: true, max_users: 3 }
}

async function getWorkspaceActiveUserCount (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS c
     FROM taxgpt.accounting_workspace_members
     WHERE workspace_id = $1::uuid
       AND status = 'active'`,
    [workspaceId]
  )
  return Number(rows[0]?.c || 0)
}

async function writeWorkspaceAuditEvent (pool, workspaceId, actorUserId, action, entityType, entityId, beforeValue = null, afterValue = null) {
  await pool.query(
    `INSERT INTO taxgpt.accounting_audit_log
     (organization_id, clerk_user_id, entity_type, entity_id, action, actor_id, before_value, after_value, created_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $2, $6::jsonb, $7::jsonb, now())`,
    [
      workspaceId,
      actorUserId,
      entityType,
      String(entityId || ''),
      action,
      beforeValue ? JSON.stringify(beforeValue) : null,
      afterValue ? JSON.stringify(afterValue) : null
    ]
  )
}

export async function ensureWorkspaceTables (pool) {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspaces (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
     )`
  )
  await pool.query('ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS clerk_org_id TEXT')
  await pool.query('ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS org_sync_status VARCHAR(24)')
  await pool.query("UPDATE taxgpt.accounting_workspaces SET org_sync_status = 'pending' WHERE org_sync_status IS NULL")
  await pool.query("ALTER TABLE taxgpt.accounting_workspaces ALTER COLUMN org_sync_status SET DEFAULT 'pending'")
  await pool.query('ALTER TABLE taxgpt.accounting_workspaces ALTER COLUMN org_sync_status SET NOT NULL')
  await pool.query('ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS org_synced_at TIMESTAMP')
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS accounting_workspaces_clerk_org_id_ux ON taxgpt.accounting_workspaces(clerk_org_id) WHERE clerk_org_id IS NOT NULL')
  await pool.query('ALTER TABLE taxgpt.accounting_workspaces ADD COLUMN IF NOT EXISTS workspace_type VARCHAR(16)')
  await pool.query("UPDATE taxgpt.accounting_workspaces SET workspace_type = 'business' WHERE workspace_type IS NULL")
  await pool.query("ALTER TABLE taxgpt.accounting_workspaces ALTER COLUMN workspace_type SET DEFAULT 'business'")
  await pool.query('ALTER TABLE taxgpt.accounting_workspaces ALTER COLUMN workspace_type SET NOT NULL')
  await pool.query(
    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM pg_constraint WHERE conname = 'accounting_workspaces_workspace_type_chk'
       ) THEN
         ALTER TABLE taxgpt.accounting_workspaces
           ADD CONSTRAINT accounting_workspaces_workspace_type_chk
           CHECK (workspace_type IN ('business', 'firm'));
       END IF;
     END $$`
  )
  await pool.query(
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
     )`
  )
  await pool.query('ALTER TABLE taxgpt.accounting_workspace_members ADD COLUMN IF NOT EXISTS clerk_org_membership_id TEXT')
  await pool.query(
    `CREATE TABLE IF NOT EXISTS taxgpt.accounting_workspace_invites (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
       invite_email TEXT,
       invite_token TEXT NOT NULL UNIQUE,
       role VARCHAR(24) NOT NULL DEFAULT 'preparer',
       status VARCHAR(24) NOT NULL DEFAULT 'pending',
       source VARCHAR(24) NOT NULL DEFAULT 'clerk',
       clerk_invitation_id TEXT,
       invited_by TEXT NOT NULL,
       accepted_by TEXT,
       expires_at TIMESTAMP NOT NULL,
       created_at TIMESTAMP NOT NULL DEFAULT now(),
       updated_at TIMESTAMP NOT NULL DEFAULT now()
     )`
  )
  await pool.query('ALTER TABLE taxgpt.accounting_workspace_invites ADD COLUMN IF NOT EXISTS source VARCHAR(24)')
  await pool.query("UPDATE taxgpt.accounting_workspace_invites SET source = 'clerk' WHERE source IS NULL")
  await pool.query("ALTER TABLE taxgpt.accounting_workspace_invites ALTER COLUMN source SET DEFAULT 'clerk'")
  await pool.query('ALTER TABLE taxgpt.accounting_workspace_invites ALTER COLUMN source SET NOT NULL')
  await pool.query('ALTER TABLE taxgpt.accounting_workspace_invites ADD COLUMN IF NOT EXISTS clerk_invitation_id TEXT')
  await pool.query('CREATE INDEX IF NOT EXISTS accounting_workspace_invites_workspace_idx ON taxgpt.accounting_workspace_invites(workspace_id, status, created_at DESC)')
  await pool.query('CREATE INDEX IF NOT EXISTS accounting_workspace_invites_clerk_invite_idx ON taxgpt.accounting_workspace_invites(clerk_invitation_id)')
  await pool.query(
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
     )`
  )
  await pool.query('CREATE INDEX IF NOT EXISTS accounting_workspace_profiles_contact_email_idx ON taxgpt.accounting_workspace_profiles(primary_contact_email)')
  await pool.query(
    `CREATE TABLE IF NOT EXISTS taxgpt.workspace_stripe_customer_mappings (
       workspace_id UUID PRIMARY KEY REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
       clerk_user_id TEXT NOT NULL,
       stripe_customer_id TEXT NOT NULL UNIQUE,
       created_at TIMESTAMP NOT NULL DEFAULT now(),
       updated_at TIMESTAMP NOT NULL DEFAULT now()
     )`
  )
  await pool.query(
    `CREATE TABLE IF NOT EXISTS taxgpt.subscription_plans (
       id TEXT PRIMARY KEY,
       display_name TEXT NOT NULL,
       stripe_product_id TEXT NOT NULL,
       stripe_price_monthly_id TEXT NOT NULL,
       stripe_price_annual_id TEXT NOT NULL,
       created_at TIMESTAMP NOT NULL DEFAULT now(),
       updated_at TIMESTAMP NOT NULL DEFAULT now()
     )`
  )
  await pool.query(
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
     )`
  )
  await pool.query(
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
     )`
  )
  await pool.query(
    `CREATE TABLE IF NOT EXISTS taxgpt.workspace_usage_tracking (
       workspace_id UUID PRIMARY KEY REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
       storage_mb_used INTEGER NOT NULL DEFAULT 0,
       active_users INTEGER NOT NULL DEFAULT 1,
       ai_credits_used_this_month INTEGER NOT NULL DEFAULT 0,
       billing_cycle_month VARCHAR(7) NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
       created_at TIMESTAMP NOT NULL DEFAULT now(),
       updated_at TIMESTAMP NOT NULL DEFAULT now()
     )`
  )
  await pool.query(
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
     )`
  )
  await ensureWorkspaceRbacTables(pool)
}

export async function ensurePersonalWorkspace (pool, clerkUserId) {
  await ensureWorkspaceTables(pool)
  const { rows: existing } = await pool.query(
    `SELECT w.*
     FROM taxgpt.accounting_workspaces w
     INNER JOIN taxgpt.accounting_workspace_members m ON m.workspace_id = w.id
     WHERE w.is_personal = true
       AND w.owner_user_id = $1
       AND m.clerk_user_id = $1
       AND m.status = 'active'
     LIMIT 1`,
    [clerkUserId]
  )
  if (existing[0]) return existing[0]

  const baseSlug = `personal-${slugifyWorkspaceName(clerkUserId)}`
  const slug = `${baseSlug}-${Date.now().toString(36)}`
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspaces
     (owner_user_id, name, slug, workspace_type, is_personal, created_at, updated_at)
     VALUES ($1, $2, $3, 'business', true, now(), now())
     RETURNING *`,
    [clerkUserId, 'My Accounting Workspace', slug]
  )
  const workspace = rows[0]
  await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_members
     (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, 'owner', 'active', $2, now(), now())
     ON CONFLICT (workspace_id, clerk_user_id)
     DO UPDATE SET role = 'owner', status = 'active', updated_at = now()`,
    [workspace.id, clerkUserId]
  )
  return workspace
}

export async function ensureWorkspaceClerkOrganization (pool, workspace, actorUserId) {
  if (!workspace || workspace.clerk_org_id) return workspace
  const safeName = String(workspace.name || 'Workspace').trim().slice(0, 150) || 'Workspace'
  const slugSeed = `${slugifyWorkspaceName(workspace.name)}-${String(workspace.id).slice(0, 8)}`
  const organization = await createClerkOrganization({
    name: safeName,
    slug: slugSeed,
    createdBy: actorUserId
  })
  const { rows } = await pool.query(
    `UPDATE taxgpt.accounting_workspaces
     SET clerk_org_id = $1,
         org_sync_status = 'synced',
         org_synced_at = now(),
         updated_at = now()
     WHERE id = $2::uuid
     RETURNING *`,
    [organization.id, workspace.id]
  )
  return rows[0] || workspace
}

async function safeEnsureWorkspaceClerkOrganization (pool, workspace, actorUserId) {
  try {
    return await ensureWorkspaceClerkOrganization(pool, workspace, actorUserId)
  } catch (error) {
    console.warn('Workspace Clerk org sync deferred:', {
      workspaceId: workspace?.id,
      actorUserId,
      message: error instanceof Error ? error.message : String(error)
    })
    try {
      await pool.query(
        `UPDATE taxgpt.accounting_workspaces
         SET org_sync_status = 'pending',
             updated_at = now()
         WHERE id = $1::uuid`,
        [workspace.id]
      )
    } catch {}
    return workspace
  }
}

export async function getWorkspaceAuthorizationContext (pool, workspace, actorUserId) {
  const resolved = await resolveEffectiveWorkspacePermissions(pool, workspace.id, workspace.role, actorUserId)
  return {
    workspaceId: workspace.id,
    workspaceRole: workspace.role,
    platformRole: resolved.platformRole,
    customRoles: resolved.customRoles,
    permissions: resolved.permissions
  }
}

export async function getWorkspaceContext (pool, clerkUserId, requestedWorkspaceId = null) {
  await ensurePersonalWorkspace(pool, clerkUserId)
  if (requestedWorkspaceId) {
    const { rows } = await pool.query(
      `SELECT w.*, m.role, m.status
       FROM taxgpt.accounting_workspaces w
       INNER JOIN taxgpt.accounting_workspace_members m ON m.workspace_id = w.id
       WHERE w.id = $1::uuid
         AND m.clerk_user_id = $2
         AND m.status = 'active'
       LIMIT 1`,
      [requestedWorkspaceId, clerkUserId]
    )
    if (!rows[0]) throw new Error('Workspace access denied')
    const workspace = rows[0]
    if (!workspace.clerk_org_id && canManageWorkspace(workspace)) {
      return await safeEnsureWorkspaceClerkOrganization(pool, workspace, clerkUserId)
    }
    return workspace
  }

  const { rows } = await pool.query(
    `SELECT w.*, m.role, m.status
     FROM taxgpt.accounting_workspaces w
     INNER JOIN taxgpt.accounting_workspace_members m ON m.workspace_id = w.id
     WHERE m.clerk_user_id = $1
       AND m.status = 'active'
     ORDER BY CASE WHEN m.role = 'owner' THEN 0 ELSE 1 END, w.created_at ASC
     LIMIT 1`,
    [clerkUserId]
  )
  if (!rows[0]) throw new Error('Workspace not found')
  const workspace = rows[0]
  if (!workspace.clerk_org_id && canManageWorkspace(workspace)) {
    return await safeEnsureWorkspaceClerkOrganization(pool, workspace, clerkUserId)
  }
  return workspace
}

export async function listWorkspacesForUser (pool, clerkUserId) {
  await ensurePersonalWorkspace(pool, clerkUserId)
  const { rows } = await pool.query(
    `SELECT w.*, m.role, m.status,
            p.company_legal_name AS profile_company_legal_name,
            p.onboarding_completed_at AS profile_onboarding_completed_at
     FROM taxgpt.accounting_workspaces w
     INNER JOIN taxgpt.accounting_workspace_members m ON m.workspace_id = w.id
     LEFT JOIN taxgpt.accounting_workspace_profiles p ON p.workspace_id = w.id
     WHERE m.clerk_user_id = $1
       AND m.status = 'active'
     ORDER BY w.created_at ASC`,
    [clerkUserId]
  )
  return rows
}

export async function getOnboardingStatusForUser (pool, clerkUserId) {
  const workspaces = await listWorkspacesForUser(pool, clerkUserId)
  const completedWorkspace = workspaces.find((workspace) => Boolean(workspace.profile_onboarding_completed_at)) || null
  return {
    required: !completedWorkspace,
    hasWorkspace: workspaces.length > 0,
    hasCompletedProfile: Boolean(completedWorkspace),
    primaryWorkspaceId: workspaces[0]?.id || null,
    completedWorkspaceId: completedWorkspace?.id || null
  }
}

export async function createWorkspace (pool, clerkUserId, payload) {
  await ensureWorkspaceTables(pool)
  const name = String(payload?.name || '').trim()
  if (!name) throw new Error('Workspace name is required')
  const workspaceType = normalizeWorkspaceType(payload?.workspaceType)
  const baseSlug = slugifyWorkspaceName(name)
  const slug = `${baseSlug}-${Date.now().toString(36)}`
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspaces
     (owner_user_id, name, slug, workspace_type, is_personal, created_at, updated_at)
     VALUES ($1, $2, $3, $4, false, now(), now())
     RETURNING *`,
    [clerkUserId, name, slug, workspaceType]
  )
  const workspace = rows[0]
  await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_members
     (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, 'owner', 'active', $2, now(), now())`,
    [workspace.id, clerkUserId]
  )
  const linkedWorkspace = await safeEnsureWorkspaceClerkOrganization(pool, workspace, clerkUserId)
  if (payload?.profile) {
    await upsertWorkspaceProfile(pool, clerkUserId, linkedWorkspace.id, payload.profile)
  }
  return linkedWorkspace
}

export async function getWorkspaceProfile (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  const { rows } = await pool.query(
    `SELECT workspace_id, organization_type, company_legal_name, company_operating_name, industry, website_url, tax_identifier,
            primary_contact_name, primary_contact_email, primary_contact_phone, address_line1, address_line2, city, province_state,
            postal_code, country_code, onboarding_completed_at, created_at, updated_at
     FROM taxgpt.accounting_workspace_profiles
     WHERE workspace_id = $1::uuid
     LIMIT 1`,
    [workspace.id]
  )
  return { workspace, profile: rows[0] || null }
}

export async function upsertWorkspaceProfile (pool, actorUserId, workspaceId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  if (!canManageWorkspace(workspace)) {
    throw new Error('Only owner/admin can update workspace profile')
  }
  const companyLegalName = String(payload?.companyLegalName || '').trim()
  if (!companyLegalName) throw new Error('companyLegalName is required')
  const organizationType = normalizeWorkspaceType(payload?.organizationType || workspace.workspace_type)
  const onboardingCompletedAt = payload?.onboardingCompleted ? new Date().toISOString() : null

  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_profiles
     (workspace_id, organization_type, company_legal_name, company_operating_name, industry, website_url, tax_identifier,
      primary_contact_name, primary_contact_email, primary_contact_phone, address_line1, address_line2, city, province_state,
      postal_code, country_code, onboarding_completed_at, created_at, updated_at)
     VALUES (
      $1::uuid, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14,
      $15, $16, $17::timestamp, now(), now()
     )
     ON CONFLICT (workspace_id) DO UPDATE SET
      organization_type = EXCLUDED.organization_type,
      company_legal_name = EXCLUDED.company_legal_name,
      company_operating_name = EXCLUDED.company_operating_name,
      industry = EXCLUDED.industry,
      website_url = EXCLUDED.website_url,
      tax_identifier = EXCLUDED.tax_identifier,
      primary_contact_name = EXCLUDED.primary_contact_name,
      primary_contact_email = EXCLUDED.primary_contact_email,
      primary_contact_phone = EXCLUDED.primary_contact_phone,
      address_line1 = EXCLUDED.address_line1,
      address_line2 = EXCLUDED.address_line2,
      city = EXCLUDED.city,
      province_state = EXCLUDED.province_state,
      postal_code = EXCLUDED.postal_code,
      country_code = EXCLUDED.country_code,
      onboarding_completed_at = COALESCE(EXCLUDED.onboarding_completed_at, taxgpt.accounting_workspace_profiles.onboarding_completed_at),
      updated_at = now()
     RETURNING workspace_id, organization_type, company_legal_name, company_operating_name, industry, website_url, tax_identifier,
               primary_contact_name, primary_contact_email, primary_contact_phone, address_line1, address_line2, city, province_state,
               postal_code, country_code, onboarding_completed_at, created_at, updated_at`,
    [
      workspace.id,
      organizationType,
      companyLegalName,
      normalizeOptionalText(payload?.companyOperatingName),
      normalizeOptionalText(payload?.industry),
      normalizeOptionalText(payload?.websiteUrl),
      normalizeOptionalText(payload?.taxIdentifier),
      normalizeOptionalText(payload?.primaryContactName),
      normalizeOptionalText(payload?.primaryContactEmail),
      normalizeOptionalText(payload?.primaryContactPhone),
      normalizeOptionalText(payload?.addressLine1),
      normalizeOptionalText(payload?.addressLine2),
      normalizeOptionalText(payload?.city),
      normalizeOptionalText(payload?.provinceState),
      normalizeOptionalText(payload?.postalCode),
      String(payload?.countryCode || 'CA').trim().toUpperCase().slice(0, 2) || 'CA',
      onboardingCompletedAt
    ]
  )

  return { workspace, profile: rows[0] }
}

export async function listWorkspaceMembers (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  const { rows } = await pool.query(
    `SELECT m.workspace_id, m.clerk_user_id, m.role, m.status, m.invited_by, m.created_at, m.updated_at
     FROM taxgpt.accounting_workspace_members m
     WHERE m.workspace_id = $1::uuid
     ORDER BY m.created_at ASC`,
    [workspace.id]
  )
  return { workspace, members: rows }
}

export async function addWorkspaceMember (pool, actorUserId, workspaceId, payload) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  await assertWorkspacePermissionWithCustomRoles(pool, {
    workspaceId: workspace.id,
    workspaceRole: workspace.role,
    clerkUserId: actorUserId,
    permission: 'workspace.invite'
  })
  const clerkUserId = String(payload?.clerkUserId || '').trim()
  if (!clerkUserId) throw new Error('clerkUserId is required')
  const role = String(payload?.role || 'preparer')
  assertRole(role)
  const entitlements = await getWorkspaceEntitlementSnapshot(pool, workspace.id)
  if (!entitlements.can_invite_users) {
    throw new Error('Current workspace plan does not allow inviting users')
  }
  const activeUsers = await getWorkspaceActiveUserCount(pool, workspace.id)
  if (activeUsers >= Number(entitlements.max_users || 0)) {
    throw new Error('Workspace user limit reached for current plan')
  }
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_members
     (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, 'active', $4, now(), now())
     ON CONFLICT (workspace_id, clerk_user_id)
     DO UPDATE SET role = EXCLUDED.role, status = 'active', invited_by = EXCLUDED.invited_by, updated_at = now()
     RETURNING workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at`,
    [workspace.id, clerkUserId, role, actorUserId]
  )
  await writeWorkspaceAuditEvent(pool, workspace.id, actorUserId, 'workspace.member_added', 'workspace_member', clerkUserId, null, rows[0])
  return rows[0]
}

export async function updateWorkspaceMember (pool, actorUserId, workspaceId, memberUserId, payload) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  if (!canManageWorkspace(workspace)) {
    throw new Error('Only owner/admin can update members')
  }
  const role = payload?.role ? String(payload.role) : null
  const status = payload?.status ? String(payload.status) : null
  if (role) assertRole(role)
  if (status && !['active', 'inactive'].includes(status)) throw new Error('Invalid member status')

  const { rows } = await pool.query(
    `UPDATE taxgpt.accounting_workspace_members
     SET role = COALESCE($1, role),
         status = COALESCE($2, status),
         updated_at = now()
     WHERE workspace_id = $3::uuid
       AND clerk_user_id = $4
     RETURNING workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at`,
    [role, status, workspace.id, memberUserId]
  )
  if (!rows[0]) throw new Error('Member not found')
  await writeWorkspaceAuditEvent(pool, workspace.id, actorUserId, 'workspace.member_updated', 'workspace_member', memberUserId, null, rows[0])
  return rows[0]
}

export async function listWorkspaceInvites (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  const { rows } = await pool.query(
    `SELECT id, workspace_id, invite_email, invite_token, role, status, source, clerk_invitation_id, invited_by, accepted_by, expires_at, created_at, updated_at
     FROM taxgpt.accounting_workspace_invites
     WHERE workspace_id = $1::uuid
     ORDER BY created_at DESC`,
    [workspace.id]
  )
  return { workspace, invites: rows }
}

export async function createWorkspaceInvite (pool, actorUserId, workspaceId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  await assertWorkspacePermissionWithCustomRoles(pool, {
    workspaceId: workspace.id,
    workspaceRole: workspace.role,
    clerkUserId: actorUserId,
    permission: 'workspace.invite'
  })
  const entitlements = await getWorkspaceEntitlementSnapshot(pool, workspace.id)
  if (!entitlements.can_invite_users) {
    throw new Error('Current workspace plan does not allow inviting users')
  }
  const activeUsers = await getWorkspaceActiveUserCount(pool, workspace.id)
  if (activeUsers >= Number(entitlements.max_users || 0)) {
    throw new Error('Workspace user limit reached for current plan')
  }
  const role = String(payload?.role || 'preparer')
  assertRole(role)
  const inviteEmail = normalizeInviteEmail(payload?.email)
  const linkedWorkspace = await safeEnsureWorkspaceClerkOrganization(pool, workspace, actorUserId)
  let clerkInvitation = null
  if (linkedWorkspace.clerk_org_id) {
    clerkInvitation = await createClerkOrganizationInvitation({
      organizationId: linkedWorkspace.clerk_org_id,
      emailAddress: inviteEmail,
      role: mapWorkspaceRoleToClerkOrgRole(role),
      inviterUserId: actorUserId,
      redirectUrl: getInviteRedirectUrl(),
      publicMetadata: {
        invite_type: 'workspace_member',
        workspace_id: linkedWorkspace.id,
        workspace_name: linkedWorkspace.name,
        workspace_role: role,
        invited_by: actorUserId
      }
    })
  } else {
    clerkInvitation = await createClerkEmailInvite({
      emailAddress: inviteEmail,
      redirectUrl: getInviteRedirectUrl(),
      publicMetadata: {
        invite_type: 'workspace_member',
        workspace_id: linkedWorkspace.id,
        workspace_name: linkedWorkspace.name,
        workspace_role: role,
        invited_by: actorUserId
      }
    })
  }
  const token = `clerk:${clerkInvitation.id}:${randomBytes(8).toString('hex')}`
  const expiresAt = payload?.expiresAt || new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()

  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_invites
     (workspace_id, invite_email, invite_token, role, status, source, clerk_invitation_id, invited_by, expires_at, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, 'pending', 'clerk', $5, $6, $7::timestamp, now(), now())
     RETURNING id, workspace_id, invite_email, invite_token, role, status, source, clerk_invitation_id, invited_by, accepted_by, expires_at, created_at, updated_at`,
    [linkedWorkspace.id, inviteEmail, token, role, clerkInvitation.id, actorUserId, expiresAt]
  )
  await writeWorkspaceAuditEvent(pool, linkedWorkspace.id, actorUserId, 'workspace.invite_created', 'workspace_invite', rows[0].id, null, rows[0])
  return {
    ...rows[0],
    clerk_invitation_id: clerkInvitation.id,
    clerk_invitation_status: clerkInvitation.status || 'pending'
  }
}

export async function acceptWorkspaceInvite (pool, actorUserId, actorEmail, inviteToken) {
  const token = String(inviteToken || '').trim()
  if (!token) throw new Error('Invite token is required')

  const { rows: inviteRows } = await pool.query(
    `SELECT i.*, w.name AS workspace_name
     FROM taxgpt.accounting_workspace_invites i
     INNER JOIN taxgpt.accounting_workspaces w ON w.id = i.workspace_id
     WHERE i.invite_token = $1
     LIMIT 1`,
    [token]
  )
  const invite = inviteRows[0]
  if (!invite) throw new Error('Invite not found')
  if (invite.status !== 'pending') throw new Error('Invite is no longer pending')
  if (new Date(invite.expires_at).getTime() < Date.now()) throw new Error('Invite has expired')
  if (invite.invite_email) {
    if (!actorEmail) throw new Error('Signed-in account email unavailable; please contact workspace admin')
    if (String(actorEmail).trim().toLowerCase() !== String(invite.invite_email).trim().toLowerCase()) {
      throw new Error('Signed-in account email does not match this invite')
    }
  }

  await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_members
     (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, 'active', $4, now(), now())
     ON CONFLICT (workspace_id, clerk_user_id)
     DO UPDATE SET role = EXCLUDED.role, status = 'active', invited_by = EXCLUDED.invited_by, updated_at = now()`,
    [invite.workspace_id, actorUserId, invite.role, invite.invited_by]
  )

  const { rows: updatedInvite } = await pool.query(
    `UPDATE taxgpt.accounting_workspace_invites
     SET status = 'accepted', accepted_by = $1, updated_at = now()
     WHERE id = $2::uuid
     RETURNING id, workspace_id, invite_email, invite_token, role, status, invited_by, accepted_by, expires_at, created_at, updated_at`,
    [actorUserId, invite.id]
  )

  const workspace = await getWorkspaceContext(pool, actorUserId, invite.workspace_id)
  return { invite: updatedInvite[0], workspace }
}

export async function acceptPendingWorkspaceInvites (pool, actorUserId, actorEmail) {
  const normalizedEmail = String(actorEmail || '').trim().toLowerCase()
  if (!normalizedEmail) {
    return { acceptedInvites: [] }
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: pendingInvites } = await client.query(
      `SELECT i.id, i.workspace_id, i.invite_email, i.role, i.invited_by, w.name AS workspace_name
       FROM taxgpt.accounting_workspace_invites i
       INNER JOIN taxgpt.accounting_workspaces w ON w.id = i.workspace_id
       WHERE i.status = 'pending'
         AND i.expires_at >= now()
         AND lower(i.invite_email) = $1
       ORDER BY i.created_at ASC
       FOR UPDATE`,
      [normalizedEmail]
    )

    const acceptedInvites = []
    for (const invite of pendingInvites) {
      await client.query(
        `INSERT INTO taxgpt.accounting_workspace_members
         (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
         VALUES ($1::uuid, $2, $3, 'active', $4, now(), now())
         ON CONFLICT (workspace_id, clerk_user_id)
         DO UPDATE SET role = EXCLUDED.role, status = 'active', invited_by = EXCLUDED.invited_by, updated_at = now()`,
        [invite.workspace_id, actorUserId, invite.role, invite.invited_by]
      )
      await client.query(
        `UPDATE taxgpt.accounting_workspace_invites
         SET status = 'accepted', accepted_by = $1, updated_at = now()
         WHERE id = $2::uuid`,
        [actorUserId, invite.id]
      )
      acceptedInvites.push({
        inviteId: invite.id,
        workspaceId: invite.workspace_id,
        workspaceName: invite.workspace_name,
        role: invite.role
      })
    }
    await client.query('COMMIT')
    return { acceptedInvites }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function getWorkspacePermissionSnapshot (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  const authz = await getWorkspaceAuthorizationContext(pool, workspace, actorUserId)
  return { workspace, authorization: authz }
}

export async function getWorkspaceOrgMigrationHealth (pool) {
  await ensureWorkspaceTables(pool)
  const { rows: summaryRows } = await pool.query(
    `SELECT
       count(*)::int AS total_workspaces,
       count(*) FILTER (WHERE clerk_org_id IS NOT NULL)::int AS mapped_workspaces,
       count(*) FILTER (WHERE clerk_org_id IS NULL)::int AS unmapped_workspaces
     FROM taxgpt.accounting_workspaces`
  )
  const { rows: unmappedRows } = await pool.query(
    `SELECT id, name, owner_user_id, workspace_type, created_at
     FROM taxgpt.accounting_workspaces
     WHERE clerk_org_id IS NULL
     ORDER BY created_at ASC
     LIMIT 25`
  )
  return {
    summary: summaryRows[0] || {
      total_workspaces: 0,
      mapped_workspaces: 0,
      unmapped_workspaces: 0
    },
    sampleUnmappedWorkspaces: unmappedRows
  }
}


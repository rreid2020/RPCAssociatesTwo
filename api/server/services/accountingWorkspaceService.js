import { randomBytes } from 'crypto'
import {
  createClerkEmailInvite,
  formatClerkError,
  getClerkBackendClient,
  createClerkOrganization,
  createClerkOrganizationInvitation,
  resolveClerkUserIdByEmail
} from './clerkAdminService.js'
import {
  assertWorkspacePermissionWithCustomRoles,
  ensureWorkspaceRbacTables,
  resolveEffectiveWorkspacePermissions
} from './authz/workspaceRbacService.js'
import { ensurePortalSchema } from '../db/ensurePortalSchema.js'
import {
  deleteWorkspaceRecord,
  fetchWorkspaceInvites,
  fetchWorkspaceMembers,
  fetchWorkspaceProfile,
  insertWorkspaceInviteRecord,
  revokePendingWorkspaceInvitesForEmail,
  updateWorkspaceMemberRecord,
  updateWorkspaceRecord,
  upsertWorkspaceMember,
  upsertWorkspaceProfileRecord
} from './repositories/workspaceRepository.js'
import {
  deactivateOrganizationMemberHierarchy,
  deleteOrganizationMemberByUserId,
  fetchOrganizationAssignmentCounts,
  fetchOrganizationById,
  fetchOrganizationMembers,
  updateOrganizationMemberByUserId,
  upsertInvitedOrganizationMember
} from './repositories/organizationRepository.js'

const WORKSPACE_ROLES = new Set(['owner', 'admin', 'manager', 'reviewer', 'preparer', 'read_only', 'client'])
const WORKSPACE_TYPES = new Set(['business', 'firm'])
const BUSINESS_PROFILE_TYPES = new Set([
  'accounting_firm',
  'sole_proprietorship',
  'partnership',
  'corporation',
  'professional_corporation',
  'llc',
  'nonprofit',
  'charity',
  'cooperative',
  'trust',
  'government',
  'other'
])

let workspaceTablesEnsurePromise = null

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

function normalizeBusinessProfileType (value) {
  const type = String(value || 'corporation').trim().toLowerCase()
  if (!BUSINESS_PROFILE_TYPES.has(type)) {
    throw new Error('Invalid business type')
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
  const { rows: workspaceRows } = await pool.query(
    `SELECT organization_id
     FROM taxgpt.accounting_workspaces
     WHERE id = $1::uuid
     LIMIT 1`,
    [workspaceId]
  )
  const organizationId = workspaceRows[0]?.organization_id || null
  await pool.query(
    `INSERT INTO taxgpt.accounting_audit_log
     (organization_id, clerk_user_id, entity_type, entity_id, action, actor_id, before_value, after_value, created_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $2, $6::jsonb, $7::jsonb, now())`,
    [
      organizationId,
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
  if (!workspaceTablesEnsurePromise) {
    workspaceTablesEnsurePromise = (async () => {
      await ensurePortalSchema(pool)
      await ensureWorkspaceRbacTables(pool)
    })().catch((error) => {
      workspaceTablesEnsurePromise = null
      throw error
    })
  }
  await workspaceTablesEnsurePromise
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
  if (existing[0]) {
    return existing[0]
  }

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
  const linked = await ensureHierarchyMembershipForWorkspaceUser(pool, workspace, clerkUserId, clerkUserId)
  await ensureLegacyAssignmentsForWorkspaceUser(pool, linked, clerkUserId, clerkUserId)
  return linked
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

const CLERK_ORG_SYNC_TIMEOUT_MS = 8000

async function safeEnsureWorkspaceClerkOrganization (pool, workspace, actorUserId) {
  try {
    const syncPromise = ensureWorkspaceClerkOrganization(pool, workspace, actorUserId)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Clerk organization sync timed out')), CLERK_ORG_SYNC_TIMEOUT_MS)
    })
    return await Promise.race([syncPromise, timeoutPromise])
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

function buildDisplayNameFromClerkUser (user = {}) {
  const first = String(user.firstName || '').trim()
  const last = String(user.lastName || '').trim()
  const full = `${first} ${last}`.trim()
  if (full) return full
  const username = String(user.username || '').trim()
  if (username) return username
  return null
}

function extractPrimaryEmailFromClerkUser (user = {}) {
  const primaryId = user?.primaryEmailAddressId || null
  const addresses = Array.isArray(user?.emailAddresses) ? user.emailAddresses : []
  const primary = addresses.find((entry) => entry.id === primaryId) || addresses[0] || null
  return String(primary?.emailAddress || '').trim() || null
}

async function enrichOrganizationEmployees (employees = []) {
  const client = getClerkBackendClient()
  const enriched = []
  for (const member of employees) {
    const clerkUserId = String(member.clerk_user_id || '')
    const inviteMatch = clerkUserId.startsWith('invite:') ? clerkUserId.slice('invite:'.length).trim().toLowerCase() : null
    if (inviteMatch) {
      enriched.push({
        ...member,
        display_name: inviteMatch,
        email: inviteMatch
      })
      continue
    }
    try {
      const user = await client.users.getUser(clerkUserId)
      enriched.push({
        ...member,
        display_name: buildDisplayNameFromClerkUser(user) || extractPrimaryEmailFromClerkUser(user) || clerkUserId,
        email: extractPrimaryEmailFromClerkUser(user)
      })
    } catch {
      enriched.push({
        ...member,
        display_name: clerkUserId,
        email: null
      })
    }
  }
  return enriched
}

function mapWorkspaceRoleToOrganizationMemberRole (workspaceRole) {
  return ['owner', 'admin', 'manager'].includes(String(workspaceRole || '').toLowerCase()) ? 'admin' : 'member'
}

function mapOrganizationInviteRoleToWorkspaceRole (organizationRole) {
  const normalized = String(organizationRole || 'member').trim().toLowerCase()
  if (normalized === 'admin' || normalized === 'owner') return 'admin'
  if (WORKSPACE_ROLES.has(normalized)) return normalized
  return 'preparer'
}

async function finalizeOrganizationEmployeeMembership (pool, {
  organizationId,
  workspaceId,
  clerkUserId,
  inviteEmail = null,
  workspaceRole = 'preparer',
  invitedBy = null
}) {
  const resolvedWorkspaceRole = mapOrganizationInviteRoleToWorkspaceRole(workspaceRole)
  const organizationRole = mapWorkspaceRoleToOrganizationMemberRole(resolvedWorkspaceRole)
  const inviter = invitedBy || clerkUserId

  await upsertWorkspaceMember(pool, workspaceId, clerkUserId, resolvedWorkspaceRole, inviter)

  if (inviteEmail) {
    const placeholderId = `invite:${normalizeInviteEmail(inviteEmail)}`
    await deleteOrganizationMemberByUserId(pool, organizationId, placeholderId)
  }

  await ensureOrganizationMember(pool, organizationId, clerkUserId, organizationRole, inviter)

  const { rows: workspaceRows } = await pool.query(
    `SELECT *
     FROM taxgpt.accounting_workspaces
     WHERE id = $1::uuid
     LIMIT 1`,
    [workspaceId]
  )
  const workspace = workspaceRows[0]
  if (workspace) {
    await ensureWorkspaceEmployeeAssignment(pool, workspace, clerkUserId, inviter, organizationRole)
    await ensureLegacyAssignmentsForWorkspaceUser(pool, workspace, clerkUserId, inviter)
  }

  return {
    organizationId,
    workspaceId,
    clerkUserId,
    workspaceRole: resolvedWorkspaceRole,
    organizationRole
  }
}

async function ensureOrganizationLinkForWorkspace (pool, workspace) {
  if (!workspace) throw new Error('Workspace is required')
  if (workspace.organization_id) return workspace
  const orgSlug = `org-${slugifyWorkspaceName(workspace.name)}-${String(workspace.id).slice(0, 8)}`
  const { rows: inserted } = await pool.query(
    `INSERT INTO taxgpt.accounting_organizations
     (owner_user_id, name, slug, organization_type, clerk_org_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, now(), now())
     ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      organization_type = EXCLUDED.organization_type,
      clerk_org_id = COALESCE(EXCLUDED.clerk_org_id, taxgpt.accounting_organizations.clerk_org_id),
      updated_at = now()
     RETURNING *`,
    [
      workspace.owner_user_id,
      workspace.name,
      orgSlug,
      workspace.workspace_type || 'business',
      workspace.clerk_org_id || null
    ]
  )
  const organization = inserted[0]
  const { rows: linked } = await pool.query(
    `UPDATE taxgpt.accounting_workspaces
     SET organization_id = $1::uuid, updated_at = now()
     WHERE id = $2::uuid
     RETURNING *`,
    [organization.id, workspace.id]
  )
  return linked[0] || workspace
}

async function ensureOrganizationMember (pool, organizationId, clerkUserId, role = 'member', invitedBy = null) {
  await pool.query(
    `INSERT INTO taxgpt.accounting_organization_members
     (organization_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, 'active', $4, now(), now())
     ON CONFLICT (organization_id, clerk_user_id)
     DO UPDATE SET role = EXCLUDED.role, status = 'active', invited_by = COALESCE(EXCLUDED.invited_by, taxgpt.accounting_organization_members.invited_by), updated_at = now()`,
    [organizationId, clerkUserId, role, invitedBy]
  )
}

async function ensureWorkspaceEmployeeAssignment (pool, workspace, clerkUserId, assignedBy, assignmentRole = 'member') {
  if (!workspace.organization_id) return
  await pool.query(
    `INSERT INTO taxgpt.workspace_employee_assignments
     (organization_id, workspace_id, clerk_user_id, assignment_role, status, assigned_by, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, 'active', $5, now(), now())
     ON CONFLICT (workspace_id, clerk_user_id)
     DO UPDATE SET assignment_role = EXCLUDED.assignment_role, status = 'active', updated_at = now()`,
    [workspace.organization_id, workspace.id, clerkUserId, assignmentRole, assignedBy]
  )
}

async function ensureEngagementAssignmentsForWorkspaceMember (pool, workspace, clerkUserId, assignedBy) {
  if (!workspace.organization_id) return
  const { rows: engagements } = await pool.query(
    `SELECT id
     FROM taxgpt.accounting_engagements
     WHERE (workspace_id = $1::uuid)
        OR (workspace_id IS NULL AND organization_id = $2::uuid)`,
    [workspace.id, workspace.organization_id]
  )
  for (const engagement of engagements) {
    await pool.query(
      `INSERT INTO taxgpt.engagement_employee_assignments
       (organization_id, workspace_id, engagement_id, clerk_user_id, assignment_role, status, assigned_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'member', 'active', $5, now(), now())
       ON CONFLICT (engagement_id, clerk_user_id)
       DO UPDATE SET status = 'active', updated_at = now()`,
      [workspace.organization_id, workspace.id, engagement.id, clerkUserId, assignedBy]
    )
  }
}

async function ensureWorkingPaperAssignmentsForWorkspaceMember (pool, workspace, clerkUserId, assignedBy) {
  if (!workspace.organization_id) return
  const { rows: leadSheets } = await pool.query(
    `SELECT ls.id AS lead_sheet_id, e.id AS engagement_id
     FROM taxgpt.lead_sheets ls
     INNER JOIN taxgpt.accounting_engagements e ON e.id = ls.engagement_id
     WHERE (e.workspace_id = $1::uuid)
        OR (e.workspace_id IS NULL AND e.organization_id = $2::uuid)`,
    [workspace.id, workspace.organization_id]
  )
  for (const row of leadSheets) {
    await pool.query(
      `INSERT INTO taxgpt.working_paper_employee_assignments
       (organization_id, workspace_id, engagement_id, lead_sheet_id, clerk_user_id, assignment_role, status, assigned_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, 'member', 'active', $6, now(), now())
       ON CONFLICT (lead_sheet_id, clerk_user_id)
       DO UPDATE SET status = 'active', updated_at = now()`,
      [workspace.organization_id, workspace.id, row.engagement_id, row.lead_sheet_id, clerkUserId, assignedBy]
    )
  }
}

async function resolveWorkspaceMemberRole (pool, workspaceId, clerkUserId, workspace = null) {
  const { rows } = await pool.query(
    `SELECT role
     FROM taxgpt.accounting_workspace_members
     WHERE workspace_id = $1::uuid
       AND clerk_user_id = $2
     LIMIT 1`,
    [workspaceId, clerkUserId]
  )
  if (rows[0]?.role) return String(rows[0].role)
  if (workspace?.owner_user_id === clerkUserId) return 'owner'
  return 'member'
}

async function syncOrganizationMemberRolesForWorkspace (pool, workspaceId, organizationId) {
  if (!workspaceId || !organizationId) return
  const { rows } = await pool.query(
    `SELECT wm.clerk_user_id, wm.role AS workspace_role
     FROM taxgpt.accounting_workspace_members wm
     WHERE wm.workspace_id = $1::uuid
       AND wm.status = 'active'`,
    [workspaceId]
  )
  for (const row of rows) {
    const orgRole = mapWorkspaceRoleToOrganizationMemberRole(row.workspace_role)
    await pool.query(
      `UPDATE taxgpt.accounting_organization_members
       SET role = $1, updated_at = now()
       WHERE organization_id = $2::uuid
         AND clerk_user_id = $3
         AND role IS DISTINCT FROM $1`,
      [orgRole, organizationId, row.clerk_user_id]
    )
  }
}

async function ensureHierarchyMembershipForWorkspaceUser (pool, workspace, clerkUserId, invitedBy = null) {
  const linkedWorkspace = await ensureOrganizationLinkForWorkspace(pool, workspace)
  if (!linkedWorkspace.organization_id) return linkedWorkspace
  const workspaceRole = await resolveWorkspaceMemberRole(pool, linkedWorkspace.id, clerkUserId, linkedWorkspace)
  const orgRole = mapWorkspaceRoleToOrganizationMemberRole(workspaceRole)
  await ensureOrganizationMember(pool, linkedWorkspace.organization_id, clerkUserId, orgRole, invitedBy || clerkUserId)
  await ensureWorkspaceEmployeeAssignment(pool, linkedWorkspace, clerkUserId, invitedBy || clerkUserId, orgRole)
  return linkedWorkspace
}

async function ensureLegacyAssignmentsForWorkspaceUser (pool, workspace, clerkUserId, assignedBy) {
  await ensureEngagementAssignmentsForWorkspaceMember(pool, workspace, clerkUserId, assignedBy)
  await ensureWorkingPaperAssignmentsForWorkspaceMember(pool, workspace, clerkUserId, assignedBy)
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

async function queryDefaultWorkspaceRow (pool, clerkUserId, expectedClerkOrgId, applyOrgFilter) {
  const orgFilterClause = applyOrgFilter && expectedClerkOrgId
    ? 'AND (w.clerk_org_id IS NULL OR w.clerk_org_id = $2)'
    : ''
  const queryParams = applyOrgFilter && expectedClerkOrgId ? [clerkUserId, expectedClerkOrgId] : [clerkUserId]
  const { rows } = await pool.query(
    `SELECT w.*, m.role, m.status
     FROM taxgpt.accounting_workspaces w
     INNER JOIN taxgpt.accounting_workspace_members m ON m.workspace_id = w.id
     LEFT JOIN taxgpt.accounting_workspace_profiles p ON p.workspace_id = w.id
     WHERE m.clerk_user_id = $1
       AND m.status = 'active'
       ${orgFilterClause}
     ORDER BY ${expectedClerkOrgId && applyOrgFilter ? 'CASE WHEN w.clerk_org_id = $2 THEN 0 ELSE 1 END,' : ''}
              w.is_personal ASC,
              (p.onboarding_completed_at IS NOT NULL) DESC,
              CASE WHEN m.role = 'owner' THEN 0 ELSE 1 END,
              w.created_at ASC
     LIMIT 1`,
    queryParams
  )
  return rows[0] || null
}

async function finalizeWorkspaceContext (pool, workspace, clerkUserId, expectedClerkOrgId, options = {}) {
  const relaxedOrgContext = Boolean(options.relaxedOrgContext || options.skipClerkOrgSync)
  if (
    !relaxedOrgContext
    && expectedClerkOrgId
    && workspace.clerk_org_id
    && workspace.clerk_org_id !== expectedClerkOrgId
  ) {
    throw new Error('Workspace organization context mismatch')
  }
  if (!workspace.organization_id) {
    workspace = await ensureOrganizationLinkForWorkspace(pool, workspace)
  }
  const skipClerkOrgSync = Boolean(options?.skipClerkOrgSync)
  if (!skipClerkOrgSync && !workspace.clerk_org_id && canManageWorkspace(workspace)) {
    return await safeEnsureWorkspaceClerkOrganization(pool, workspace, clerkUserId)
  }
  return workspace
}

export async function getWorkspaceContext (pool, clerkUserId, requestedWorkspaceId = null, options = {}) {
  const expectedClerkOrgId = String(options?.expectedClerkOrgId || '').trim() || null
  if (!requestedWorkspaceId) {
    const { rows: membershipRows } = await pool.query(
      `SELECT 1
       FROM taxgpt.accounting_workspace_members
       WHERE clerk_user_id = $1
         AND status = 'active'
       LIMIT 1`,
      [clerkUserId]
    )
    if (!membershipRows[0]) {
      await ensurePersonalWorkspace(pool, clerkUserId)
    }
  }
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
    return finalizeWorkspaceContext(pool, rows[0], clerkUserId, expectedClerkOrgId, options)
  }

  let workspace = await queryDefaultWorkspaceRow(pool, clerkUserId, expectedClerkOrgId, true)
  if (!workspace && expectedClerkOrgId) {
    workspace = await queryDefaultWorkspaceRow(pool, clerkUserId, expectedClerkOrgId, false)
  }
  if (!workspace) throw new Error('Workspace not found')
  return finalizeWorkspaceContext(pool, workspace, clerkUserId, expectedClerkOrgId, options)
}

export async function listWorkspacesForUser (pool, clerkUserId) {
  // Bootstrap failures should not take down workspace listing.
  try {
    await ensurePersonalWorkspace(pool, clerkUserId)
  } catch (error) {
    console.warn('ensurePersonalWorkspace failed; returning existing memberships', {
      clerkUserId,
      message: error instanceof Error ? error.message : String(error)
    })
  }

  try {
    const { rows } = await pool.query(
      `SELECT w.*, m.role, m.status,
              p.company_legal_name AS profile_company_legal_name,
              p.business_type AS profile_business_type,
              p.onboarding_completed_at AS profile_onboarding_completed_at
       FROM taxgpt.accounting_workspaces w
       INNER JOIN taxgpt.accounting_workspace_members m ON m.workspace_id = w.id
       LEFT JOIN taxgpt.accounting_workspace_profiles p ON p.workspace_id = w.id
       WHERE m.clerk_user_id = $1
         AND m.status = 'active'
       ORDER BY w.is_personal ASC,
                (p.onboarding_completed_at IS NOT NULL) DESC,
                w.created_at ASC`,
      [clerkUserId]
    )
    return rows
  } catch (error) {
    // Backward-compatible fallback for partial schema states.
    if (error && typeof error === 'object' && (error.code === '42P01' || error.code === '42703')) {
      const { rows } = await pool.query(
        `SELECT w.*, m.role, m.status
         FROM taxgpt.accounting_workspaces w
         INNER JOIN taxgpt.accounting_workspace_members m ON m.workspace_id = w.id
         WHERE m.clerk_user_id = $1
           AND m.status = 'active'
         ORDER BY w.created_at ASC`,
        [clerkUserId]
      )
      return rows
    }
    throw error
  }
}

export async function getOnboardingStatusForUser (pool, clerkUserId) {
  const workspaces = await listWorkspacesForUser(pool, clerkUserId)
  const teamWorkspaces = workspaces.filter((workspace) => !workspace.is_personal)
  const completedWorkspace =
    teamWorkspaces.find((workspace) => Boolean(workspace.profile_onboarding_completed_at)) ||
    workspaces.find((workspace) => Boolean(workspace.profile_onboarding_completed_at)) ||
    null
  return {
    required: !completedWorkspace,
    hasAccount: workspaces.length > 0,
    hasCompletedProfile: Boolean(completedWorkspace)
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
  let workspace = rows[0]
  await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_members
     (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, 'owner', 'active', $2, now(), now())`,
    [workspace.id, clerkUserId]
  )
  workspace = await ensureHierarchyMembershipForWorkspaceUser(pool, workspace, clerkUserId, clerkUserId)
  const linkedWorkspace = await safeEnsureWorkspaceClerkOrganization(pool, workspace, clerkUserId)
  await ensureLegacyAssignmentsForWorkspaceUser(pool, linkedWorkspace, clerkUserId, clerkUserId)
  if (payload?.profile) {
    await upsertWorkspaceProfile(pool, clerkUserId, linkedWorkspace.id, payload.profile)
  }
  return linkedWorkspace
}

export async function updateWorkspace (pool, actorUserId, workspaceId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  if (!canManageWorkspace(workspace)) {
    throw new Error('Only owner/admin can update workspace settings')
  }
  const nextName = String(payload.name || workspace.name).trim()
  if (!nextName) throw new Error('Workspace name is required')
  const nextType = payload.workspaceType ? normalizeWorkspaceType(payload.workspaceType) : workspace.workspace_type
  return updateWorkspaceRecord(pool, workspace.id, {
    name: nextName,
    workspaceType: nextType
  })
}

export async function deleteWorkspace (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  if (workspace.role !== 'owner') {
    throw new Error('Only workspace owner can delete workspace')
  }
  if (workspace.is_personal) {
    throw new Error('Personal workspace cannot be deleted')
  }
  return deleteWorkspaceRecord(pool, workspace.id)
}

export async function getWorkspaceProfile (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  const profile = await fetchWorkspaceProfile(pool, workspace.id)
  return { workspace, profile }
}

export async function upsertWorkspaceProfile (pool, actorUserId, workspaceId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  if (!canManageWorkspace(workspace)) {
    throw new Error('Only owner/admin can update workspace profile')
  }
  const companyLegalName = String(payload?.companyLegalName || '').trim()
  if (!companyLegalName) throw new Error('companyLegalName is required')
  const organizationType = normalizeWorkspaceType(payload?.organizationType || workspace.workspace_type)
  const businessType = normalizeBusinessProfileType(payload?.businessType)
  const onboardingCompletedAt = payload?.onboardingCompleted ? new Date().toISOString() : null

  const profile = await upsertWorkspaceProfileRecord(pool, workspace.id, {
    organizationType,
    businessType,
    companyLegalName,
    companyOperatingName: normalizeOptionalText(payload?.companyOperatingName),
    industry: normalizeOptionalText(payload?.industry),
    websiteUrl: normalizeOptionalText(payload?.websiteUrl),
    taxIdentifier: normalizeOptionalText(payload?.taxIdentifier),
    primaryContactName: normalizeOptionalText(payload?.primaryContactName),
    primaryContactEmail: normalizeOptionalText(payload?.primaryContactEmail),
    primaryContactPhone: normalizeOptionalText(payload?.primaryContactPhone),
    addressLine1: normalizeOptionalText(payload?.addressLine1),
    addressLine2: normalizeOptionalText(payload?.addressLine2),
    city: normalizeOptionalText(payload?.city),
    provinceState: normalizeOptionalText(payload?.provinceState),
    postalCode: normalizeOptionalText(payload?.postalCode),
    countryCode: String(payload?.countryCode || 'CA').trim().toUpperCase().slice(0, 2) || 'CA',
    onboardingCompletedAt
  })

  return { workspace, profile }
}

export async function listWorkspaceMembers (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  const members = await fetchWorkspaceMembers(pool, workspace.id)
  const enriched = []
  for (const member of members) {
    const clerkUserId = String(member.clerk_user_id || '')
    if (!clerkUserId || clerkUserId.startsWith('invite:')) {
      enriched.push({
        ...member,
        display_name: clerkUserId.startsWith('invite:') ? clerkUserId.slice('invite:'.length) : clerkUserId,
        email: clerkUserId.startsWith('invite:') ? clerkUserId.slice('invite:'.length) : null
      })
      continue
    }
    try {
      const client = getClerkBackendClient()
      const user = await client.users.getUser(clerkUserId)
      enriched.push({
        ...member,
        display_name: buildDisplayNameFromClerkUser(user) || extractPrimaryEmailFromClerkUser(user) || clerkUserId,
        email: extractPrimaryEmailFromClerkUser(user)
      })
    } catch {
      enriched.push({
        ...member,
        display_name: clerkUserId,
        email: null
      })
    }
  }
  return { workspace, members: enriched }
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
  const member = await upsertWorkspaceMember(pool, workspace.id, clerkUserId, role, actorUserId)
  await ensureOrganizationMember(
    pool,
    workspace.organization_id,
    clerkUserId,
    mapWorkspaceRoleToOrganizationMemberRole(role),
    actorUserId
  )
  await ensureWorkspaceEmployeeAssignment(
    pool,
    workspace,
    clerkUserId,
    actorUserId,
    mapWorkspaceRoleToOrganizationMemberRole(role)
  )
  await ensureLegacyAssignmentsForWorkspaceUser(pool, workspace, clerkUserId, actorUserId)
  await writeWorkspaceAuditEvent(pool, workspace.id, actorUserId, 'workspace.member_added', 'workspace_member', clerkUserId, null, member)
  return member
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

  const member = await updateWorkspaceMemberRecord(pool, workspace.id, memberUserId, role, status)
  if (!member) throw new Error('Member not found')
  await writeWorkspaceAuditEvent(pool, workspace.id, actorUserId, 'workspace.member_updated', 'workspace_member', memberUserId, null, member)
  return member
}

export async function listWorkspaceInvites (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  const invites = await fetchWorkspaceInvites(pool, workspace.id)
  return { workspace, invites }
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

  const invite = await insertWorkspaceInviteRecord(pool, {
    workspaceId: linkedWorkspace.id,
    inviteEmail,
    inviteToken: token,
    role,
    clerkInvitationId: clerkInvitation.id,
    invitedBy: actorUserId,
    expiresAt
  })
  await writeWorkspaceAuditEvent(pool, linkedWorkspace.id, actorUserId, 'workspace.invite_created', 'workspace_invite', invite.id, null, invite)
  return {
    ...invite,
    clerk_invitation_id: clerkInvitation.id,
    clerk_invitation_status: clerkInvitation.status || 'pending'
  }
}

async function fetchOrganizationMemberRecord (pool, organizationId, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT organization_id, clerk_user_id, role, status, invited_by
     FROM taxgpt.accounting_organization_members
     WHERE organization_id = $1::uuid
       AND clerk_user_id = $2
     LIMIT 1`,
    [organizationId, clerkUserId]
  )
  return rows[0] || null
}

async function reactivateOrganizationEmployeeMembership (pool, linkedWorkspace, {
  clerkUserId,
  inviteEmail,
  memberRole,
  actorUserId
}) {
  const workspaceRole = mapOrganizationInviteRoleToWorkspaceRole(memberRole)
  await deleteOrganizationMemberByUserId(pool, linkedWorkspace.organization_id, `invite:${inviteEmail}`)
  const membership = await finalizeOrganizationEmployeeMembership(pool, {
    organizationId: linkedWorkspace.organization_id,
    workspaceId: linkedWorkspace.id,
    clerkUserId,
    inviteEmail,
    workspaceRole,
    invitedBy: actorUserId
  })
  await revokePendingWorkspaceInvitesForEmail(pool, linkedWorkspace.id, inviteEmail)
  return membership
}

function isClerkDuplicateMembershipError (message) {
  return /already.*(member|invited|organization)|duplicate|identifier already exists/i.test(String(message || ''))
}

export async function createOrganizationEmployeeInvite (pool, actorUserId, workspaceId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  await assertWorkspacePermissionWithCustomRoles(pool, {
    workspaceId: workspace.id,
    workspaceRole: workspace.role,
    clerkUserId: actorUserId,
    permission: 'workspace.invite'
  })
  const inviteEmail = normalizeInviteEmail(payload?.email)
  const memberRole = String(payload?.role || 'member').trim().toLowerCase() || 'member'
  const linkedWorkspace = await safeEnsureWorkspaceClerkOrganization(pool, workspace, actorUserId)
  const workspaceRole = mapOrganizationInviteRoleToWorkspaceRole(memberRole)
  const placeholderId = `invite:${inviteEmail}`
  const clerkUserId = await resolveClerkUserIdByEmail(inviteEmail)

  const placeholderMember = await fetchOrganizationMemberRecord(pool, linkedWorkspace.organization_id, placeholderId)
  const existingUserMember = clerkUserId
    ? await fetchOrganizationMemberRecord(pool, linkedWorkspace.organization_id, clerkUserId)
    : null

  if (existingUserMember?.status === 'active') {
    throw new Error('This employee is already active on your organization roster. Update their role instead of sending a new invite.')
  }

  if (existingUserMember) {
    const membership = await reactivateOrganizationEmployeeMembership(pool, linkedWorkspace, {
      clerkUserId,
      inviteEmail,
      memberRole,
      actorUserId
    })
    return {
      organizationId: linkedWorkspace.organization_id,
      workspaceId: linkedWorkspace.id,
      inviteEmail,
      role: memberRole,
      workspaceRole,
      reactivated: true,
      clerkInvitationStatus: 'existing_member',
      membership
    }
  }

  if (placeholderMember?.status === 'active') {
    throw new Error('This employee is already active on your organization roster.')
  }

  if (placeholderMember?.status === 'invited') {
    await revokePendingWorkspaceInvitesForEmail(pool, linkedWorkspace.id, inviteEmail)
  }

  let clerkInvitation = null
  try {
    if (linkedWorkspace.clerk_org_id) {
      clerkInvitation = await createClerkOrganizationInvitation({
        organizationId: linkedWorkspace.clerk_org_id,
        emailAddress: inviteEmail,
        role: memberRole === 'admin' ? 'org:admin' : 'org:member',
        inviterUserId: actorUserId,
        redirectUrl: getInviteRedirectUrl(),
        publicMetadata: {
          invite_type: 'organization_employee',
          organization_id: linkedWorkspace.organization_id,
          workspace_id: linkedWorkspace.id,
          workspace_role: workspaceRole,
          invited_by: actorUserId
        }
      })
    } else {
      clerkInvitation = await createClerkEmailInvite({
        emailAddress: inviteEmail,
        redirectUrl: getInviteRedirectUrl(),
        publicMetadata: {
          invite_type: 'organization_employee',
          organization_id: linkedWorkspace.organization_id,
          workspace_id: linkedWorkspace.id,
          workspace_role: workspaceRole,
          invited_by: actorUserId
        }
      })
    }
  } catch (error) {
    const clerkMessage = formatClerkError(error)
    if (clerkUserId && isClerkDuplicateMembershipError(clerkMessage)) {
      const membership = await reactivateOrganizationEmployeeMembership(pool, linkedWorkspace, {
        clerkUserId,
        inviteEmail,
        memberRole,
        actorUserId
      })
      return {
        organizationId: linkedWorkspace.organization_id,
        workspaceId: linkedWorkspace.id,
        inviteEmail,
        role: memberRole,
        workspaceRole,
        reactivated: true,
        clerkInvitationStatus: 'existing_member',
        membership
      }
    }
    throw new Error(clerkMessage || 'Could not create employee invitation')
  }

  await upsertInvitedOrganizationMember(pool, linkedWorkspace.organization_id, inviteEmail, memberRole, actorUserId)
  const inviteToken = `clerk:${clerkInvitation.id}:${randomBytes(8).toString('hex')}`
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()
  await insertWorkspaceInviteRecord(pool, {
    workspaceId: linkedWorkspace.id,
    inviteEmail,
    inviteToken,
    role: workspaceRole,
    clerkInvitationId: clerkInvitation.id,
    invitedBy: actorUserId,
    expiresAt
  })
  return {
    organizationId: linkedWorkspace.organization_id,
    workspaceId: linkedWorkspace.id,
    inviteEmail,
    role: memberRole,
    workspaceRole,
    clerkInvitationId: clerkInvitation.id,
    clerkInvitationStatus: clerkInvitation.status || 'pending',
    reactivated: false
  }
}

export async function updateOrganizationMember (pool, actorUserId, workspaceId, memberUserId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  if (!canManageWorkspace(workspace)) {
    throw new Error('Only owner/admin can update organization members')
  }
  const role = payload?.role ? String(payload.role).trim().toLowerCase() : null
  const status = payload?.status ? String(payload.status).trim().toLowerCase() : null
  if (status && !['active', 'inactive', 'invited'].includes(status)) throw new Error('Invalid organization member status')
  const member = await updateOrganizationMemberByUserId(pool, workspace.organization_id, memberUserId, role, status)
  if (!member) throw new Error('Organization member not found')
  return member
}

export async function deleteOrganizationMember (pool, actorUserId, workspaceId, memberUserId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  if (!canManageWorkspace(workspace)) {
    throw new Error('Only owner/admin can remove organization members')
  }
  const normalizedMemberUserId = String(memberUserId || '').trim()
  if (!normalizedMemberUserId) throw new Error('Member user id is required')
  if (normalizedMemberUserId === String(actorUserId)) {
    throw new Error('You cannot remove yourself from the organization roster')
  }
  if (workspace.owner_user_id === normalizedMemberUserId) {
    throw new Error('The workspace owner cannot be removed from the organization roster')
  }

  const isPendingInvitePlaceholder = normalizedMemberUserId.startsWith('invite:')
  const emailsToCleanup = new Set()
  if (isPendingInvitePlaceholder) {
    emailsToCleanup.add(normalizedMemberUserId.slice('invite:'.length))
  } else {
    await deactivateOrganizationMemberHierarchy(pool, workspace.organization_id, normalizedMemberUserId)
    try {
      const client = getClerkBackendClient()
      const user = await client.users.getUser(normalizedMemberUserId)
      const primaryEmail = extractPrimaryEmailFromClerkUser(user)
      if (primaryEmail) emailsToCleanup.add(normalizeInviteEmail(primaryEmail))
    } catch {}
  }

  const removed = await deleteOrganizationMemberByUserId(pool, workspace.organization_id, normalizedMemberUserId)
  if (!removed) throw new Error('Organization member not found')

  for (const email of emailsToCleanup) {
    await deleteOrganizationMemberByUserId(pool, workspace.organization_id, `invite:${email}`)
    await revokePendingWorkspaceInvitesForEmail(pool, workspace.id, email)
  }

  return { organizationId: workspace.organization_id, clerkUserId: normalizedMemberUserId, removed: true }
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
  await ensureOrganizationMember(
    pool,
    workspace.organization_id,
    actorUserId,
    mapWorkspaceRoleToOrganizationMemberRole(invite.role),
    invite.invited_by
  )
  await ensureWorkspaceEmployeeAssignment(
    pool,
    workspace,
    actorUserId,
    invite.invited_by || actorUserId,
    mapWorkspaceRoleToOrganizationMemberRole(invite.role)
  )
  await ensureLegacyAssignmentsForWorkspaceUser(pool, workspace, actorUserId, invite.invited_by || actorUserId)
  return { invite: updatedInvite[0], workspace }
}

export async function acceptPendingWorkspaceInvites (pool, actorUserId, actorEmail) {
  const normalizedEmail = String(actorEmail || '').trim().toLowerCase()
  if (!normalizedEmail) {
    const organizationOnly = await acceptPendingOrganizationEmployeeInvites(pool, actorUserId, actorEmail)
    return { acceptedInvites: [], acceptedOrganizationInvites: organizationOnly.acceptedInvites }
  }
  const client = await pool.connect()
  let acceptedInvites = []
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

    acceptedInvites = []
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
      const workspace = await getWorkspaceContext(pool, actorUserId, invite.workspace_id)
      await ensureOrganizationMember(
        client,
        workspace.organization_id,
        actorUserId,
        mapWorkspaceRoleToOrganizationMemberRole(invite.role),
        invite.invited_by
      )
      await ensureWorkspaceEmployeeAssignment(
        client,
        workspace,
        actorUserId,
        invite.invited_by || actorUserId,
        mapWorkspaceRoleToOrganizationMemberRole(invite.role)
      )
      acceptedInvites.push({
        inviteId: invite.id,
        workspaceId: invite.workspace_id,
        workspaceName: invite.workspace_name,
        role: invite.role
      })
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }

  const organizationAccepted = await acceptPendingOrganizationEmployeeInvites(pool, actorUserId, actorEmail)
  return {
    acceptedInvites,
    acceptedOrganizationInvites: organizationAccepted.acceptedInvites
  }
}

export async function acceptPendingOrganizationEmployeeInvites (pool, actorUserId, actorEmail) {
  const normalizedEmail = normalizeInviteEmail(actorEmail)
  if (!normalizedEmail) {
    return { acceptedInvites: [] }
  }

  const acceptedInvites = []
  const placeholderId = `invite:${normalizedEmail}`
  const { rows: pendingPlaceholders } = await pool.query(
    `SELECT organization_id, role, invited_by
     FROM taxgpt.accounting_organization_members
     WHERE clerk_user_id = $1
       AND status IN ('invited', 'active')`,
    [placeholderId]
  )

  for (const pending of pendingPlaceholders) {
    const { rows: workspaces } = await pool.query(
      `SELECT id, name
       FROM taxgpt.accounting_workspaces
       WHERE organization_id = $1::uuid
         AND is_personal = false
       ORDER BY created_at ASC`,
      [pending.organization_id]
    )
    for (const workspace of workspaces) {
      const result = await finalizeOrganizationEmployeeMembership(pool, {
        organizationId: pending.organization_id,
        workspaceId: workspace.id,
        clerkUserId: actorUserId,
        inviteEmail: normalizedEmail,
        workspaceRole: pending.role,
        invitedBy: pending.invited_by || actorUserId
      })
      acceptedInvites.push({
        ...result,
        workspaceName: workspace.name,
        source: 'organization_invite_placeholder'
      })
    }
  }

  const { rows: activeOrgMemberships } = await pool.query(
    `SELECT organization_id, role, invited_by
     FROM taxgpt.accounting_organization_members
     WHERE clerk_user_id = $1
       AND status = 'active'`,
    [actorUserId]
  )

  for (const membership of activeOrgMemberships) {
    const { rows: workspaces } = await pool.query(
      `SELECT w.id, w.name
       FROM taxgpt.accounting_workspaces w
       WHERE w.organization_id = $1::uuid
         AND w.is_personal = false
         AND NOT EXISTS (
           SELECT 1
           FROM taxgpt.accounting_workspace_members wm
           WHERE wm.workspace_id = w.id
             AND wm.clerk_user_id = $2
             AND wm.status = 'active'
         )
       ORDER BY w.created_at ASC`,
      [membership.organization_id, actorUserId]
    )
    for (const workspace of workspaces) {
      const result = await finalizeOrganizationEmployeeMembership(pool, {
        organizationId: membership.organization_id,
        workspaceId: workspace.id,
        clerkUserId: actorUserId,
        workspaceRole: membership.role,
        invitedBy: membership.invited_by || actorUserId
      })
      acceptedInvites.push({
        ...result,
        workspaceName: workspace.name,
        source: 'organization_membership_repair'
      })
    }
  }

  return { acceptedInvites }
}

function resolveClerkUserIdFromMembershipPayload (payload = {}) {
  return String(
    payload.public_user_data?.user_id ||
    payload.publicUserData?.userId ||
    payload.publicUserData?.user_id ||
    payload.user_id ||
    payload.userId ||
    ''
  ).trim()
}

function resolveClerkOrgIdFromMembershipPayload (payload = {}) {
  return String(
    payload.organization?.id ||
    payload.organization_id ||
    payload.organizationId ||
    ''
  ).trim()
}

function mapClerkMembershipRoleToWorkspaceRole (payload = {}) {
  const metadata = payload.public_metadata || payload.publicMetadata || {}
  if (metadata.workspace_role) {
    return mapOrganizationInviteRoleToWorkspaceRole(metadata.workspace_role)
  }
  const normalized = String(payload.role || '').trim().toLowerCase()
  if (normalized === 'org:admin') return 'admin'
  return 'preparer'
}

export async function syncOrganizationEmployeeFromClerkEvent (pool, payload = {}, options = {}) {
  const clerkUserId = resolveClerkUserIdFromMembershipPayload(payload)
  const clerkOrgId = resolveClerkOrgIdFromMembershipPayload(payload)
  if (!clerkUserId || !clerkOrgId) {
    return { ok: true, ignored: true, reason: 'missing_user_or_org' }
  }

  const { rows: workspaceRows } = await pool.query(
    `SELECT id, organization_id
     FROM taxgpt.accounting_workspaces
     WHERE clerk_org_id = $1
     LIMIT 1`,
    [clerkOrgId]
  )
  const workspace = workspaceRows[0]
  if (!workspace?.organization_id) {
    return { ok: true, ignored: true, reason: 'workspace_org_not_linked' }
  }

  if (Boolean(options.deleted)) {
    await deactivateOrganizationMemberHierarchy(pool, workspace.organization_id, clerkUserId)
    return {
      ok: true,
      ignored: false,
      deleted: true,
      workspaceId: workspace.id,
      organizationId: workspace.organization_id,
      clerkUserId,
      status: 'inactive'
    }
  }

  const metadata = payload.public_metadata || payload.publicMetadata || {}
  const membership = await finalizeOrganizationEmployeeMembership(pool, {
    organizationId: workspace.organization_id,
    workspaceId: workspace.id,
    clerkUserId,
    inviteEmail: metadata.invite_email || null,
    workspaceRole: mapClerkMembershipRoleToWorkspaceRole(payload),
    invitedBy: metadata.invited_by || clerkUserId
  })

  await pool.query(
    `UPDATE taxgpt.accounting_workspace_members
     SET clerk_org_membership_id = $1,
         updated_at = now()
     WHERE workspace_id = $2::uuid
       AND clerk_user_id = $3`,
    [payload.id || null, workspace.id, clerkUserId]
  )

  return {
    ok: true,
    ignored: false,
    status: 'active',
    ...membership
  }
}

export async function getWorkspacePermissionSnapshot (pool, actorUserId, workspaceId = null, options = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId, {
    expectedClerkOrgId: options.expectedClerkOrgId || null,
    skipClerkOrgSync: options.skipClerkOrgSync !== false,
    relaxedOrgContext: true
  })
  const authz = await getWorkspaceAuthorizationContext(pool, workspace, actorUserId)
  return { workspace, authorization: authz }
}

export async function getAccountForUser (pool, clerkUserId, options = {}) {
  const workspace = await getWorkspaceContext(pool, clerkUserId, null, {
    expectedClerkOrgId: options.expectedClerkOrgId || null,
    skipClerkOrgSync: true,
    relaxedOrgContext: true
  })
  try {
    await assertWorkspaceAssignment(pool, workspace, clerkUserId, { assignedBy: clerkUserId })
  } catch (error) {
    if (!canManageWorkspace(workspace)) throw error
    if (workspace.organization_id) {
      await ensureWorkspaceEmployeeAssignment(
        pool,
        workspace,
        clerkUserId,
        clerkUserId,
        mapWorkspaceRoleToOrganizationMemberRole(workspace.role)
      )
    } else {
      throw error
    }
  }
  const profile = await fetchWorkspaceProfile(pool, workspace.id)
  const authorization = await getWorkspaceAuthorizationContext(pool, workspace, clerkUserId)
  return {
    account: {
      businessType: workspace.workspace_type || 'business',
      profileBusinessType: profile?.business_type || null,
      role: workspace.role || null,
      organizationId: workspace.organization_id || null,
      name: workspace.name || null,
      isPersonal: Boolean(workspace.is_personal),
      profileOnboardingCompletedAt: profile?.onboarding_completed_at || null
    },
    profile,
    authorization
  }
}

export async function assertWorkspaceAssignment (pool, workspace, clerkUserId, options = {}) {
  const { rows: existing } = await pool.query(
    `SELECT id
     FROM taxgpt.workspace_employee_assignments
     WHERE workspace_id = $1::uuid
       AND clerk_user_id = $2
       AND status = 'active'
     LIMIT 1`,
    [workspace.id, clerkUserId]
  )
  if (existing[0]) return

  const { withDeadlockRetry } = await import('../utils/deadlockRetry.js')
  await withDeadlockRetry(async () => {
    await ensureWorkspaceEmployeeAssignment(pool, workspace, clerkUserId, options.assignedBy || clerkUserId, options.assignmentRole || 'member')
    const { rows } = await pool.query(
      `SELECT id
       FROM taxgpt.workspace_employee_assignments
       WHERE workspace_id = $1::uuid
         AND clerk_user_id = $2
         AND status = 'active'
       LIMIT 1`,
      [workspace.id, clerkUserId]
    )
    if (!rows[0]) {
      const error = new Error('Assignment denied: workspace')
      error.code = 'ASSIGNMENT_DENIED_WORKSPACE'
      throw error
    }
  })
}

export async function assertEngagementAssignment (pool, workspace, engagementId, clerkUserId, options = {}) {
  const { rows: existing } = await pool.query(
    `SELECT id
     FROM taxgpt.engagement_employee_assignments
     WHERE engagement_id = $1::uuid
       AND clerk_user_id = $2
       AND status = 'active'
     LIMIT 1`,
    [engagementId, clerkUserId]
  )
  if (existing[0]) return

  const { withDeadlockRetry } = await import('../utils/deadlockRetry.js')
  await withDeadlockRetry(async () => {
    const { rows: engagementRows } = await pool.query(
      `SELECT id, workspace_id
       FROM taxgpt.accounting_engagements
       WHERE id = $1::uuid
       LIMIT 1`,
      [engagementId]
    )
    const engagement = engagementRows[0]
    if (!engagement) {
      const error = new Error('Engagement not found')
      error.code = 'ENGAGEMENT_NOT_FOUND'
      throw error
    }
    if (!engagement.workspace_id) {
      await pool.query(
        `UPDATE taxgpt.accounting_engagements
         SET workspace_id = $1::uuid,
             organization_id = COALESCE(organization_id, $2::uuid),
             updated_at = now()
         WHERE id = $3::uuid
           AND workspace_id IS NULL`,
        [workspace.id, workspace.organization_id, engagementId]
      )
    }
    await pool.query(
      `INSERT INTO taxgpt.engagement_employee_assignments
       (organization_id, workspace_id, engagement_id, clerk_user_id, assignment_role, status, assigned_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'member', 'active', $5, now(), now())
       ON CONFLICT (engagement_id, clerk_user_id)
       DO UPDATE SET status = 'active', updated_at = now()`,
      [workspace.organization_id, workspace.id, engagementId, clerkUserId, options.assignedBy || clerkUserId]
    )
    const { rows } = await pool.query(
      `SELECT id
       FROM taxgpt.engagement_employee_assignments
       WHERE engagement_id = $1::uuid
         AND clerk_user_id = $2
         AND status = 'active'
       LIMIT 1`,
      [engagementId, clerkUserId]
    )
    if (!rows[0]) {
      const error = new Error('Assignment denied: engagement')
      error.code = 'ASSIGNMENT_DENIED_ENGAGEMENT'
      throw error
    }
  })
}

export async function assertWorkingPaperAssignment (pool, workspace, leadSheetId, clerkUserId, options = {}) {
  const { rows: leadRows } = await pool.query(
    `SELECT ls.id, ls.engagement_id
     FROM taxgpt.lead_sheets ls
     WHERE ls.id = $1::uuid
     LIMIT 1`,
    [leadSheetId]
  )
  const leadSheet = leadRows[0]
  if (!leadSheet) {
    const error = new Error('Lead sheet not found')
    error.code = 'WORKING_PAPER_NOT_FOUND'
    throw error
  }
  await assertEngagementAssignment(pool, workspace, leadSheet.engagement_id, clerkUserId, options)
  await pool.query(
    `INSERT INTO taxgpt.working_paper_employee_assignments
     (organization_id, workspace_id, engagement_id, lead_sheet_id, clerk_user_id, assignment_role, status, assigned_by, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, 'member', 'active', $6, now(), now())
     ON CONFLICT (lead_sheet_id, clerk_user_id)
     DO UPDATE SET status = 'active', updated_at = now()`,
    [workspace.organization_id, workspace.id, leadSheet.engagement_id, leadSheet.id, clerkUserId, options.assignedBy || clerkUserId]
  )
}

export async function getOrganizationAdminSnapshot (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  if (workspace.organization_id) {
    await syncOrganizationMemberRolesForWorkspace(pool, workspace.id, workspace.organization_id)
  }
  const organization = await fetchOrganizationById(pool, workspace.organization_id)
  const employees = (await fetchOrganizationMembers(pool, workspace.organization_id))
    .filter((member) => String(member.status || '').toLowerCase() !== 'inactive')
  const enrichedEmployees = await enrichOrganizationEmployees(employees)
  const { rows: workspaceMemberRows } = await pool.query(
    `SELECT clerk_user_id, role
     FROM taxgpt.accounting_workspace_members
     WHERE workspace_id = $1::uuid
       AND status = 'active'`,
    [workspace.id]
  )
  const workspaceRoleByUserId = new Map(
    workspaceMemberRows.map((row) => [String(row.clerk_user_id), String(row.role)])
  )
  const employeesWithWorkspaceRoles = enrichedEmployees.map((employee) => ({
    ...employee,
    workspace_role: workspaceRoleByUserId.get(String(employee.clerk_user_id || '')) || null
  }))
  const { workspaceCounts, engagementCounts, paperCounts } = await fetchOrganizationAssignmentCounts(pool, workspace.organization_id)
  return { workspace, organization, employees: employeesWithWorkspaceRoles, workspaceCounts, engagementCounts, paperCounts }
}

export async function upsertWorkspaceEmployeeAssignment (pool, actorUserId, workspaceId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  const clerkUserId = String(payload.clerkUserId || '').trim()
  if (!clerkUserId) throw new Error('clerkUserId is required')
  const assignmentRole = String(payload.assignmentRole || 'member').trim().toLowerCase()
  await ensureOrganizationMember(pool, workspace.organization_id, clerkUserId, assignmentRole, actorUserId)
  await ensureWorkspaceEmployeeAssignment(pool, workspace, clerkUserId, actorUserId, assignmentRole)
  return { workspaceId: workspace.id, clerkUserId, assignmentRole, status: 'active' }
}

export async function upsertEngagementEmployeeAssignment (pool, actorUserId, engagementId, payload = {}) {
  const clerkUserIds = Array.isArray(payload.clerkUserIds)
    ? payload.clerkUserIds.map((value) => String(value || '').trim()).filter(Boolean)
    : []
  if (clerkUserIds.length > 0) {
    return replaceEngagementEmployeeAssignments(pool, actorUserId, engagementId, payload)
  }
  const clerkUserId = String(payload.clerkUserId || '').trim()
  if (!clerkUserId) throw new Error('clerkUserId is required')
  const workspace = await getWorkspaceContext(pool, actorUserId, payload.workspaceId || null)
  await ensureWorkspaceEmployeeAssignment(pool, workspace, clerkUserId, actorUserId)
  await assertEngagementAssignment(pool, workspace, engagementId, clerkUserId, { assignedBy: actorUserId })
  return { engagementId, clerkUserId, status: 'active' }
}

export async function listEngagementEmployeeAssignments (pool, actorUserId, engagementId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, payload.workspaceId || null)
  const { rows: engagementRows } = await pool.query(
    `SELECT id, workspace_id, organization_id, clerk_user_id
     FROM taxgpt.accounting_engagements
     WHERE id = $1::uuid
     LIMIT 1`,
    [engagementId]
  )
  const engagement = engagementRows[0]
  if (!engagement) throw new Error('Engagement not found')
  if (String(engagement.workspace_id || '') !== String(workspace.id)) {
    throw new Error('Engagement not found in active workspace')
  }
  await assertWorkspacePermissionWithCustomRoles(pool, {
    workspaceId: workspace.id,
    workspaceRole: workspace.role,
    clerkUserId: actorUserId,
    permission: 'engagement.read'
  })

  const { rows } = await pool.query(
    `SELECT engagement_id, clerk_user_id, assignment_role, status, assigned_by, created_at, updated_at
     FROM taxgpt.engagement_employee_assignments
     WHERE engagement_id = $1::uuid
       AND status = 'active'
     ORDER BY created_at ASC`,
    [engagementId]
  )
  const enriched = []
  for (const row of rows) {
    const clerkUserId = String(row.clerk_user_id || '')
    let displayName = clerkUserId
    let email = null
    if (!clerkUserId.startsWith('invite:')) {
      try {
        const client = getClerkBackendClient()
        const user = await client.users.getUser(clerkUserId)
        displayName = buildDisplayNameFromClerkUser(user) || extractPrimaryEmailFromClerkUser(user) || clerkUserId
        email = extractPrimaryEmailFromClerkUser(user)
      } catch {
        displayName = clerkUserId
      }
    }
    enriched.push({
      ...row,
      display_name: displayName,
      email
    })
  }
  return { engagementId, assignments: enriched }
}

export async function replaceEngagementEmployeeAssignments (pool, actorUserId, engagementId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, payload.workspaceId || null)
  await assertWorkspacePermissionWithCustomRoles(pool, {
    workspaceId: workspace.id,
    workspaceRole: workspace.role,
    clerkUserId: actorUserId,
    permission: 'engagement.manage'
  })

  const { rows: engagementRows } = await pool.query(
    `SELECT id, workspace_id
     FROM taxgpt.accounting_engagements
     WHERE id = $1::uuid
       AND clerk_user_id = $2
     LIMIT 1`,
    [engagementId, workspace.owner_user_id]
  )
  const engagement = engagementRows[0]
  if (!engagement || String(engagement.workspace_id || '') !== String(workspace.id)) {
    throw new Error('Engagement not found in active workspace')
  }

  const clerkUserIds = Array.from(new Set(
    (Array.isArray(payload.clerkUserIds) ? payload.clerkUserIds : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  ))
  if (clerkUserIds.length === 0) {
    throw new Error('At least one employee must be assigned to the engagement')
  }

  await pool.query(
    `UPDATE taxgpt.engagement_employee_assignments
     SET status = 'inactive',
         updated_at = now()
     WHERE engagement_id = $1::uuid
       AND status = 'active'`,
    [engagementId]
  )

  for (const clerkUserId of clerkUserIds) {
    await ensureWorkspaceEmployeeAssignment(pool, workspace, clerkUserId, actorUserId)
    await assertEngagementAssignment(pool, workspace, engagementId, clerkUserId, { assignedBy: actorUserId })
  }

  const listed = await listEngagementEmployeeAssignments(pool, actorUserId, engagementId, {
    workspaceId: workspace.id
  })
  return {
    engagementId,
    clerkUserIds,
    assignments: listed.assignments
  }
}

export async function upsertWorkingPaperEmployeeAssignment (pool, actorUserId, leadSheetId, payload = {}) {
  const clerkUserId = String(payload.clerkUserId || '').trim()
  if (!clerkUserId) throw new Error('clerkUserId is required')
  const workspace = await getWorkspaceContext(pool, actorUserId, payload.workspaceId || null)
  await ensureWorkspaceEmployeeAssignment(pool, workspace, clerkUserId, actorUserId)
  await assertWorkingPaperAssignment(pool, workspace, leadSheetId, clerkUserId, { assignedBy: actorUserId })
  return { leadSheetId, clerkUserId, status: 'active' }
}

export async function getWorkspaceOrgMigrationHealth (pool) {
  await ensureWorkspaceTables(pool)
  const { rows: summaryRows } = await pool.query(
    `SELECT
       count(*)::int AS total_workspaces,
       count(*) FILTER (WHERE clerk_org_id IS NOT NULL)::int AS mapped_workspaces,
       count(*) FILTER (WHERE clerk_org_id IS NULL)::int AS unmapped_workspaces,
       count(*) FILTER (WHERE organization_id IS NULL)::int AS unlinked_organizations
     FROM taxgpt.accounting_workspaces`
  )
  const { rows: orgMembershipRows } = await pool.query(
    `SELECT count(*)::int AS c
     FROM taxgpt.accounting_workspace_members wm
     LEFT JOIN taxgpt.accounting_workspaces w ON w.id = wm.workspace_id
     LEFT JOIN taxgpt.accounting_organization_members om
       ON om.organization_id = w.organization_id
      AND om.clerk_user_id = wm.clerk_user_id
     WHERE wm.status = 'active'
       AND w.organization_id IS NOT NULL
       AND om.id IS NULL`
  )
  const { rows: engagementAssignmentRows } = await pool.query(
    `SELECT count(*)::int AS c
     FROM taxgpt.accounting_engagements e
     LEFT JOIN taxgpt.engagement_employee_assignments ea
       ON ea.engagement_id = e.id
      AND ea.status = 'active'
     WHERE e.workspace_id IS NOT NULL
       AND ea.id IS NULL`
  )
  const { rows: paperAssignmentRows } = await pool.query(
    `SELECT count(*)::int AS c
     FROM taxgpt.lead_sheets ls
     LEFT JOIN taxgpt.working_paper_employee_assignments wa
       ON wa.lead_sheet_id = ls.id
      AND wa.status = 'active'
     WHERE wa.id IS NULL`
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
      unmapped_workspaces: 0,
      unlinked_organizations: 0
    },
    gaps: {
      missingOrganizationMemberships: Number(orgMembershipRows[0]?.c || 0),
      missingEngagementAssignments: Number(engagementAssignmentRows[0]?.c || 0),
      missingWorkingPaperAssignments: Number(paperAssignmentRows[0]?.c || 0)
    },
    sampleUnmappedWorkspaces: unmappedRows
  }
}


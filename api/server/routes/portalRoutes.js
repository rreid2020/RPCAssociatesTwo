import { Router } from 'express'
import { getClerkUser, isStaff } from '../middleware/portalAuth.js'
import { buildPortalObjectKey, deleteObject, getObjectStorageConfigDiagnostics, presignGet, presignPut, putObjectBytes } from '../services/portalS3.js'
import {
  archiveEngagement,
  attachExistingDocument,
  bulkTransitionEngagements,
  calculateTrialBalanceVariances,
  createAdjustmentEntry,
  createClient,
  createEngagement,
  createReviewNote,
  createTask,
  deleteEngagement,
  deleteLeadSheet,
  detachDocument,
  ensureStandardMappingGroups,
  generateLeadSheets,
  getClientDetails,
  getEngagementDashboard,
  getEngagementStatusSummary,
  getEngagementWorkflowSummary,
  getLeadSheetDetail,
  listAdjustmentEntries,
  listClients,
  listDocumentsByEngagement,
  listEngagements,
  listIntegrations,
  listLeadSheets,
  listReviewNotes,
  listTasks,
  listTrialBalanceAccounts,
  preparerSignoff,
  reviewerSignoff,
  updateAdjustmentStatus,
  updateClient,
  updateEngagement,
  updateLeadSheetConclusion,
  updateLeadSheetStatus,
  updateReviewNoteStatus,
  updateTask,
  updateTrialBalanceAccountMapping,
  upsertAdjustmentLines,
  upsertIntegrationConnection
} from '../services/workingPapersService.js'
import { parseTrialBalanceFile, previewTrialBalanceImport, saveTrialBalanceImport } from '../services/trialBalanceImportService.js'
import { GoogleSheetsProvider, QuickBooksOnlineProvider, createAccountingProvider } from '../services/accountingProviders.js'
import { AIReviewService } from '../services/aiReviewService.js'
import {
  captureReviewSignoff,
  createEvidenceLinkForLeadSheet,
  createTickmarkForWorkingPaperRow,
  getAiExecutionFoundations,
  getEngagementAuditEvents,
  getEngagementWorkflowQueue,
  getEvidenceLinksForLeadSheet,
  getReviewSignoffTimeline,
  getTickmarksForWorkingPaperRow,
  getWorkingPaperExecutionTree
} from '../services/workingPapersExecutionService.js'
import { exportEngagementWorkbook } from '../services/importExportService.js'
import {
  addWorkspaceMember,
  assertEngagementAssignment,
  assertWorkingPaperAssignment,
  assertWorkspaceAssignment,
  acceptWorkspaceInvite,
  acceptPendingWorkspaceInvites,
  createOrganizationEmployeeInvite,
  createWorkspaceInvite,
  createWorkspace,
  deleteOrganizationMember,
  deleteWorkspace,
  getOrganizationAdminSnapshot,
  getWorkspaceProfile,
  getWorkspaceContext,
  getOnboardingStatusForUser,
  getWorkspaceOrgMigrationHealth,
  getWorkspacePermissionSnapshot,
  listWorkspaceInvites,
  listWorkspaceMembers,
  listEngagementEmployeeAssignments,
  replaceEngagementEmployeeAssignments,
  upsertEngagementEmployeeAssignment,
  upsertWorkingPaperEmployeeAssignment,
  upsertWorkspaceEmployeeAssignment,
  listWorkspacesForUser,
  updateWorkspace,
  upsertWorkspaceProfile,
  updateWorkspaceMember,
  updateOrganizationMember
} from '../services/accountingWorkspaceService.js'
import {
  assertWorkspacePermissionWithCustomRoles,
  assignWorkspaceMemberRole,
  listWorkspaceRoles,
  upsertWorkspaceCustomRole
} from '../services/authz/workspaceRbacService.js'
import {
  buildGoogleSheetsAuthUrl,
  buildQboAuthUrl,
  createSignedIntegrationState,
  exchangeGoogleCodeForTokens,
  exchangeQboCodeForTokens,
  verifySignedIntegrationState
} from '../services/integrationOAuthService.js'
import { assertWorkspaceEntitlement } from '../services/authz/entitlementPolicy.js'

const MAX_UPLOAD_BYTES = parseInt(process.env.PORTAL_MAX_UPLOAD_BYTES || String(100 * 1024 * 1024), 10)

const folderNameRe = /^[^/\\<>:|?"*]+$/u

const HOME_ROOT_NAME = 'My files'

function isDeadlockError (error) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('deadlock detected')
}

async function withDeadlockRetry (operation, retries = 2, waitMs = 40) {
  let attempt = 0
  while (true) {
    try {
      return await operation()
    } catch (error) {
      if (!isDeadlockError(error) || attempt >= retries) throw error
      attempt += 1
      await new Promise((resolve) => setTimeout(resolve, waitMs * attempt))
    }
  }
}

async function recordCanonicalAuditEvent (pool, payload) {
  await pool.query(
    `INSERT INTO taxgpt.audit_events
     (organization_id, workspace_id, engagement_id, lead_sheet_id, working_paper_row_id, event_type, entity_type, entity_id, actor_id, before_value, after_value, metadata, created_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7, $8, $9, $10::jsonb, $11::jsonb, COALESCE($12::jsonb, '{}'::jsonb), now())`,
    [
      payload.organizationId || null,
      payload.workspaceId || null,
      payload.engagementId || null,
      payload.leadSheetId || null,
      payload.workingPaperRowId || null,
      payload.eventType,
      payload.entityType || null,
      payload.entityId || null,
      payload.actorId || null,
      payload.beforeValue ? JSON.stringify(payload.beforeValue) : null,
      payload.afterValue ? JSON.stringify(payload.afterValue) : null,
      payload.metadata ? JSON.stringify(payload.metadata) : null
    ]
  )
}

/**
 * TaxGPT’s `taxgpt.users` table is a mirror of Clerk (optional; used by other features).
 * Portal data uses `clerk_user_id` text on portal_* tables and does not FK to `users.id`.
 * We upsert here so each active portal user has a row for reporting / admin tools.
 */
async function mirrorClerkUserToUsersTable (pool, clerkUserId) {
  try {
    await pool.query(
      `INSERT INTO taxgpt.users (id, clerk_user_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, now(), now())
       ON CONFLICT (clerk_user_id) DO UPDATE SET updated_at = now()`,
      [clerkUserId]
    )
  } catch (e) {
    if (e && e.code === '42P01') {
      return
    }
    if (e && e.code === '42703') {
      try {
        await pool.query(
          `INSERT INTO taxgpt.users (id, clerk_user_id, created_at)
           VALUES (gen_random_uuid(), $1, now())
           ON CONFLICT (clerk_user_id) DO NOTHING`,
          [clerkUserId]
        )
        return
      } catch (e2) {
        if (e2 && e2.code === '42P01') return
        console.warn('mirrorClerkUserToUsersTable (fallback):', e2)
        return
      }
    }
    console.warn('mirrorClerkUserToUsersTable:', e)
  }
}

/**
 * One top-level (parent_id null) “home” folder per user. Creates or consolidates, migrates
 * unfiled (folder_id null) into home. Returns the home row.
 */
export async function ensureUserHomeFolder (pool, userId) {
  const { rows: roots } = await pool.query(
    'SELECT * FROM taxgpt.portal_folders WHERE clerk_user_id = $1 AND parent_id IS NULL ORDER BY created_at ASC',
    [userId]
  )
  let home
  if (!roots.length) {
    try {
      const { rows: inserted } = await pool.query(
        `INSERT INTO taxgpt.portal_folders (clerk_user_id, parent_id, name, created_at)
         VALUES ($1, NULL, $2, now()) RETURNING *`,
        [userId, HOME_ROOT_NAME]
      )
      home = inserted[0]
    } catch (e) {
      // Concurrent first requests can race two INSERTs; the unique (sibling name) index rejects the loser.
      const msg = e && e.message != null ? String(e.message) : ''
      const isUnique = (e && e.code === '23505') || (msg.length > 0 && /unique|duplicate/i.test(msg))
      if (!isUnique) throw e
      const { rows: r2 } = await pool.query(
        'SELECT * FROM taxgpt.portal_folders WHERE clerk_user_id = $1 AND parent_id IS NULL ORDER BY created_at ASC',
        [userId]
      )
      if (!r2[0]) throw e
      home = r2[0]
    }
  } else {
    home = roots[0]
    if (roots.length > 1) {
      for (let i = 1; i < roots.length; i++) {
        try {
          await pool.query(
            'UPDATE taxgpt.portal_folders SET parent_id = $1::uuid WHERE id = $2::uuid AND clerk_user_id = $3',
            [home.id, roots[i].id, userId]
          )
        } catch (e) {
          console.error('reparent extra root folder', e)
        }
      }
    }
  }
  await pool.query(
    'UPDATE taxgpt.portal_client_files SET folder_id = $1::uuid WHERE clerk_user_id = $2 AND folder_id IS NULL',
    [home.id, userId]
  )
  await mirrorClerkUserToUsersTable(pool, userId)
  return home
}

export function createPortalRouter (pool) {
  const r = Router()
  const handleAssignmentError = (res, error, fallbackMessage) => {
    const code = error?.code || ''
    if (String(code).startsWith('ASSIGNMENT_DENIED')) {
      void pool.query(
        `INSERT INTO taxgpt.accounting_audit_log
         (organization_id, clerk_user_id, entity_type, entity_id, action, actor_id, after_value, created_at)
         VALUES (NULL, NULL, 'authorization', $1, 'authz.assignment_denied', NULL, $2::jsonb, now())`,
        [
          String(code),
          JSON.stringify({
            code: String(code),
            message: error instanceof Error ? error.message : String(error)
          })
        ]
      ).catch(() => {})
      res.status(403).json({ error: fallbackMessage, reason: 'assignment' })
      return true
    }
    return false
  }
  const resolveAccountingScope = async (req, res, session) => {
    try {
      const requestedWorkspaceId = req.headers['x-accounting-workspace-id'] || req.query.workspaceId || null
      const workspace = await getWorkspaceContext(pool, session.userId, requestedWorkspaceId, {
        expectedClerkOrgId: session.orgId || null
      })
      if (!workspace.organization_id) {
        res.status(400).json({ error: 'Workspace is not linked to an organization. Please complete organization linking first.' })
        return null
      }
      await assertWorkspaceAssignment(pool, workspace, session.userId, { assignedBy: session.userId })
      return {
        workspace,
        organizationId: workspace.organization_id,
        workspaceUserId: workspace.owner_user_id,
        actorUserId: session.userId
      }
    } catch (e) {
      if (handleAssignmentError(res, e, 'Workspace assignment required')) return null
      res.status(403).json({ error: e instanceof Error ? e.message : 'Workspace access denied' })
      return null
    }
  }
  const hasEntitlement = async (res, workspaceId, key) => {
    try {
      await assertWorkspaceEntitlement({ pool, workspaceId, entitlementKey: key })
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not evaluate workspace entitlements'
      if (message.startsWith('Entitlement denied:')) {
        res.status(402).json({ error: 'Feature requires an upgraded workspace subscription.' })
        return false
      }
      res.status(500).json({ error: message })
      return false
    }
  }
  const requireWorkspacePermission = async (session, workspaceId, permission, res) => {
    try {
      // Explicit workspace routes authorize by membership + RBAC. Do not enforce
      // Clerk org header context here; workspace listing already exposes member workspaces.
      const workspace = await getWorkspaceContext(pool, session.userId, workspaceId)
      await assertWorkspacePermissionWithCustomRoles(pool, {
        workspaceId: workspace.id,
        workspaceRole: workspace.role,
        clerkUserId: session.userId,
        permission
      })
      return workspace
    } catch (e) {
      res.status(403).json({ error: e instanceof Error ? e.message : 'Forbidden' })
      return null
    }
  }
  const requireScopePermission = async (session, scope, permission, res) => {
    try {
      await assertWorkspacePermissionWithCustomRoles(pool, {
        workspaceId: scope.workspace.id,
        workspaceRole: scope.workspace.role,
        clerkUserId: session.userId,
        permission
      })
      return true
    } catch (e) {
      res.status(403).json({ error: e instanceof Error ? e.message : 'Forbidden' })
      return false
    }
  }
  const resolveEngagementScope = async (req, res, session) => {
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return null
    try {
      await assertEngagementAssignment(pool, scope.workspace, req.params.engagementId, session.userId, { assignedBy: scope.actorUserId })
      return scope
    } catch (e) {
      if (handleAssignmentError(res, e, 'Engagement assignment required')) return null
      res.status(403).json({ error: e instanceof Error ? e.message : 'Engagement access denied' })
      return null
    }
  }
  const resolveWorkingPaperScope = async (req, res, session) => {
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return null
    try {
      await assertWorkingPaperAssignment(pool, scope.workspace, req.params.leadSheetId, session.userId, { assignedBy: scope.actorUserId })
      return scope
    } catch (e) {
      if (handleAssignmentError(res, e, 'Working paper assignment required')) return null
      res.status(403).json({ error: e instanceof Error ? e.message : 'Working paper access denied' })
      return null
    }
  }

  r.get('/v1/dashboard', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { userId } = session
    const now = new Date()
    const in90 = new Date(now)
    in90.setDate(in90.getDate() + 90)
    try {
      const openC = await pool.query(
        `SELECT count(*)::int AS c FROM taxgpt.portal_open_items
         WHERE clerk_user_id = $1 AND status = 'open'`,
        [userId]
      )
      const dlC = await pool.query(
        `SELECT count(*)::int AS c FROM taxgpt.portal_deadlines
         WHERE clerk_user_id = $1 AND due_at >= $2 AND due_at <= $3`,
        [userId, now, in90]
      )
      const projC = await pool.query(
        'SELECT count(*)::int AS c FROM taxgpt.portal_checklists WHERE clerk_user_id = $1',
        [userId]
      )
      const { rows: openItems } = await pool.query(
        `SELECT id, title, description, status, due_at, updated_at
         FROM taxgpt.portal_open_items WHERE clerk_user_id = $1
         ORDER BY updated_at DESC LIMIT 8`,
        [userId]
      )
      const { rows: deadlines } = await pool.query(
        `SELECT id, title, due_at, category FROM taxgpt.portal_deadlines
         WHERE clerk_user_id = $1 ORDER BY due_at ASC LIMIT 10`,
        [userId]
      )
      const { rows: recentActivity } = await pool.query(
        `SELECT id, kind, title, body, created_at FROM taxgpt.portal_activity
         WHERE clerk_user_id = $1 ORDER BY created_at DESC LIMIT 15`,
        [userId]
      )
      res.json({
        counts: {
          openItems: openC?.rows[0]?.c ?? 0,
          upcomingDeadlines: dlC?.rows[0]?.c ?? 0,
          activeProjects: projC?.rows[0]?.c ?? 0
        },
        openItems,
        deadlines,
        recentActivity
      })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Dashboard load failed' })
    }
  })

  r.patch('/v1/open-items/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const status = req.body?.status
    if (status !== 'open' && status !== 'done') {
      return res.status(400).json({ error: 'status must be open or done' })
    }
    const { id } = req.params
    const { rowCount } = await pool.query(
      `UPDATE taxgpt.portal_open_items SET status = $1, updated_at = now()
       WHERE id = $2::uuid AND clerk_user_id = $3`,
      [status, id, session.userId]
    )
    if (!rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  })

  r.post('/v1/staff/open-items', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!isStaff(session.userId)) return res.status(403).json({ error: 'Forbidden' })
    const { targetClerkUserId, title, description, dueAt } = req.body || {}
    if (!targetClerkUserId || !title) {
      return res.status(400).json({ error: 'targetClerkUserId and title required' })
    }
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_open_items
       (clerk_user_id, title, description, status, due_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'open', $4, now(), now()) RETURNING *`,
      [targetClerkUserId, title, description || null, dueAt ? new Date(dueAt) : null]
    )
    await pool.query(
      `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, body, created_at)
       VALUES ($1, 'item', $2, $3, now())`,
      [targetClerkUserId, `New task: ${title}`, description || null]
    )
    res.json({ item: rows[0] })
  })

  r.post('/v1/staff/activity', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!isStaff(session.userId)) return res.status(403).json({ error: 'Forbidden' })
    const { targetClerkUserId, kind, title, body } = req.body || {}
    if (!targetClerkUserId || !title) {
      return res.status(400).json({ error: 'targetClerkUserId and title required' })
    }
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_activity
       (clerk_user_id, kind, title, body, created_at)
       VALUES ($1, $2, $3, $4, now()) RETURNING *`,
      [targetClerkUserId, kind && String(kind).length ? String(kind) : 'note', title, body || null]
    )
    res.json({ activity: rows[0] })
  })

  r.post('/v1/staff/deadlines', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!isStaff(session.userId)) return res.status(403).json({ error: 'Forbidden' })
    const { targetClerkUserId, title, dueAt, category } = req.body || {}
    if (!targetClerkUserId || !title || !dueAt) {
      return res.status(400).json({ error: 'targetClerkUserId, title, dueAt required' })
    }
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_deadlines (clerk_user_id, title, due_at, category, created_at)
       VALUES ($1, $2, $3, $4, now()) RETURNING *`,
      [targetClerkUserId, title, new Date(dueAt), category || null]
    )
    res.json({ deadline: rows[0] })
  })

  r.get('/v1/folders/flat', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const home = await ensureUserHomeFolder(pool, session.userId)
      const { rows } = await pool.query(
        'SELECT id, parent_id, name, created_at FROM taxgpt.portal_folders WHERE clerk_user_id = $1 ORDER BY lower(btrim(name))',
        [session.userId]
      )
      const diag = getObjectStorageConfigDiagnostics()
      res.json({
        homeFolder: home,
        folders: rows,
        objectStorageReady: diag.objectStorageReady,
        objectStorageMissing: diag.objectStorageMissing
      })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Could not list folders' })
    }
  })

  r.get('/v1/folders', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const parentParam = req.query.parentId
    if (!parentParam || parentParam === 'root') {
      try {
        const home = await ensureUserHomeFolder(pool, session.userId)
        const { rows } = await pool.query(
          'SELECT * FROM taxgpt.portal_folders WHERE clerk_user_id = $1 AND parent_id = $2::uuid ORDER BY lower(btrim(name))',
          [session.userId, home.id]
        )
        return res.json({ homeFolder: home, folders: rows })
      } catch (e) {
        console.error(e)
        return res.status(500).json({ error: 'Could not list folders' })
      }
    }
    const { rows: parent } = await pool.query(
      'SELECT id FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
      [String(parentParam), session.userId]
    )
    if (!parent[0]) return res.status(404).json({ error: 'Parent folder not found' })
    const { rows } = await pool.query(
      'SELECT * FROM taxgpt.portal_folders WHERE clerk_user_id = $1 AND parent_id = $2::uuid ORDER BY lower(btrim(name))',
      [session.userId, parent[0].id]
    )
    return res.json({ folders: rows })
  })

  r.post('/v1/folders', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const name = (req.body?.name && String(req.body.name).trim()) || ''
    const { parentId } = req.body || {}
    if (name.length < 1) return res.status(400).json({ error: 'name required' })
    if (name.length > 199) return res.status(400).json({ error: 'name too long' })
    if (!folderNameRe.test(name)) {
      return res.status(400).json({ error: 'Folder name cannot include /, \\, or other reserved characters' })
    }
    const home = await ensureUserHomeFolder(pool, session.userId)
    let pId = home.id
    if (parentId && String(parentId) !== 'root') {
      const { rows: pr } = await pool.query(
        'SELECT id FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
        [String(parentId), session.userId]
      )
      if (!pr[0]) return res.status(400).json({ error: 'Parent folder not found' })
      pId = pr[0].id
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO taxgpt.portal_folders (clerk_user_id, parent_id, name, created_at)
         VALUES ($1, $2, $3, now()) RETURNING *`,
        [session.userId, pId, name]
      )
      await pool.query(
        `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, created_at)
         VALUES ($1, 'folder', $2, now())`,
        [session.userId, `Created folder: ${name}`]
      )
      res.json({ folder: rows[0] })
    } catch (e) {
      const msg = e && e.message != null ? String(e.message) : ''
      const isUniqueViolation =
        (e && e.code === '23505') || (msg.length > 0 && /unique|duplicate/i.test(msg))
      if (isUniqueViolation) {
        return res.status(409).json({ error: 'A folder with that name already exists here' })
      }
      console.error('POST /v1/folders', e)
      res.status(500).json({ error: 'Could not create folder' })
    }
  })

  r.delete('/v1/folders/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const home = await ensureUserHomeFolder(pool, session.userId)
    if (String(req.params.id) === String(home.id)) {
      return res.status(400).json({ error: 'The main “My files” folder cannot be deleted' })
    }
    const { rows: folder } = await pool.query(
      'SELECT id, name FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
      [req.params.id, session.userId]
    )
    if (!folder[0]) return res.status(404).json({ error: 'Not found' })
    const { rows: inTree } = await pool.query(
      `WITH RECURSIVE t AS (
         SELECT id FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2
         UNION ALL
         SELECT f.id FROM taxgpt.portal_folders f INNER JOIN t ON f.parent_id = t.id
         WHERE f.clerk_user_id = $2
       ) SELECT id FROM t`,
      [req.params.id, session.userId]
    )
    const treeIds = inTree.map((r) => r.id)
    if (treeIds.length) {
      await pool.query(
        `UPDATE taxgpt.portal_client_files
         SET folder_id = $1::uuid
         WHERE clerk_user_id = $2 AND folder_id = ANY($3::uuid[])`,
        [home.id, session.userId, treeIds]
      )
    }
    await pool.query('DELETE FROM taxgpt.portal_folders WHERE id = $1::uuid', [req.params.id])
    await pool.query(
      `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, created_at)
       VALUES ($1, 'folder', $2, now())`,
      [session.userId, `Removed folder: ${folder[0].name}`]
    )
    res.json({ ok: true })
  })

  r.post('/v1/files/presign-put', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { fileName, contentType } = req.body || {}
    if (!fileName || !contentType) return res.status(400).json({ error: 'fileName, contentType required' })
    const { key, fileId } = buildPortalObjectKey(session.userId, fileName)
    const signed = await presignPut(key, contentType)
    if (!signed) {
      console.warn(
        '[portal files] presign-put: object storage not configured. Set DO_SPACES_ENDPOINT, DO_SPACES_BUCKET, DO_SPACES_KEY, DO_SPACES_SECRET on the API (see api/server/.env.example).'
      )
      return res.status(503).json({
        error: 'Object storage is not configured on the server. Add DigitalOcean Spaces (S3) env vars to the API.',
        code: 'STORAGE_NOT_CONFIGURED'
      })
    }
    res.json({ uploadUrl: signed.url, storageKey: key, fileId })
  })

  /**
   * Fallback upload route: browser sends file bytes to API as base64 JSON, API writes to Spaces,
   * then creates the DB row in one request. This avoids browser->Spaces CORS edge cases.
   */
  r.post('/v1/files/upload-via-api', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { fileName, contentType, dataBase64, folderId } = req.body || {}
    if (!fileName || !dataBase64) {
      return res.status(400).json({ error: 'fileName and dataBase64 are required' })
    }
    let bytes
    try {
      bytes = Buffer.from(String(dataBase64), 'base64')
    } catch {
      return res.status(400).json({ error: 'Invalid base64 file data' })
    }
    if (!bytes || !bytes.length) {
      return res.status(400).json({ error: 'No file data received' })
    }
    if (bytes.length > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ error: `File exceeds maximum size of ${MAX_UPLOAD_BYTES} bytes` })
    }
    const { key } = buildPortalObjectKey(session.userId, fileName)
    try {
      const uploaded = await putObjectBytes(key, contentType || 'application/octet-stream', bytes)
      if (!uploaded) {
        return res.status(503).json({ error: 'Storage not configured', code: 'STORAGE_NOT_CONFIGURED' })
      }
    } catch (e) {
      console.error('POST /v1/files/upload-via-api (storage)', e)
      return res.status(502).json({ error: 'Could not upload file to storage' })
    }

    const home = await ensureUserHomeFolder(pool, session.userId)
    let folderFid = home.id
    if (folderId && String(folderId) !== 'root' && String(folderId) !== String(home.id) && String(folderId).length) {
      const { rows: fr } = await pool.query(
        'SELECT id FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
        [String(folderId), session.userId]
      )
      if (!fr[0]) return res.status(400).json({ error: 'Invalid folder' })
      folderFid = fr[0].id
    }

    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_client_files
       (clerk_user_id, storage_key, file_name, mime, size_bytes, created_at, folder_id)
       VALUES ($1, $2, $3, $4, $5, now(), $6) RETURNING *`,
      [session.userId, key, fileName, contentType || null, bytes.length, folderFid]
    )
    await pool.query(
      `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, created_at)
       VALUES ($1, 'file', $2, now())`,
      [session.userId, `Uploaded: ${fileName}`]
    )
    res.json({ file: rows[0], usedApiUploadFallback: true })
  })

  r.post('/v1/files/complete', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { storageKey, fileName, mime, sizeBytes, folderId } = req.body || {}
    if (!storageKey || !fileName) return res.status(400).json({ error: 'storageKey, fileName required' })
    if (!storageKey.startsWith(`portal/${session.userId}/`)) {
      return res.status(400).json({ error: 'Invalid key' })
    }
    if (sizeBytes != null && Number.isFinite(sizeBytes) && sizeBytes > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ error: `File exceeds maximum size of ${MAX_UPLOAD_BYTES} bytes` })
    }
    const home = await ensureUserHomeFolder(pool, session.userId)
    let folderFid = home.id
    if (folderId && String(folderId) !== 'root' && String(folderId) !== String(home.id) && String(folderId).length) {
      const { rows: fr } = await pool.query(
        'SELECT id FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
        [String(folderId), session.userId]
      )
      if (!fr[0]) return res.status(400).json({ error: 'Invalid folder' })
      folderFid = fr[0].id
    }
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_client_files
       (clerk_user_id, storage_key, file_name, mime, size_bytes, created_at, folder_id)
       VALUES ($1, $2, $3, $4, $5, now(), $6) RETURNING *`,
      [session.userId, storageKey, fileName, mime || null, sizeBytes ?? null, folderFid]
    )
    await pool.query(
      `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, created_at)
       VALUES ($1, 'file', $2, now())`,
      [session.userId, `Uploaded: ${fileName}`]
    )
    res.json({ file: rows[0] })
  })

  r.get('/v1/files', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const folderId = req.query.folderId
    if (folderId === undefined) {
      const { rows } = await pool.query(
        'SELECT * FROM taxgpt.portal_client_files WHERE clerk_user_id = $1 ORDER BY created_at DESC',
        [session.userId]
      )
      return res.json({ files: rows })
    }
    if (folderId === '' || folderId === 'root') {
      const home = await ensureUserHomeFolder(pool, session.userId)
      const { rows } = await pool.query(
        'SELECT * FROM taxgpt.portal_client_files WHERE clerk_user_id = $1 AND folder_id = $2::uuid ORDER BY created_at DESC',
        [session.userId, home.id]
      )
      return res.json({ homeFolder: home, files: rows })
    }
    const { rows: fold } = await pool.query(
      'SELECT * FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
      [String(folderId), session.userId]
    )
    if (!fold[0]) return res.status(404).json({ error: 'Folder not found' })
    const { rows } = await pool.query(
      'SELECT * FROM taxgpt.portal_client_files WHERE clerk_user_id = $1 AND folder_id = $2::uuid ORDER BY created_at DESC',
      [session.userId, String(folderId)]
    )
    return res.json({ files: rows })
  })

  r.patch('/v1/files/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const body = req.body || {}
    const hasFolder = Object.prototype.hasOwnProperty.call(body, 'folderId')
    const hasName = Object.prototype.hasOwnProperty.call(body, 'fileName')
    if (!hasFolder && !hasName) {
      return res.status(400).json({ error: 'Provide folderId and/or fileName' })
    }
    const { rows: existing } = await pool.query(
      'SELECT * FROM taxgpt.portal_client_files WHERE id = $1::uuid AND clerk_user_id = $2',
      [req.params.id, session.userId]
    )
    if (!existing[0]) return res.status(404).json({ error: 'Not found' })
    const home = hasFolder ? await ensureUserHomeFolder(pool, session.userId) : null
    let targetFolder = existing[0].folder_id
    if (hasFolder) {
      const { folderId } = body
      if (folderId == null || String(folderId) === 'root' || !String(folderId).length) {
        targetFolder = home.id
      } else {
        if (String(folderId) === String(home.id)) {
          targetFolder = home.id
        } else {
          const { rows } = await pool.query(
            'SELECT id FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
            [String(folderId), session.userId]
          )
          if (!rows[0]) return res.status(400).json({ error: 'Invalid folder' })
          targetFolder = rows[0].id
        }
      }
    }
    let newName = existing[0].file_name
    if (hasName) {
      newName = String(body.fileName ?? '').trim()
      if (newName.length < 1) return res.status(400).json({ error: 'fileName must not be empty' })
      if (newName.length > 500) return res.status(400).json({ error: 'fileName too long' })
    }
    if (!hasFolder) {
      const { rowCount, rows: out } = await pool.query(
        `UPDATE taxgpt.portal_client_files SET file_name = $1
         WHERE id = $2::uuid AND clerk_user_id = $3 RETURNING *`,
        [newName, req.params.id, session.userId]
      )
      if (!rowCount) return res.status(404).json({ error: 'Not found' })
      return res.json({ file: out[0] })
    }
    if (!hasName) {
      const { rowCount, rows: out } = await pool.query(
        `UPDATE taxgpt.portal_client_files SET folder_id = $1::uuid
         WHERE id = $2::uuid AND clerk_user_id = $3 RETURNING *`,
        [targetFolder, req.params.id, session.userId]
      )
      if (!rowCount) return res.status(404).json({ error: 'Not found' })
      return res.json({ file: out[0] })
    }
    const { rowCount, rows: out } = await pool.query(
      `UPDATE taxgpt.portal_client_files SET folder_id = $1::uuid, file_name = $2
       WHERE id = $3::uuid AND clerk_user_id = $4 RETURNING *`,
      [targetFolder, newName, req.params.id, session.userId]
    )
    if (!rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ file: out[0] })
  })

  r.get('/v1/files/:id/presign-get', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { rows } = await pool.query(
      'SELECT * FROM taxgpt.portal_client_files WHERE id = $1::uuid AND clerk_user_id = $2',
      [req.params.id, session.userId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    const url = await presignGet(rows[0].storage_key)
    if (!url) return res.status(503).json({ error: 'Storage not configured' })
    res.json({ url })
  })

  r.delete('/v1/files/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { rows } = await pool.query(
      'SELECT * FROM taxgpt.portal_client_files WHERE id = $1::uuid AND clerk_user_id = $2',
      [req.params.id, session.userId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    const { storage_key: storageKey, file_name: fileName } = rows[0]
    if (storageKey) {
      try {
        await deleteObject(storageKey)
      } catch (e) {
        console.error('portal S3 deleteObject', e)
        return res.status(502).json({ error: 'Could not delete file from storage' })
      }
    }
    await pool.query('DELETE FROM taxgpt.portal_client_files WHERE id = $1::uuid AND clerk_user_id = $2', [
      req.params.id,
      session.userId
    ])
    await pool.query(
      `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, created_at)
       VALUES ($1, 'file', $2, now())`,
      [session.userId, `Removed: ${fileName}`]
    )
    res.json({ ok: true })
  })

  r.get('/v1/checklists', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { rows: lists } = await pool.query(
      'SELECT * FROM taxgpt.portal_checklists WHERE clerk_user_id = $1',
      [session.userId]
    )
    const out = []
    for (const c of lists) {
      const { rows: items } = await pool.query(
        'SELECT * FROM taxgpt.portal_checklist_items WHERE checklist_id = $1::uuid ORDER BY sort_order, id',
        [c.id]
      )
      out.push({ ...c, items })
    }
    res.json({ checklists: out })
  })

  r.post('/v1/checklists', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { name, items } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name required' })
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_checklists (clerk_user_id, name, created_at, updated_at)
       VALUES ($1, $2, now(), now()) RETURNING *`,
      [session.userId, name]
    )
    const list = rows[0]
    if (Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        await pool.query(
          `INSERT INTO taxgpt.portal_checklist_items (checklist_id, label, done, sort_order, updated_at)
           VALUES ($1::uuid, $2, false, $3, now())`,
          [list.id, String(items[i]), i]
        )
      }
    }
    res.json({ checklist: list })
  })

  r.patch('/v1/checklists/items/:itemId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const done = req.body?.done
    if (typeof done !== 'boolean') return res.status(400).json({ error: 'done boolean required' })
    const { rows: items } = await pool.query('SELECT * FROM taxgpt.portal_checklist_items WHERE id = $1::uuid', [req.params.itemId])
    if (!items[0]) return res.status(404).json({ error: 'Not found' })
    const { rows: parents } = await pool.query('SELECT * FROM taxgpt.portal_checklists WHERE id = $1::uuid', [items[0].checklist_id])
    if (!parents[0] || parents[0].clerk_user_id !== session.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    await pool.query(
      'UPDATE taxgpt.portal_checklist_items SET done = $1, updated_at = now() WHERE id = $2::uuid',
      [done, req.params.itemId]
    )
    res.json({ ok: true })
  })

  r.get('/v1/integrations', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { rows } = await pool.query(
      'SELECT * FROM taxgpt.portal_integrations WHERE clerk_user_id = $1',
      [session.userId]
    )
    res.json({
      connections: rows,
      availableProviders: [
        { id: 'quickbooks', name: 'QuickBooks Online', status: 'not_connected' },
        { id: 'xero', name: 'Xero', status: 'not_connected' },
        { id: 'bank', name: 'Bank feed (read-only)', status: 'not_connected' }
      ]
    })
  })

  r.post('/v1/integrations/request', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { provider, message } = req.body || {}
    if (!provider) return res.status(400).json({ error: 'provider required' })
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_integrations
       (clerk_user_id, provider, status, metadata, created_at, updated_at)
       VALUES ($1, $2, 'requested', $3, now(), now()) RETURNING *`,
      [session.userId, provider, JSON.stringify({ message: message || null })]
    )
    res.json({
      ok: true,
      note: 'Our team will follow up to complete this integration.',
      integration: rows[0]
    })
  })

  r.get('/v1/accounting/workspaces', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const workspaces = await listWorkspacesForUser(pool, session.userId)
      res.json({ workspaces })
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Could not load workspaces' })
    }
  })

  r.get('/v1/accounting/onboarding-status', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const onboarding = await withDeadlockRetry(async () => await getOnboardingStatusForUser(pool, session.userId))
      res.json({ onboarding })
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Could not load onboarding status' })
    }
  })

  r.get('/v1/accounting/workspaces/migration-health', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!isStaff(session.userId)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    try {
      const health = await getWorkspaceOrgMigrationHealth(pool)
      res.json(health)
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Could not load migration health' })
    }
  })

  r.post('/v1/accounting/workspaces', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const workspace = await createWorkspace(pool, session.userId, req.body || {})
      res.json({ workspace })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create workspace' })
    }
  })

  r.patch('/v1/accounting/workspaces/:workspaceId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.manage', res)
    if (!authorized) return
    try {
      const workspace = await updateWorkspace(pool, session.userId, req.params.workspaceId, req.body || {})
      res.json({ workspace })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update workspace' })
    }
  })

  r.delete('/v1/accounting/workspaces/:workspaceId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.manage', res)
    if (!authorized) return
    try {
      const ok = await deleteWorkspace(pool, session.userId, req.params.workspaceId)
      res.json({ ok })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not delete workspace' })
    }
  })

  r.get('/v1/accounting/workspaces/:workspaceId/profile', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.read', res)
    if (!authorized) return
    try {
      const data = await withDeadlockRetry(async () => await getWorkspaceProfile(pool, session.userId, req.params.workspaceId))
      res.json(data)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not load workspace profile' })
    }
  })

  r.put('/v1/accounting/workspaces/:workspaceId/profile', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.manage', res)
    if (!authorized) return
    try {
      const data = await upsertWorkspaceProfile(pool, session.userId, req.params.workspaceId, req.body || {})
      res.json(data)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not save workspace profile' })
    }
  })

  r.get('/v1/accounting/workspaces/:workspaceId/members', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.read', res)
    if (!authorized) return
    try {
      const data = await listWorkspaceMembers(pool, session.userId, req.params.workspaceId)
      res.json(data)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not load workspace members' })
    }
  })

  r.post('/v1/accounting/workspaces/:workspaceId/members', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.invite', res)
    if (!authorized) return
    try {
      const member = await addWorkspaceMember(pool, session.userId, req.params.workspaceId, req.body || {})
      res.json({ member })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not add workspace member' })
    }
  })

  r.patch('/v1/accounting/workspaces/:workspaceId/members/:memberUserId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.manage', res)
    if (!authorized) return
    try {
      const member = await updateWorkspaceMember(
        pool,
        session.userId,
        req.params.workspaceId,
        req.params.memberUserId,
        req.body || {}
      )
      res.json({ member })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update workspace member' })
    }
  })

  r.get('/v1/accounting/workspaces/:workspaceId/permissions', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const data = await getWorkspacePermissionSnapshot(pool, session.userId, req.params.workspaceId)
      res.json(data)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not load workspace permissions' })
    }
  })

  r.get('/v1/accounting/workspaces/:workspaceId/organization', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.manage', res)
    if (!authorized) return
    try {
      const snapshot = await getOrganizationAdminSnapshot(pool, session.userId, req.params.workspaceId)
      res.json(snapshot)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not load organization snapshot' })
    }
  })

  r.post('/v1/accounting/workspaces/:workspaceId/organization/invites', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.invite', res)
    if (!authorized) return
    try {
      const invite = await createOrganizationEmployeeInvite(pool, session.userId, req.params.workspaceId, req.body || {})
      res.json({ invite })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create organization employee invite' })
    }
  })

  r.patch('/v1/accounting/workspaces/:workspaceId/organization/members/:memberUserId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.manage', res)
    if (!authorized) return
    try {
      const member = await updateOrganizationMember(
        pool,
        session.userId,
        req.params.workspaceId,
        req.params.memberUserId,
        req.body || {}
      )
      res.json({ member })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update organization member' })
    }
  })

  r.delete('/v1/accounting/workspaces/:workspaceId/organization/members/:memberUserId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.manage', res)
    if (!authorized) return
    try {
      const member = await deleteOrganizationMember(pool, session.userId, req.params.workspaceId, req.params.memberUserId)
      res.json({ member })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not remove organization member' })
    }
  })

  r.put('/v1/accounting/workspaces/:workspaceId/assignments/workspace', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.manage', res)
    if (!authorized) return
    try {
      const assignment = await upsertWorkspaceEmployeeAssignment(pool, session.userId, req.params.workspaceId, req.body || {})
      res.json({ assignment })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update workspace assignment' })
    }
  })

  r.get('/v1/accounting/engagements/:engagementId/assignments', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    try {
      const result = await listEngagementEmployeeAssignments(pool, session.userId, req.params.engagementId, {
        workspaceId: scope.workspace.id
      })
      res.json(result)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not load engagement assignments' })
    }
  })

  r.put('/v1/accounting/engagements/:engagementId/assignments', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    try {
      const assignment = await upsertEngagementEmployeeAssignment(pool, session.userId, req.params.engagementId, {
        ...(req.body || {}),
        workspaceId: scope.workspace.id
      })
      res.json({ assignment })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update engagement assignment' })
    }
  })

  r.put('/v1/accounting/lead-sheets/:leadSheetId/assignments', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const assignment = await upsertWorkingPaperEmployeeAssignment(pool, session.userId, req.params.leadSheetId, req.body || {})
      res.json({ assignment })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update working paper assignment' })
    }
  })

  r.get('/v1/accounting/workspaces/:workspaceId/roles', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const scope = await resolveAccountingScope(req, res, session)
      if (!scope) return
      if (!(scope.workspace.role === 'owner' || scope.workspace.role === 'admin')) {
        return res.status(403).json({ error: 'Only owner/admin can view role configuration' })
      }
      const roles = await listWorkspaceRoles(pool, req.params.workspaceId)
      res.json({ workspace: scope.workspace, roles })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not load workspace roles' })
    }
  })

  r.put('/v1/accounting/workspaces/:workspaceId/roles/:roleName', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const scope = await resolveAccountingScope(req, res, session)
      if (!scope) return
      if (!(scope.workspace.role === 'owner' || scope.workspace.role === 'admin')) {
        return res.status(403).json({ error: 'Only owner/admin can manage role configuration' })
      }
      const role = await upsertWorkspaceCustomRole(pool, req.params.workspaceId, session.userId, {
        roleName: req.params.roleName,
        sourceRole: req.body?.sourceRole,
        displayName: req.body?.displayName,
        permissions: req.body?.permissions || []
      })
      await pool.query(
        `INSERT INTO taxgpt.accounting_audit_log
         (organization_id, clerk_user_id, entity_type, entity_id, action, actor_id, after_value, created_at)
         VALUES ($1::uuid, $2, 'workspace_role', $3, 'workspace.role_upserted', $2, $4::jsonb, now())`,
        [req.params.workspaceId, session.userId, role.roleName, JSON.stringify(role)]
      )
      res.json({ role })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not save workspace role' })
    }
  })

  r.post('/v1/accounting/workspaces/:workspaceId/members/:memberUserId/roles/:roleName', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const scope = await resolveAccountingScope(req, res, session)
      if (!scope) return
      if (!(scope.workspace.role === 'owner' || scope.workspace.role === 'admin')) {
        return res.status(403).json({ error: 'Only owner/admin can assign workspace roles' })
      }
      const assignment = await assignWorkspaceMemberRole(pool, req.params.workspaceId, session.userId, req.params.memberUserId, req.params.roleName)
      await pool.query(
        `INSERT INTO taxgpt.accounting_audit_log
         (organization_id, clerk_user_id, entity_type, entity_id, action, actor_id, after_value, created_at)
         VALUES ($1::uuid, $2, 'workspace_member_role', $3, 'workspace.member_role_assigned', $2, $4::jsonb, now())`,
        [req.params.workspaceId, session.userId, `${req.params.memberUserId}:${req.params.roleName}`, JSON.stringify(assignment)]
      )
      res.json({ assignment })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not assign workspace role' })
    }
  })

  r.get('/v1/accounting/workspaces/:workspaceId/invites', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.manage', res)
    if (!authorized) return
    try {
      const data = await listWorkspaceInvites(pool, session.userId, req.params.workspaceId)
      res.json(data)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not load workspace invites' })
    }
  })

  r.post('/v1/accounting/workspaces/:workspaceId/invites', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const authorized = await requireWorkspacePermission(session, req.params.workspaceId, 'workspace.invite', res)
    if (!authorized) return
    try {
      const invite = await createWorkspaceInvite(pool, session.userId, req.params.workspaceId, req.body || {})
      res.json({ invite })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create workspace invite' })
    }
  })

  r.post('/v1/accounting/invites/accept-pending', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const accepted = await acceptPendingWorkspaceInvites(pool, session.userId, session.email)
      res.json(accepted)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not accept pending invites' })
    }
  })

  r.post('/v1/accounting/invites/:inviteToken/accept', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const accepted = await acceptWorkspaceInvite(pool, session.userId, session.email, req.params.inviteToken)
      res.json(accepted)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not accept invite' })
    }
  })

  r.get('/v1/accounting/clients', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    try {
      const clients = await listClients(pool, scope.workspaceUserId)
      res.json({ clients })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Could not load clients' })
    }
  })

  r.post('/v1/accounting/clients', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    try {
      const client = await createClient(pool, scope.workspaceUserId, scope.actorUserId, req.body || {})
      res.json({ client })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create client' })
    }
  })

  r.get('/v1/accounting/clients/:clientId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    const client = await getClientDetails(pool, scope.workspaceUserId, req.params.clientId)
    if (!client) return res.status(404).json({ error: 'Client not found' })
    res.json({ client })
  })

  r.patch('/v1/accounting/clients/:clientId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    try {
      const client = await updateClient(pool, scope.workspaceUserId, scope.actorUserId, req.params.clientId, req.body || {})
      if (!client) return res.status(404).json({ error: 'Client not found' })
      res.json({ client })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update client' })
    }
  })

  r.get('/v1/accounting/engagements', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await hasEntitlement(res, scope.workspace.id, 'workingPapers'))) return
    try {
      const engagements = await listEngagements(pool, scope.workspaceUserId, {
        status: req.query.status || null,
        clientId: req.query.clientId || null,
        engagementType: req.query.engagementType || null,
        reviewFlowStatus: req.query.reviewFlowStatus || null,
        approvalReady: req.query.approvalReady === 'true' ? true : (req.query.approvalReady === 'false' ? false : null),
        search: req.query.search || null,
        workspaceId: scope.workspace.id
      })
      res.json({ engagements })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Could not load engagements' })
    }
  })

  r.post('/v1/accounting/engagements', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await hasEntitlement(res, scope.workspace.id, 'workingPapers'))) return
    try {
      const engagement = await createEngagement(pool, scope.workspaceUserId, scope.actorUserId, {
        ...(req.body || {}),
        workspaceId: scope.workspace.id,
        organizationId: scope.organizationId
      })
      const clerkUserIds = Array.isArray(req.body?.clerkUserIds)
        ? req.body.clerkUserIds
        : (req.body?.clerkUserId ? [req.body.clerkUserId] : [scope.actorUserId])
      await replaceEngagementEmployeeAssignments(pool, scope.actorUserId, engagement.id, {
        workspaceId: scope.workspace.id,
        clerkUserIds
      })
      res.json({ engagement })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create engagement' })
    }
  })

  r.patch('/v1/accounting/engagements/:engagementId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    try {
      const engagement = await updateEngagement(pool, scope.workspaceUserId, scope.actorUserId, req.params.engagementId, req.body || {})
      if (!engagement) return res.status(404).json({ error: 'Engagement not found' })
      res.json({ engagement })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update engagement' })
    }
  })

  r.post('/v1/accounting/engagements/bulk-transition', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await hasEntitlement(res, scope.workspace.id, 'workingPapers'))) return
    try {
      const result = await bulkTransitionEngagements(
        pool,
        scope.workspaceUserId,
        scope.actorUserId,
        scope.workspace.id,
        req.body?.engagementIds,
        req.body?.reviewFlowStatus
      )
      res.json(result)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not run bulk transition' })
    }
  })

  r.post('/v1/accounting/engagements/:engagementId/archive', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    const canArchive = isStaff(session.userId) || scope.workspace.role === 'owner' || scope.workspace.role === 'admin'
    if (!canArchive) return res.status(403).json({ error: 'Forbidden' })
    const engagement = await archiveEngagement(pool, scope.workspaceUserId, scope.actorUserId, req.params.engagementId)
    if (!engagement) return res.status(404).json({ error: 'Engagement not found' })
    res.json({ engagement })
  })

  r.delete('/v1/accounting/engagements/:engagementId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    try {
      const ok = await deleteEngagement(pool, scope.workspaceUserId, scope.actorUserId, req.params.engagementId)
      if (!ok) return res.status(404).json({ error: 'Engagement not found' })
      res.json({ ok: true })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not delete engagement' })
    }
  })

  r.get('/v1/accounting/engagements/status-summary', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    const summary = await getEngagementStatusSummary(pool, scope.workspaceUserId)
    res.json({ summary })
  })

  r.get('/v1/accounting/engagements/workflow-summary', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    const summary = await getEngagementWorkflowSummary(pool, scope.workspaceUserId, scope.workspace.id)
    res.json({ summary })
  })

  r.get('/v1/accounting/engagements/:engagementId/working-paper-tree', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    const tree = await getWorkingPaperExecutionTree(pool, scope.workspaceUserId, req.params.engagementId)
    if (!tree) return res.status(404).json({ error: 'Engagement not found' })
    res.json(tree)
  })

  r.get('/v1/accounting/engagements/:engagementId/workflow-queue', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    const queue = await getEngagementWorkflowQueue(pool, scope.workspaceUserId, req.params.engagementId)
    if (!queue) return res.status(404).json({ error: 'Engagement not found' })
    res.json(queue)
  })

  r.get('/v1/accounting/engagements/:engagementId/audit-events', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    const events = await getEngagementAuditEvents(pool, scope.workspaceUserId, req.params.engagementId)
    if (!events) return res.status(404).json({ error: 'Engagement not found' })
    res.json({ events })
  })

  r.get('/v1/accounting/engagements/:engagementId/review-signoffs', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    const signoffs = await getReviewSignoffTimeline(pool, scope.workspaceUserId, req.params.engagementId)
    if (!signoffs) return res.status(404).json({ error: 'Engagement not found' })
    res.json({ signoffs })
  })

  r.post('/v1/accounting/engagements/:engagementId/review-signoffs', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'signoff.perform', res))) return
    const signoff = await captureReviewSignoff(pool, scope.workspaceUserId, scope.actorUserId, {
      engagementId: req.params.engagementId,
      leadSheetId: req.body?.leadSheetId || null,
      signoffType: req.body?.signoffType || 'reviewer',
      signoffState: req.body?.signoffState || 'signed',
      metadata: req.body?.metadata || {}
    })
    if (!signoff) return res.status(404).json({ error: 'Engagement not found' })
    res.json({ signoff })
  })

  r.get('/v1/accounting/engagements/:engagementId/ai-foundations', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.read', res))) return
    const aiFoundations = await getAiExecutionFoundations(pool, scope.workspaceUserId, req.params.engagementId)
    if (!aiFoundations) return res.status(404).json({ error: 'Engagement not found' })
    res.json(aiFoundations)
  })

  r.get('/v1/accounting/engagements/:engagementId/dashboard', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'engagement.read', res))) return
    const dashboard = await getEngagementDashboard(pool, scope.workspaceUserId, req.params.engagementId)
    if (!dashboard) return res.status(404).json({ error: 'Engagement not found' })
    res.json(dashboard)
  })

  r.get('/v1/accounting/engagements/:engagementId/export-workbook', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.read', res))) return
    try {
      const workbook = await exportEngagementWorkbook(pool, scope, req.params.engagementId)
      if (!workbook) return res.status(404).json({ error: 'Engagement not found' })
      await recordCanonicalAuditEvent(pool, {
        organizationId: scope.workspace.organizationId,
        workspaceId: scope.workspace.id,
        engagementId: req.params.engagementId,
        eventType: 'engagement.exported',
        entityType: 'engagement',
        entityId: req.params.engagementId,
        actorId: scope.actorUserId,
        afterValue: { fileName: workbook.fileName, mimeType: workbook.mimeType },
        metadata: { route: 'export-workbook' }
      })
      res.json(workbook)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not export workbook' })
    }
  })

  r.get('/v1/accounting/engagements/:engagementId/snapshots', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'engagement.read', res))) return
    const { rows } = await pool.query(
      `SELECT id, snapshot_label, snapshot_type, source_state, created_by, created_at
       FROM taxgpt.engagement_snapshots
       WHERE engagement_id = $1::uuid
         AND COALESCE(workspace_id::text, '') = COALESCE($2::text, '')
         AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [req.params.engagementId, scope.workspace.id]
    )
    res.json({ snapshots: rows })
  })

  r.post('/v1/accounting/engagements/:engagementId/snapshots', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'engagement.manage', res))) return
    const snapshotLabel = String(req.body?.snapshotLabel || 'Manual Snapshot').trim().slice(0, 120)
    const snapshotType = String(req.body?.snapshotType || 'manual').trim().slice(0, 24)
    const sourceState = String(req.body?.sourceState || scope.engagement?.review_flow_status || '').trim() || null
    const { rows: engagementRows } = await pool.query(
      `SELECT id, name, status, review_flow_status, deliverables, due_date, assigned_preparer_id, assigned_reviewer_id, materiality_amount, reporting_currency
       FROM taxgpt.accounting_engagements
       WHERE id = $1::uuid
         AND clerk_user_id = $2
       LIMIT 1`,
      [req.params.engagementId, scope.workspaceUserId]
    )
    const engagement = engagementRows[0]
    if (!engagement) return res.status(404).json({ error: 'Engagement not found' })
    const { rows: leadSheetRows } = await pool.query(
      `SELECT id, section_code, section_name, status, risk_level, open_note_count, document_count
       FROM taxgpt.lead_sheets
       WHERE engagement_id = $1::uuid
       ORDER BY section_code ASC`,
      [req.params.engagementId]
    )
    const { rows: adjustmentRows } = await pool.query(
      `SELECT id, entry_number, status, created_at
       FROM taxgpt.adjustment_entries
       WHERE engagement_id = $1::uuid
       ORDER BY created_at ASC`,
      [req.params.engagementId]
    )
    const snapshotPayload = {
      engagement,
      leadSheets: leadSheetRows,
      adjustments: adjustmentRows
    }
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.engagement_snapshots
       (organization_id, workspace_id, engagement_id, snapshot_label, snapshot_type, snapshot_payload, source_state, created_by, updated_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::jsonb, $7, $8, $8, now(), now())
       RETURNING id, snapshot_label, snapshot_type, source_state, created_by, created_at`,
      [
        scope.workspace.organizationId || null,
        scope.workspace.id || null,
        req.params.engagementId,
        snapshotLabel || 'Manual Snapshot',
        snapshotType || 'manual',
        JSON.stringify(snapshotPayload),
        sourceState,
        scope.actorUserId
      ]
    )
    await recordCanonicalAuditEvent(pool, {
      organizationId: scope.workspace.organizationId,
      workspaceId: scope.workspace.id,
      engagementId: req.params.engagementId,
      eventType: 'engagement.snapshot_created',
      entityType: 'engagement_snapshot',
      entityId: rows[0]?.id,
      actorId: scope.actorUserId,
      afterValue: rows[0],
      metadata: { snapshotType }
    })
    res.json({ snapshot: rows[0] })
  })

  r.get('/v1/accounting/engagements/:engagementId/trial-balance/accounts', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.read', res))) return
    const accounts = await listTrialBalanceAccounts(pool, scope.workspaceUserId, req.params.engagementId)
    if (!accounts) return res.status(404).json({ error: 'Engagement not found' })
    res.json({ accounts })
  })

  r.post('/v1/accounting/engagements/:engagementId/trial-balance/preview', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const scope = await resolveEngagementScope(req, res, session)
      if (!scope) return
      const parsed = parseTrialBalanceFile({
        fileName: req.body?.fileName,
        base64Content: req.body?.base64Content
      })
      const preview = previewTrialBalanceImport({
        rows: parsed.rows,
        columns: parsed.columns,
        mapping: req.body?.mapping || null,
        materialityAmount: req.body?.materialityAmount || null,
        thresholdPercent: req.body?.thresholdPercent || 20
      })
      res.json({
        fileType: parsed.fileType,
        ...preview
      })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not preview trial balance' })
    }
  })

  r.post('/v1/accounting/engagements/:engagementId/trial-balance/import', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    try {
      const result = await saveTrialBalanceImport(pool, scope.workspaceUserId, scope.actorUserId, req.params.engagementId, req.body || {})
      if (!result) return res.status(404).json({ error: 'Engagement not found' })
      res.json(result)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not import trial balance' })
    }
  })

  r.patch('/v1/accounting/trial-balance/accounts/:accountId/mapping', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.manage', res))) return
    try {
      const account = await updateTrialBalanceAccountMapping(pool, scope.workspaceUserId, scope.actorUserId, req.params.accountId, req.body || {})
      if (!account) return res.status(404).json({ error: 'Account not found' })
      res.json({ account })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update mapping' })
    }
  })

  r.post('/v1/accounting/engagements/:engagementId/trial-balance/recalculate-variances', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    const result = await calculateTrialBalanceVariances(
      pool,
      scope.workspaceUserId,
      scope.actorUserId,
      req.params.engagementId,
      req.body?.thresholdPercent || 20
    )
    if (!result) return res.status(404).json({ error: 'Engagement not found' })
    res.json(result)
  })

  r.post('/v1/accounting/engagements/:engagementId/lead-sheets/generate', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    const leadSheets = await generateLeadSheets(pool, scope.workspaceUserId, scope.actorUserId, req.params.engagementId)
    if (!leadSheets) return res.status(404).json({ error: 'Engagement not found' })
    res.json({ leadSheets })
  })

  r.get('/v1/accounting/engagements/:engagementId/lead-sheets', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.read', res))) return
    const leadSheets = await listLeadSheets(pool, scope.workspaceUserId, req.params.engagementId)
    res.json({ leadSheets })
  })

  r.get('/v1/accounting/engagements/:engagementId/lead-sheets/:leadSheetId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.read', res))) return
    const detail = await getLeadSheetDetail(pool, scope.workspaceUserId, req.params.engagementId, req.params.leadSheetId)
    if (!detail) return res.status(404).json({ error: 'Lead sheet not found' })
    res.json(detail)
  })

  r.get('/v1/accounting/lead-sheets/:leadSheetId/evidence-links', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveWorkingPaperScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.read', res))) return
    const evidence = await getEvidenceLinksForLeadSheet(pool, scope.workspaceUserId, req.params.leadSheetId)
    if (!evidence) return res.status(404).json({ error: 'Lead sheet not found' })
    res.json({ evidence })
  })

  r.get('/v1/accounting/evidence-links/:evidenceLinkId/annotations', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveWorkingPaperScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.read', res))) return
    const { rows } = await pool.query(
      `SELECT id, evidence_link_id, annotation_type, content, page_number, rect, created_by, created_at, updated_at
       FROM taxgpt.evidence_annotations
       WHERE evidence_link_id = $1::uuid
         AND COALESCE(workspace_id::text, '') = COALESCE($2::text, '')
         AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [req.params.evidenceLinkId, scope.workspace.id]
    )
    res.json({ annotations: rows })
  })

  r.post('/v1/accounting/evidence-links/:evidenceLinkId/annotations', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveWorkingPaperScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.manage', res))) return
    const annotationType = String(req.body?.annotationType || 'note')
    const content = req.body?.content && typeof req.body.content === 'object' ? req.body.content : {}
    const pageNumber = req.body?.pageNumber ?? null
    const rect = req.body?.rect && typeof req.body.rect === 'object' ? req.body.rect : null
    const { rows: linkRows } = await pool.query(
      `SELECT engagement_id, lead_sheet_id
       FROM taxgpt.evidence_links
       WHERE id = $1::uuid
         AND COALESCE(workspace_id::text, '') = COALESCE($2::text, '')
       LIMIT 1`,
      [req.params.evidenceLinkId, scope.workspace.id]
    )
    const evidenceLink = linkRows[0]
    if (!evidenceLink) return res.status(404).json({ error: 'Evidence link not found' })
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.evidence_annotations
       (organization_id, workspace_id, engagement_id, evidence_link_id, annotation_type, content, page_number, rect, created_by, updated_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6::jsonb, $7, $8::jsonb, $9, $9, now(), now())
       RETURNING id, evidence_link_id, annotation_type, content, page_number, rect, created_by, created_at, updated_at`,
      [
        scope.workspace.organizationId || null,
        scope.workspace.id || null,
        evidenceLink.engagement_id || null,
        req.params.evidenceLinkId,
        annotationType,
        JSON.stringify(content),
        pageNumber,
        rect ? JSON.stringify(rect) : null,
        scope.actorUserId
      ]
    )
    await recordCanonicalAuditEvent(pool, {
      organizationId: scope.workspace.organizationId,
      workspaceId: scope.workspace.id,
      engagementId: evidenceLink.engagement_id || null,
      leadSheetId: evidenceLink.lead_sheet_id || null,
      eventType: 'evidence.annotation_created',
      entityType: 'evidence_annotation',
      entityId: rows[0]?.id,
      actorId: scope.actorUserId,
      afterValue: rows[0],
      metadata: { evidenceLinkId: req.params.evidenceLinkId }
    })
    res.json({ annotation: rows[0] })
  })

  r.post('/v1/accounting/lead-sheets/:leadSheetId/evidence-links', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveWorkingPaperScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.manage', res))) return
    const evidence = await createEvidenceLinkForLeadSheet(pool, scope.workspaceUserId, scope.actorUserId, req.params.leadSheetId, req.body || {})
    if (!evidence) return res.status(404).json({ error: 'Lead sheet not found' })
    res.json({ evidence })
  })

  r.patch('/v1/accounting/lead-sheets/:leadSheetId/conclusion', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveWorkingPaperScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.manage', res))) return
    const leadSheet = await updateLeadSheetConclusion(pool, scope.workspaceUserId, scope.actorUserId, req.params.leadSheetId, req.body?.conclusionText || null)
    if (!leadSheet) return res.status(404).json({ error: 'Lead sheet not found' })
    res.json({ leadSheet })
  })

  r.patch('/v1/accounting/lead-sheets/:leadSheetId/status', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveWorkingPaperScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.manage', res))) return
    try {
      const leadSheet = await updateLeadSheetStatus(pool, scope.workspaceUserId, scope.actorUserId, req.params.leadSheetId, req.body?.status)
      if (!leadSheet) return res.status(404).json({ error: 'Lead sheet not found' })
      res.json({ leadSheet })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update lead sheet status' })
    }
  })

  r.post('/v1/accounting/lead-sheets/:leadSheetId/preparer-signoff', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveWorkingPaperScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'signoff.perform', res))) return
    const leadSheet = await preparerSignoff(pool, scope.workspaceUserId, scope.actorUserId, req.params.leadSheetId)
    if (!leadSheet) return res.status(404).json({ error: 'Lead sheet not found' })
    res.json({ leadSheet })
  })

  r.post('/v1/accounting/lead-sheets/:leadSheetId/reviewer-signoff', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveWorkingPaperScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'workflows.approve', res))) return
    const canOverride = isStaff(session.userId) ||
      scope.workspace.role === 'manager' ||
      scope.workspace.role === 'reviewer' ||
      scope.workspace.role === 'admin' ||
      scope.workspace.role === 'owner'
    try {
      const leadSheet = await reviewerSignoff(pool, scope.workspaceUserId, scope.actorUserId, req.params.leadSheetId, canOverride)
      if (!leadSheet) return res.status(404).json({ error: 'Lead sheet not found' })
      res.json({ leadSheet })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not sign off' })
    }
  })

  r.get('/v1/accounting/working-paper-rows/:workingPaperRowId/tickmarks', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.read', res))) return
    const tickmarks = await getTickmarksForWorkingPaperRow(pool, scope.workspaceUserId, req.params.workingPaperRowId)
    if (!tickmarks) return res.status(404).json({ error: 'Working paper row not found' })
    res.json({ tickmarks })
  })

  r.get('/v1/accounting/working-paper-rows/:workingPaperRowId/formulas', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.read', res))) return
    const { rows } = await pool.query(
      `SELECT fc.id, fc.working_paper_row_id, fc.cell_key, fc.formula_text, fc.evaluated_value, fc.value_type, fc.calculation_version, fc.metadata, fc.updated_at
       FROM taxgpt.formula_cells fc
       INNER JOIN taxgpt.working_paper_rows wpr ON wpr.id = fc.working_paper_row_id
       WHERE fc.working_paper_row_id = $1::uuid
         AND COALESCE(wpr.workspace_id::text, '') = COALESCE($2::text, '')
         AND fc.deleted_at IS NULL
       ORDER BY fc.cell_key ASC`,
      [req.params.workingPaperRowId, scope.workspace.id]
    )
    res.json({ cells: rows })
  })

  r.put('/v1/accounting/working-paper-rows/:workingPaperRowId/formulas', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.manage', res))) return
    const cells = Array.isArray(req.body?.cells) ? req.body.cells : []
    const { rows: rowScopeRows } = await pool.query(
      `SELECT id, engagement_id, lead_sheet_id
       FROM taxgpt.working_paper_rows
       WHERE id = $1::uuid
         AND COALESCE(workspace_id::text, '') = COALESCE($2::text, '')
       LIMIT 1`,
      [req.params.workingPaperRowId, scope.workspace.id]
    )
    const scopedRow = rowScopeRows[0]
    if (!scopedRow) return res.status(404).json({ error: 'Working paper row not found' })
    const { rows: beforeRows } = await pool.query(
      `SELECT fc.id, fc.cell_key, fc.formula_text, fc.evaluated_value, fc.value_type, fc.calculation_version, fc.metadata
       FROM taxgpt.formula_cells fc
       INNER JOIN taxgpt.working_paper_rows wpr ON wpr.id = fc.working_paper_row_id
       WHERE fc.working_paper_row_id = $1::uuid
         AND COALESCE(wpr.workspace_id::text, '') = COALESCE($2::text, '')
         AND deleted_at IS NULL
       ORDER BY cell_key ASC`,
      [req.params.workingPaperRowId, scope.workspace.id]
    )
    await pool.query(
      `UPDATE taxgpt.formula_cells
       SET deleted_at = now(), updated_at = now(), updated_by = $2
       WHERE working_paper_row_id = $1::uuid
         AND COALESCE(workspace_id::text, '') = COALESCE($3::text, '')
         AND deleted_at IS NULL`,
      [req.params.workingPaperRowId, scope.actorUserId, scope.workspace.id]
    )
    for (const cell of cells) {
      const cellKey = String(cell?.cellKey || '').trim()
      const formulaText = String(cell?.formulaText || '').trim()
      if (!cellKey || !formulaText) continue
      await pool.query(
        `INSERT INTO taxgpt.formula_cells
         (organization_id, workspace_id, engagement_id, lead_sheet_id, working_paper_row_id, cell_key, formula_text, evaluated_value, value_type, calculation_version, metadata, created_by, updated_by, created_at, updated_at)
         SELECT wpr.organization_id, wpr.workspace_id, wpr.engagement_id, wpr.lead_sheet_id, wpr.id, $2, $3, $4, $5, COALESCE($6::int, 1), COALESCE($7::jsonb, '{}'::jsonb), $8, $8, now(), now()
         FROM taxgpt.working_paper_rows wpr
         WHERE wpr.id = $1::uuid
           AND COALESCE(wpr.workspace_id::text, '') = COALESCE($9::text, '')`,
        [
          req.params.workingPaperRowId,
          cellKey,
          formulaText,
          cell?.evaluatedValue ?? null,
          cell?.valueType || 'number',
          cell?.calculationVersion ?? 1,
          JSON.stringify(cell?.metadata && typeof cell.metadata === 'object' ? cell.metadata : {}),
          scope.actorUserId,
          scope.workspace.id
        ]
      )
    }
    const { rows } = await pool.query(
      `SELECT fc.id, fc.working_paper_row_id, fc.cell_key, fc.formula_text, fc.evaluated_value, fc.value_type, fc.calculation_version, fc.metadata, fc.updated_at
       FROM taxgpt.formula_cells fc
       INNER JOIN taxgpt.working_paper_rows wpr ON wpr.id = fc.working_paper_row_id
       WHERE fc.working_paper_row_id = $1::uuid
         AND COALESCE(wpr.workspace_id::text, '') = COALESCE($2::text, '')
         AND deleted_at IS NULL
       ORDER BY cell_key ASC`,
      [req.params.workingPaperRowId, scope.workspace.id]
    )
    await recordCanonicalAuditEvent(pool, {
      organizationId: scope.workspace.organizationId,
      workspaceId: scope.workspace.id,
      engagementId: scopedRow.engagement_id || null,
      leadSheetId: scopedRow.lead_sheet_id || null,
      workingPaperRowId: req.params.workingPaperRowId,
      eventType: 'formula.cells_upserted',
      entityType: 'formula_cell',
      entityId: req.params.workingPaperRowId,
      actorId: scope.actorUserId,
      beforeValue: { cells: beforeRows },
      afterValue: { cells: rows }
    })
    res.json({ cells: rows })
  })

  r.post('/v1/accounting/working-paper-rows/:workingPaperRowId/tickmarks', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.manage', res))) return
    const tickmark = await createTickmarkForWorkingPaperRow(pool, scope.workspaceUserId, scope.actorUserId, req.params.workingPaperRowId, req.body || {})
    if (!tickmark) return res.status(404).json({ error: 'Working paper row not found' })
    res.json({ tickmark })
  })

  r.delete('/v1/accounting/lead-sheets/:leadSheetId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveWorkingPaperScope(req, res, session)
    if (!scope) return
    const ok = await deleteLeadSheet(pool, scope.workspaceUserId, scope.actorUserId, req.params.leadSheetId)
    if (!ok) return res.status(404).json({ error: 'Lead sheet not found' })
    res.json({ ok: true })
  })

  r.get('/v1/accounting/engagements/:engagementId/documents', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'documents.read', res))) return
    const documents = await listDocumentsByEngagement(pool, scope.workspaceUserId, req.params.engagementId, req.query.leadSheetId || null)
    res.json({ documents })
  })

  r.post('/v1/accounting/documents/link-existing', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    try {
      await assertEngagementAssignment(pool, scope.workspace, req.body?.engagementId, session.userId, { assignedBy: scope.actorUserId })
      if (req.body?.leadSheetId) {
        await assertWorkingPaperAssignment(pool, scope.workspace, req.body.leadSheetId, session.userId, { assignedBy: scope.actorUserId })
      }
      const document = await attachExistingDocument(pool, scope.workspaceUserId, scope.actorUserId, req.body || {})
      res.json({ document })
    } catch (e) {
      if (handleAssignmentError(res, e, 'Assignment required to link this document')) return
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not link document' })
    }
  })

  r.delete('/v1/accounting/documents/:documentId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    const ok = await detachDocument(pool, scope.workspaceUserId, scope.actorUserId, req.params.documentId)
    if (!ok) return res.status(404).json({ error: 'Document not found' })
    res.json({ ok: true })
  })

  r.get('/v1/accounting/engagements/:engagementId/review-notes', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.read', res))) return
    const notes = await listReviewNotes(pool, scope.workspaceUserId, req.params.engagementId, {
      status: req.query.status || null,
      priority: req.query.priority || null
    })
    res.json({ notes })
  })

  r.post('/v1/accounting/review-notes', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'review_notes.manage', res))) return
    try {
      await assertEngagementAssignment(pool, scope.workspace, req.body?.engagementId, session.userId, { assignedBy: scope.actorUserId })
      if (req.body?.leadSheetId) {
        await assertWorkingPaperAssignment(pool, scope.workspace, req.body.leadSheetId, session.userId, { assignedBy: scope.actorUserId })
      }
      const note = await createReviewNote(pool, scope.workspaceUserId, scope.actorUserId, req.body || {})
      res.json({ note })
    } catch (e) {
      if (handleAssignmentError(res, e, 'Assignment required to create review notes')) return
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create note' })
    }
  })

  r.patch('/v1/accounting/review-notes/:noteId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'review_notes.manage', res))) return
    try {
      const note = await updateReviewNoteStatus(pool, scope.workspaceUserId, scope.actorUserId, req.params.noteId, req.body?.status, req.body || {})
      if (!note) return res.status(404).json({ error: 'Review note not found' })
      res.json({ note })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update review note' })
    }
  })

  r.get('/v1/accounting/engagements/:engagementId/tasks', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'engagement.read', res))) return
    const tasks = await listTasks(pool, scope.workspaceUserId, req.params.engagementId)
    res.json({ tasks })
  })

  r.post('/v1/accounting/tasks', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    try {
      await assertEngagementAssignment(pool, scope.workspace, req.body?.engagementId, session.userId, { assignedBy: scope.actorUserId })
      if (req.body?.leadSheetId) {
        await assertWorkingPaperAssignment(pool, scope.workspace, req.body.leadSheetId, session.userId, { assignedBy: scope.actorUserId })
      }
      const task = await createTask(pool, scope.workspaceUserId, scope.actorUserId, req.body || {})
      res.json({ task })
    } catch (e) {
      if (handleAssignmentError(res, e, 'Assignment required to create tasks')) return
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create task' })
    }
  })

  r.patch('/v1/accounting/tasks/:taskId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    try {
      const task = await updateTask(pool, scope.workspaceUserId, scope.actorUserId, req.params.taskId, req.body || {})
      if (!task) return res.status(404).json({ error: 'Task not found' })
      res.json({ task })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update task' })
    }
  })

  r.get('/v1/accounting/engagements/:engagementId/adjustments', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveEngagementScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.read', res))) return
    const entries = await listAdjustmentEntries(pool, scope.workspaceUserId, req.params.engagementId)
    res.json({ entries })
  })

  r.post('/v1/accounting/adjustments', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.manage', res))) return
    try {
      await assertEngagementAssignment(pool, scope.workspace, req.body?.engagementId, session.userId, { assignedBy: scope.actorUserId })
      const entry = await createAdjustmentEntry(pool, scope.workspaceUserId, scope.actorUserId, req.body || {})
      res.json({ entry })
    } catch (e) {
      if (handleAssignmentError(res, e, 'Assignment required to create adjustment entries')) return
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create adjustment entry' })
    }
  })

  r.put('/v1/accounting/adjustments/:adjustmentId/lines', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'working_papers.manage', res))) return
    try {
      const result = await upsertAdjustmentLines(pool, scope.workspaceUserId, scope.actorUserId, req.params.adjustmentId, req.body?.lines || [])
      if (!result) return res.status(404).json({ error: 'Adjustment entry not found' })
      res.json(result)
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update adjustment lines' })
    }
  })

  r.patch('/v1/accounting/adjustments/:adjustmentId/status', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await requireScopePermission(session, scope, 'workflows.approve', res))) return
    try {
      const entry = await updateAdjustmentStatus(pool, scope.workspaceUserId, scope.actorUserId, req.params.adjustmentId, req.body?.status)
      if (!entry) return res.status(404).json({ error: 'Adjustment entry not found' })
      res.json({ entry })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not update adjustment status' })
    }
  })

  r.get('/v1/accounting/integrations', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await hasEntitlement(res, scope.workspace.id, 'integrations'))) return
    await ensureStandardMappingGroups(pool, scope.workspaceUserId)
    const connections = await listIntegrations(pool, scope.workspaceUserId, scope.organizationId)
    const qboEnv = QuickBooksOnlineProvider.envRequirements()
    const googleEnv = GoogleSheetsProvider.envRequirements()
    const qboConnection = connections.find((connection) => connection.provider === 'quickbooks_online') || null
    const googleConnection = connections.find((connection) => connection.provider === 'google_sheets') || null
    const qboStatus = await createAccountingProvider('quickbooks_online', qboConnection).getConnectionStatus()
    const googleStatus = await createAccountingProvider('google_sheets', googleConnection).getConnectionStatus()
    res.json({
      featureFlags: {
        ENABLE_QBO_CONNECT: process.env.ENABLE_QBO_CONNECT === 'true',
        ENABLE_QBO_JOURNAL_POSTING: process.env.ENABLE_QBO_JOURNAL_POSTING === 'true',
        ENABLE_GOOGLE_SHEETS_CONNECT: process.env.ENABLE_GOOGLE_SHEETS_CONNECT === 'true',
        ENABLE_AI_REVIEW: process.env.ENABLE_AI_REVIEW === 'true'
      },
      envReady: {
        qboConfigured: qboEnv.configured,
        googleConfigured: googleEnv.configured,
        encryptionConfigured: Boolean(process.env.ENCRYPTION_KEY)
      },
      providers: [
        {
          id: 'quickbooks_online',
          name: 'QuickBooks Online',
          configured: qboStatus.configured,
          connectionStatus: qboStatus.status,
          missingEnv: qboStatus.missingEnv,
          enabled: process.env.ENABLE_QBO_CONNECT === 'true',
          setupMessage: qboStatus.configured ? null : 'QuickBooks integration is not configured yet.'
        },
        {
          id: 'google_sheets',
          name: 'Google Sheets',
          configured: googleStatus.configured,
          connectionStatus: googleStatus.status,
          missingEnv: googleStatus.missingEnv,
          enabled: process.env.ENABLE_GOOGLE_SHEETS_CONNECT === 'true',
          setupMessage: googleStatus.configured ? null : 'Google Sheets integration is not configured yet.'
        },
        {
          id: 'excel_csv',
          name: 'Excel / CSV',
          configured: true,
          enabled: true,
          setupMessage: null
        }
      ],
      connections,
      workspace: {
        id: scope.workspace.id,
        name: scope.workspace.name,
        role: scope.workspace.role,
        ownerUserId: scope.workspace.owner_user_id
      }
    })
  })

  r.post('/v1/accounting/integrations/:provider/connect-url', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await hasEntitlement(res, scope.workspace.id, 'integrations'))) return
    const provider = String(req.params.provider || '')
    try {
      const stateToken = createSignedIntegrationState({
        provider,
        workspaceId: scope.workspace.id,
        workspaceUserId: scope.workspaceUserId,
        actorUserId: scope.actorUserId
      })
      let authUrl
      if (provider === 'quickbooks_online') {
        authUrl = buildQboAuthUrl(stateToken)
      } else if (provider === 'google_sheets') {
        authUrl = buildGoogleSheetsAuthUrl(stateToken)
      } else {
        return res.status(400).json({ error: 'Unsupported provider' })
      }
      res.json({ provider, authUrl })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not generate connect url' })
    }
  })

  r.get('/v1/accounting/integrations/:provider/callback', async (req, res) => {
    const provider = String(req.params.provider || '')
    const code = req.query.code
    const state = req.query.state
    if (!code || !state) return res.status(400).json({ error: 'Missing code/state' })
    try {
      const statePayload = verifySignedIntegrationState(state)
      if (statePayload.provider !== provider) {
        return res.status(400).json({ error: 'Invalid provider state' })
      }

      let tokenResponse
      let providerRealmId = null
      if (provider === 'quickbooks_online') {
        tokenResponse = await exchangeQboCodeForTokens(code)
        providerRealmId = req.query.realmId ? String(req.query.realmId) : null
      } else if (provider === 'google_sheets') {
        tokenResponse = await exchangeGoogleCodeForTokens(code)
      } else {
        return res.status(400).json({ error: 'Unsupported provider' })
      }

      await upsertIntegrationConnection(pool, statePayload.workspaceUserId, statePayload.actorUserId, {
        organizationId: statePayload.workspaceId,
        clientId: null,
        provider,
        providerRealmId,
        connectionStatus: 'connected',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        tokenExpiresAt: tokenResponse.expires_in
          ? new Date(Date.now() + Number(tokenResponse.expires_in) * 1000).toISOString()
          : null,
        metadata: {
          tokenType: tokenResponse.token_type || null,
          scope: tokenResponse.scope || null
        }
      })

      const frontendRedirect = '/portal/accounting/integrations?integration=connected'
      res.redirect(frontendRedirect)
    } catch (e) {
      const frontendRedirect = `/portal/accounting/integrations?integration=error&message=${encodeURIComponent(e instanceof Error ? e.message : 'Integration callback failed')}`
      res.redirect(frontendRedirect)
    }
  })

  r.post('/v1/accounting/integrations/configure', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const scope = await resolveAccountingScope(req, res, session)
    if (!scope) return
    if (!(await hasEntitlement(res, scope.workspace.id, 'integrations'))) return
    try {
      const connection = await upsertIntegrationConnection(pool, scope.workspaceUserId, scope.actorUserId, {
        ...(req.body || {}),
        organizationId: scope.organizationId
      })
      res.json({ connection })
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not configure integration' })
    }
  })

  r.get('/v1/accounting/ai/status', async (_req, res) => {
    const service = new AIReviewService()
    res.json({
      enabled: service.enabled,
      message: service.enabled ? 'AI review enabled' : 'AI review is not enabled yet'
    })
  })

  return r
}

import { getClerkBackendClient, resolveClerkUserIdByEmail } from '../clerkAdminService.js'
import { mapWithConcurrency, resolveClerkUser } from '../clerkUserCache.js'

function normalizeLimit (value, fallback = 25, max = 100) {
  return Math.min(Math.max(Number(value) || fallback, 1), max)
}

function normalizeOffset (value) {
  return Math.max(Number(value) || 0, 0)
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

async function enrichPortalUserRow (row) {
  const clerkUserId = String(row.clerkUserId || '')
  let displayName = clerkUserId
  let email = null
  let imageUrl = null
  let lastSignInAt = null

  if (clerkUserId && !clerkUserId.startsWith('invite:')) {
    try {
      const client = getClerkBackendClient()
      const user = await resolveClerkUser(client, clerkUserId)
      displayName = buildDisplayNameFromClerkUser(user) || extractPrimaryEmailFromClerkUser(user) || clerkUserId
      email = extractPrimaryEmailFromClerkUser(user)
      imageUrl = user?.imageUrl || null
      lastSignInAt = user?.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null
    } catch {
      displayName = clerkUserId
    }
  }

  return {
    clerkUserId,
    displayName,
    email,
    imageUrl,
    userType: row.userType || null,
    employeeCount: row.employeeCount || null,
    workspaceCount: Number(row.workspaceCount || 0),
    workspaceNames: Array.isArray(row.workspaceNames) ? row.workspaceNames : [],
    signedUpAt: row.signedUpAt,
    lastActiveAt: row.lastActiveAt,
    lastSignInAt
  }
}

const PORTAL_USERS_BASE_SQL = `
  WITH portal_user_ids AS (
    SELECT clerk_user_id FROM taxgpt.users
    UNION
    SELECT clerk_user_id
    FROM taxgpt.accounting_workspace_members
    WHERE clerk_user_id NOT LIKE 'invite:%'
  ),
  portal_users AS (
    SELECT
      p.clerk_user_id,
      u.user_type,
      u.employee_count,
      COALESCE(u.created_at, membership.first_seen) AS signed_up_at,
      GREATEST(
        COALESCE(u.updated_at, to_timestamp(0)),
        COALESCE(membership.last_seen, to_timestamp(0))
      ) AS last_active_at,
      COALESCE(membership.workspace_count, 0)::int AS workspace_count,
      membership.workspace_names
    FROM portal_user_ids p
    LEFT JOIN taxgpt.users u ON u.clerk_user_id = p.clerk_user_id
    LEFT JOIN LATERAL (
      SELECT
        min(wm.created_at) AS first_seen,
        max(wm.updated_at) AS last_seen,
        count(DISTINCT wm.workspace_id)::int AS workspace_count,
        array_agg(DISTINCT w.name ORDER BY w.name) FILTER (WHERE w.name IS NOT NULL) AS workspace_names
      FROM taxgpt.accounting_workspace_members wm
      INNER JOIN taxgpt.accounting_workspaces w ON w.id = wm.workspace_id
      WHERE wm.clerk_user_id = p.clerk_user_id
        AND wm.status = 'active'
    ) membership ON true
  )
`

export async function getPortalUserStats (pool) {
  try {
    const { rows: [totals] } = await pool.query(`
      ${PORTAL_USERS_BASE_SQL}
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE workspace_count > 0)::int AS with_workspace,
        count(*) FILTER (WHERE user_type IS NOT NULL)::int AS with_profile
      FROM portal_users
    `)

    const { rows: byUserType } = await pool.query(`
      ${PORTAL_USERS_BASE_SQL}
      SELECT coalesce(user_type, 'unknown') AS user_type, count(*)::int AS count
      FROM portal_users
      GROUP BY coalesce(user_type, 'unknown')
      ORDER BY count DESC
    `)

    return {
      totals: {
        total: Number(totals?.total || 0),
        withWorkspace: Number(totals?.with_workspace || 0),
        withProfile: Number(totals?.with_profile || 0)
      },
      byUserType: (byUserType || []).map((row) => ({
        key: String(row.user_type || 'unknown'),
        count: Number(row.count || 0)
      }))
    }
  } catch (error) {
    if (error?.code === '42P01') {
      return {
        totals: { total: 0, withWorkspace: 0, withProfile: 0 },
        byUserType: [],
        tableMissing: true
      }
    }
    throw error
  }
}

export async function listPortalUsersForOps (pool, options = {}) {
  const limit = normalizeLimit(options.limit)
  const offset = normalizeOffset(options.offset)
  const params = []
  const where = []
  const query = String(options.q || '').trim()

  if (query) {
    if (query.includes('@')) {
      const clerkUserId = await resolveClerkUserIdByEmail(query)
      if (!clerkUserId) {
        return { items: [], total: 0, limit, offset }
      }
      params.push(clerkUserId)
      where.push(`clerk_user_id = $${params.length}`)
    } else {
      params.push(`%${query}%`)
      where.push(`clerk_user_id ILIKE $${params.length}`)
    }
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
  params.push(limit, offset)

  const { rows } = await pool.query(
    `${PORTAL_USERS_BASE_SQL}
     SELECT
       clerk_user_id AS "clerkUserId",
       user_type AS "userType",
       employee_count AS "employeeCount",
       signed_up_at AS "signedUpAt",
       last_active_at AS "lastActiveAt",
       workspace_count AS "workspaceCount",
       workspace_names AS "workspaceNames"
     FROM portal_users
     ${whereSql}
     ORDER BY signed_up_at DESC NULLS LAST, clerk_user_id ASC
     LIMIT $${params.length - 1}
     OFFSET $${params.length}`,
    params
  )

  const countParams = params.slice(0, -2)
  const { rows: countRows } = await pool.query(
    `${PORTAL_USERS_BASE_SQL}
     SELECT count(*)::int AS total
     FROM portal_users
     ${whereSql}`,
    countParams
  )

  const enriched = await mapWithConcurrency(rows, 3, (row) => enrichPortalUserRow(row))

  return {
    items: enriched,
    total: Number(countRows[0]?.total || 0),
    limit,
    offset
  }
}

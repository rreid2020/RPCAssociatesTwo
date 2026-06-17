import {
  getClerkUserProfilesByIds,
  searchClerkUserIds
} from '../clerkAdminService.js'

let usersTableColumnsCache = null

function normalizeLimit (value, fallback = 25, max = 100) {
  return Math.min(Math.max(Number(value) || fallback, 1), max)
}

function normalizeOffset (value) {
  return Math.max(Number(value) || 0, 0)
}

async function getUsersTableColumns (pool) {
  if (usersTableColumnsCache) return usersTableColumnsCache
  const { rows } = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'taxgpt'
      AND table_name = 'users'
  `)
  usersTableColumnsCache = new Set(rows.map((row) => String(row.column_name)))
  return usersTableColumnsCache
}

async function buildPortalUsersBaseSql (pool) {
  const columns = await getUsersTableColumns(pool)
  const signedUpExpr = columns.has('created_at')
    ? 'COALESCE(u.created_at, membership.first_seen)'
    : 'membership.first_seen'
  const userUpdatedExpr = columns.has('updated_at') ? 'u.updated_at' : 'NULL::timestamp'
  const userTypeExpr = columns.has('user_type') ? 'u.user_type' : 'NULL::varchar'
  const employeeCountExpr = columns.has('employee_count') ? 'u.employee_count' : 'NULL::varchar'

  return `
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
        ${userTypeExpr} AS user_type,
        ${employeeCountExpr} AS employee_count,
        ${signedUpExpr} AS signed_up_at,
        GREATEST(
          COALESCE(${userUpdatedExpr}, to_timestamp(0)),
          COALESCE(membership.last_seen, to_timestamp(0))
        ) AS last_active_at,
        COALESCE(membership.workspace_count, 0)::int AS workspace_count,
        membership.workspace_names,
        (u.clerk_user_id IS NOT NULL) AS has_users_record
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
}

function mapPortalUserRow (row, clerkProfile = null) {
  const clerkUserId = String(row.clerkUserId || '')
  const displayName = clerkProfile?.displayName || null
  const email = clerkProfile?.email || null

  return {
    clerkUserId,
    displayName: displayName || email || clerkUserId,
    email,
    imageUrl: clerkProfile?.imageUrl || null,
    userType: row.userType || null,
    employeeCount: row.employeeCount || null,
    hasUsersRecord: Boolean(row.hasUsersRecord),
    workspaceCount: Number(row.workspaceCount || 0),
    workspaceNames: Array.isArray(row.workspaceNames) ? row.workspaceNames : [],
    signedUpAt: row.signedUpAt,
    lastActiveAt: row.lastActiveAt,
    lastSignInAt: clerkProfile?.lastSignInAt || null
  }
}

async function enrichPortalUsersWithClerk (items) {
  if (!process.env.CLERK_SECRET_KEY || items.length === 0) return items

  try {
    const profiles = await getClerkUserProfilesByIds(items.map((item) => item.clerkUserId))
    return items.map((item) => mapPortalUserRow(item, profiles.get(item.clerkUserId) || null))
  } catch (error) {
    console.warn('Clerk profile enrichment failed for portal users:', error)
    return items.map((item) => mapPortalUserRow(item))
  }
}

export async function getPortalUserStats (pool) {
  try {
    const baseSql = await buildPortalUsersBaseSql(pool)
    const columns = await getUsersTableColumns(pool)

    const { rows: [totals] } = await pool.query(`
      ${baseSql}
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE workspace_count > 0)::int AS with_workspace,
        count(*) FILTER (WHERE has_users_record)::int AS with_users_record
      FROM portal_users
    `)

    let byUserType = []
    if (columns.has('user_type')) {
      const { rows } = await pool.query(`
        ${baseSql}
        SELECT coalesce(user_type, 'unknown') AS user_type, count(*)::int AS count
        FROM portal_users
        GROUP BY coalesce(user_type, 'unknown')
        ORDER BY count DESC
      `)
      byUserType = (rows || []).map((row) => ({
        key: String(row.user_type || 'unknown'),
        count: Number(row.count || 0)
      }))
    }

    return {
      totals: {
        total: Number(totals?.total || 0),
        withWorkspace: Number(totals?.with_workspace || 0),
        withUsersRecord: Number(totals?.with_users_record || 0)
      },
      byUserType
    }
  } catch (error) {
    if (error?.code === '42P01') {
      return {
        totals: { total: 0, withWorkspace: 0, withUsersRecord: 0 },
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
  const baseSql = await buildPortalUsersBaseSql(pool)

  if (query) {
    let clerkMatchedIds = null
    if (process.env.CLERK_SECRET_KEY) {
      try {
        clerkMatchedIds = await searchClerkUserIds(query)
      } catch (error) {
        console.warn('Clerk user search failed for portal users:', error)
      }
    }

    if (Array.isArray(clerkMatchedIds)) {
      if (clerkMatchedIds.length === 0) {
        return { items: [], total: 0, limit, offset }
      }
      params.push(clerkMatchedIds)
      where.push(`clerk_user_id = ANY($${params.length}::text[])`)
    } else {
      params.push(`%${query}%`)
      where.push(`clerk_user_id ILIKE $${params.length}`)
    }
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
  params.push(limit, offset)

  const { rows } = await pool.query(
    `${baseSql}
     SELECT
       clerk_user_id AS "clerkUserId",
       user_type AS "userType",
       employee_count AS "employeeCount",
       signed_up_at AS "signedUpAt",
       last_active_at AS "lastActiveAt",
       workspace_count AS "workspaceCount",
       workspace_names AS "workspaceNames",
       has_users_record AS "hasUsersRecord"
     FROM portal_users
     ${whereSql}
     ORDER BY signed_up_at DESC NULLS LAST, clerk_user_id ASC
     LIMIT $${params.length - 1}
     OFFSET $${params.length}`,
    params
  )

  const countParams = params.slice(0, -2)
  const { rows: countRows } = await pool.query(
    `${baseSql}
     SELECT count(*)::int AS total
     FROM portal_users
     ${whereSql}`,
    countParams
  )

  const rawItems = rows.map((row) => ({
    clerkUserId: row.clerkUserId,
    userType: row.userType,
    employeeCount: row.employeeCount,
    signedUpAt: row.signedUpAt,
    lastActiveAt: row.lastActiveAt,
    workspaceCount: row.workspaceCount,
    workspaceNames: row.workspaceNames,
    hasUsersRecord: row.hasUsersRecord
  }))

  return {
    items: await enrichPortalUsersWithClerk(rawItems),
    total: Number(countRows[0]?.total || 0),
    limit,
    offset
  }
}

import {
  ensureTaxgptFeedbackTables,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  getTaxgptFeedbackCategories
} from '../taxgptFeedbackService.js'
import { resolveRequestedPublications } from '../taxgptPublicationResolver.js'
import { ingestFeedbackSources } from './taxgptFeedbackIngestService.js'

const ALLOWED_SOURCE_HOSTS = [
  'canada.ca',
  'www.canada.ca',
  'revenuquebec.ca',
  'www.revenuquebec.ca',
  'canlii.org',
  'www.canlii.org'
]

function normalizeLimit (value, fallback = 25, max = 100) {
  return Math.min(Math.max(Number(value) || fallback, 1), max)
}

function normalizeOffset (value) {
  return Math.max(Number(value) || 0, 0)
}

function assertStatus (status) {
  const value = String(status || '').trim().toLowerCase()
  if (!FEEDBACK_STATUSES.has(value)) {
    throw new Error('Invalid feedback status')
  }
  return value
}

function mapFeedbackRow (row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.userId,
    workspaceId: row.workspaceId,
    category: row.category,
    subject: row.subject,
    message: row.message,
    rating: row.rating,
    sessionId: row.sessionId,
    status: row.status,
    operatorNotes: row.operatorNotes,
    stagedEnhancement: row.stagedEnhancement,
    trainingSignal: row.trainingSignal,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

function normalizeSourceUrl (raw) {
  const value = String(raw || '').trim()
  if (!value) return null
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`Invalid source URL: ${value}`)
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`Source URL must use HTTPS: ${value}`)
  }
  const host = parsed.hostname.toLowerCase()
  if (!ALLOWED_SOURCE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
    throw new Error(`Source URL host is not allowed for corpus ingest: ${host}`)
  }
  return parsed.toString()
}

function deriveSourceTitle (url) {
  try {
    const pathname = new URL(url).pathname.split('/').filter(Boolean)
    const tail = pathname[pathname.length - 1] || 'feedback-source'
    return decodeURIComponent(tail).replace(/[-_]+/g, ' ').slice(0, 200) || 'Feedback source'
  } catch {
    return 'Feedback source'
  }
}

async function queueCorpusSource (pool, url, feedbackId, staffUserId) {
  const title = deriveSourceTitle(url)
  const metadata = {
    corpusRole: 'feedback_action',
    feedbackId,
    queuedBy: staffUserId,
    queuedAt: new Date().toISOString()
  }

  const { rows } = await pool.query(
    `INSERT INTO taxgpt.sources (
      url,
      normalized_url,
      title,
      source_type,
      category,
      ingest_status,
      page_kind,
      priority,
      metadata
    )
    VALUES ($1, $1, $2, 'html', 'other', 'pending', 'content', 'high', $3::jsonb)
    ON CONFLICT (url) DO UPDATE
    SET
      ingest_status = CASE
        WHEN taxgpt.sources.ingest_status IN ('skipped', 'failed') THEN 'pending'
        ELSE taxgpt.sources.ingest_status
      END,
      priority = CASE
        WHEN taxgpt.sources.ingest_status IN ('skipped', 'failed', 'pending') THEN 'high'
        ELSE taxgpt.sources.priority
      END,
      metadata = COALESCE(taxgpt.sources.metadata, '{}'::jsonb) || $3::jsonb,
      error_code = CASE
        WHEN taxgpt.sources.ingest_status IN ('skipped', 'failed') THEN NULL
        ELSE taxgpt.sources.error_code
      END,
      error_message = CASE
        WHEN taxgpt.sources.ingest_status IN ('skipped', 'failed') THEN NULL
        ELSE taxgpt.sources.error_message
      END
    RETURNING id, url, title, ingest_status AS "ingestStatus"`,
    [url, title, JSON.stringify(metadata)]
  )

  return rows[0]
}

function extractUrlsFromText (text) {
  const matches = String(text || '').match(/https:\/\/[^\s)\]"']+/gi) || []
  return [...new Set(matches.map((value) => value.replace(/[.,;]+$/, '')))]
}

function extractCitationUrls (sessionMessages = []) {
  const urls = new Set()
  for (const message of sessionMessages) {
    const citations = Array.isArray(message.citations) ? message.citations : []
    for (const citation of citations) {
      if (citation?.sourceUrl) urls.add(citation.sourceUrl)
    }
    const groupedSources = message.structuredResponse?.groupedSources
    if (Array.isArray(groupedSources)) {
      for (const group of groupedSources) {
        if (group?.sourceUrl) urls.add(group.sourceUrl)
        for (const document of group?.documents || []) {
          if (document?.sourceUrl) urls.add(document.sourceUrl)
        }
      }
    }
  }
  return [...urls]
}

function safeNormalizeSourceUrls (urls = []) {
  const normalized = []
  for (const url of urls) {
    try {
      normalized.push(normalizeSourceUrl(url))
    } catch {
      // Ignore URLs outside the allowed corpus host list.
    }
  }
  return [...new Set(normalized)]
}

export async function discoverFeedbackFixSourceUrls (pool, detail) {
  const { feedback, sessionMessages } = detail
  const discovered = new Set()

  for (const url of safeNormalizeSourceUrls(extractCitationUrls(sessionMessages))) {
    discovered.add(url)
  }

  const queryText = [
    feedback.message,
    ...sessionMessages.filter((message) => message.role === 'user').map((message) => message.content)
  ].join('\n')

  for (const url of safeNormalizeSourceUrls(extractUrlsFromText(queryText))) {
    discovered.add(url)
  }

  const publications = await resolveRequestedPublications(pool, queryText)
  for (const publication of publications) {
    if (publication.url) {
      try {
        discovered.add(normalizeSourceUrl(publication.url))
      } catch {
        // Ignore publication URLs outside the allowed host list.
      }
    }
  }

  return {
    sourceUrls: [...discovered],
    publications
  }
}

async function reprioritizePublicationSources (pool, publications = [], feedbackId, staffUserId) {
  const reprioritized = []
  for (const publication of publications) {
    if (!publication.url || publication.status === 'ingested') continue
    const queued = await queueCorpusSource(pool, publication.url, feedbackId, staffUserId)
    reprioritized.push({
      ...queued,
      publicationCode: publication.code,
      publicationStatus: publication.status
    })
  }
  return reprioritized
}

export async function getTaxgptFeedbackStats (pool) {
  await ensureTaxgptFeedbackTables(pool)
  const [statusResult, categoryResult, recentResult] = await Promise.all([
    pool.query(`
      SELECT status, count(*)::int AS count
      FROM taxgpt.feedback
      GROUP BY status
      ORDER BY count DESC
    `),
    pool.query(`
      SELECT category, count(*)::int AS count
      FROM taxgpt.feedback
      GROUP BY category
      ORDER BY count DESC
    `),
    pool.query(`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE status = 'submitted')::int AS submitted,
             count(*) FILTER (WHERE status = 'under_review')::int AS under_review,
             count(*) FILTER (WHERE status = 'staged_for_approval')::int AS staged_for_approval
      FROM taxgpt.feedback
    `)
  ])

  const totals = recentResult.rows[0] || { total: 0, submitted: 0, under_review: 0, staged_for_approval: 0 }
  return {
    totals: {
      total: Number(totals.total || 0),
      submitted: Number(totals.submitted || 0),
      underReview: Number(totals.under_review || 0),
      stagedForApproval: Number(totals.staged_for_approval || 0)
    },
    byStatus: (statusResult.rows || []).map((row) => ({
      key: row.status,
      count: Number(row.count || 0)
    })),
    byCategory: (categoryResult.rows || []).map((row) => ({
      key: row.category,
      count: Number(row.count || 0)
    }))
  }
}

export async function listTaxgptFeedbackForOps (pool, options = {}) {
  await ensureTaxgptFeedbackTables(pool)
  const limit = normalizeLimit(options.limit)
  const offset = normalizeOffset(options.offset)
  const params = []
  const where = []

  if (options.status) {
    params.push(assertStatus(options.status))
    where.push(`status = $${params.length}`)
  }
  if (options.category) {
    const category = String(options.category).trim().toLowerCase()
    if (!FEEDBACK_CATEGORIES.has(category)) {
      throw new Error('Invalid feedback category')
    }
    params.push(category)
    where.push(`category = $${params.length}`)
  }
  if (options.q) {
    params.push(`%${String(options.q).trim()}%`)
    where.push(`(subject ILIKE $${params.length} OR message ILIKE $${params.length})`)
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
  params.push(limit, offset)

  const { rows } = await pool.query(
    `SELECT
      id,
      user_id AS "userId",
      workspace_id AS "workspaceId",
      category,
      subject,
      message,
      rating,
      session_id AS "sessionId",
      status,
      operator_notes AS "operatorNotes",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM taxgpt.feedback
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}`,
    params
  )

  const countParams = params.slice(0, -2)
  const { rows: countRows } = await pool.query(
    `SELECT count(*)::int AS total FROM taxgpt.feedback ${whereSql}`,
    countParams
  )

  return {
    items: rows,
    total: Number(countRows[0]?.total || 0),
    limit,
    offset
  }
}

export async function getTaxgptFeedbackDetailForOps (pool, feedbackId) {
  await ensureTaxgptFeedbackTables(pool)
  const { rows } = await pool.query(
    `SELECT
      id,
      user_id AS "userId",
      workspace_id AS "workspaceId",
      category,
      subject,
      message,
      rating,
      session_id AS "sessionId",
      status,
      operator_notes AS "operatorNotes",
      staged_enhancement AS "stagedEnhancement",
      training_signal AS "trainingSignal",
      metadata,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM taxgpt.feedback
    WHERE id = $1::uuid
    LIMIT 1`,
    [feedbackId]
  )

  const feedback = mapFeedbackRow(rows[0])
  if (!feedback) {
    return null
  }

  let sessionMessages = []
  if (feedback.sessionId) {
    const { rows: messageRows } = await pool.query(
      `SELECT
        id,
        role,
        content,
        citations,
        risk_level AS "riskLevel",
        structured_response AS "structuredResponse",
        created_at AS "createdAt"
      FROM taxgpt.chat_messages
      WHERE session_id = $1::uuid
      ORDER BY created_at ASC`,
      [feedback.sessionId]
    )
    sessionMessages = messageRows
  }

  return {
    feedback,
    sessionMessages,
    categories: getTaxgptFeedbackCategories(),
    statuses: Array.from(FEEDBACK_STATUSES),
    fixSuggestions: await discoverFeedbackFixSourceUrls(pool, { feedback, sessionMessages })
  }
}

export async function updateTaxgptFeedbackForOps (pool, feedbackId, staffUserId, payload = {}) {
  await ensureTaxgptFeedbackTables(pool)
  const existing = await getTaxgptFeedbackDetailForOps(pool, feedbackId)
  if (!existing) {
    throw new Error('Feedback not found')
  }

  const updates = []
  const params = [feedbackId]

  if (payload.status !== undefined) {
    params.push(assertStatus(payload.status))
    updates.push(`status = $${params.length}`)
  }
  if (payload.operatorNotes !== undefined) {
    params.push(String(payload.operatorNotes || '').trim() || null)
    updates.push(`operator_notes = $${params.length}`)
  }

  if (updates.length === 0) {
    throw new Error('No valid fields to update')
  }

  const reviewMetadata = {
    ...(existing.feedback.metadata || {}),
    lastReviewedBy: staffUserId,
    lastReviewedAt: new Date().toISOString()
  }
  params.push(JSON.stringify(reviewMetadata))
  updates.push(`metadata = $${params.length}::jsonb`)
  updates.push('updated_at = now()')

  const { rows } = await pool.query(
    `UPDATE taxgpt.feedback
     SET ${updates.join(', ')}
     WHERE id = $1::uuid
     RETURNING
      id,
      user_id AS "userId",
      workspace_id AS "workspaceId",
      category,
      subject,
      message,
      rating,
      session_id AS "sessionId",
      status,
      operator_notes AS "operatorNotes",
      staged_enhancement AS "stagedEnhancement",
      training_signal AS "trainingSignal",
      metadata,
      created_at AS "createdAt",
      updated_at AS "updatedAt"`,
    params
  )

  return mapFeedbackRow(rows[0])
}

export async function deleteTaxgptFeedbackForOps (pool, feedbackId) {
  await ensureTaxgptFeedbackTables(pool)
  const { rowCount } = await pool.query(
    `DELETE FROM taxgpt.feedback WHERE id = $1::uuid`,
    [feedbackId]
  )
  if (!rowCount) {
    throw new Error('Feedback not found')
  }
  return { deleted: true }
}

/**
 * Action feedback into TaxGPT: queue corpus sources and record operator staging metadata.
 */
export async function actionTaxgptFeedbackForOps (pool, feedbackId, staffUserId, payload = {}) {
  await ensureTaxgptFeedbackTables(pool)
  const existing = await getTaxgptFeedbackDetailForOps(pool, feedbackId)
  if (!existing) {
    throw new Error('Feedback not found')
  }

  const sourceUrls = Array.isArray(payload.sourceUrls)
    ? payload.sourceUrls
    : String(payload.sourceUrls || '')
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean)

  const normalizedUrls = sourceUrls.map((url) => normalizeSourceUrl(url))
  const wantsQueue = payload.actionType === 'queue_corpus_sources' || normalizedUrls.length > 0
  if (wantsQueue && normalizedUrls.length === 0) {
    throw new Error('At least one HTTPS CRA or CanLII source URL is required to queue corpus sources')
  }

  const queuedSources = []
  for (const url of normalizedUrls) {
    queuedSources.push(await queueCorpusSource(pool, url, feedbackId, staffUserId))
  }

  const nextStatus = payload.status
    ? assertStatus(payload.status)
    : (queuedSources.length > 0 ? 'staged_for_approval' : 'under_review')

  const operatorNotes = payload.operatorNotes !== undefined
    ? String(payload.operatorNotes || '').trim() || null
    : existing.feedback.operatorNotes

  const stagedEnhancement = {
    actionType: payload.actionType || (queuedSources.length > 0 ? 'queue_corpus_sources' : 'operator_review'),
    sourceUrls: normalizedUrls,
    queuedSources,
    operatorSummary: payload.operatorSummary || null,
    actionedAt: new Date().toISOString(),
    actionedBy: staffUserId
  }

  const trainingSignal = {
    ...(existing.feedback.trainingSignal || {}),
    operatorAction: stagedEnhancement.actionType,
    corpusSourcesQueued: queuedSources.length,
    actionedAt: stagedEnhancement.actionedAt,
    actionedBy: staffUserId
  }

  const metadata = {
    ...(existing.feedback.metadata || {}),
    lastActionedBy: staffUserId,
    lastActionedAt: stagedEnhancement.actionedAt
  }

  const { rows } = await pool.query(
    `UPDATE taxgpt.feedback
     SET
      status = $2,
      operator_notes = $3,
      staged_enhancement = $4::jsonb,
      training_signal = $5::jsonb,
      metadata = $6::jsonb,
      updated_at = now()
     WHERE id = $1::uuid
     RETURNING
      id,
      user_id AS "userId",
      workspace_id AS "workspaceId",
      category,
      subject,
      message,
      rating,
      session_id AS "sessionId",
      status,
      operator_notes AS "operatorNotes",
      staged_enhancement AS "stagedEnhancement",
      training_signal AS "trainingSignal",
      metadata,
      created_at AS "createdAt",
      updated_at AS "updatedAt"`,
    [
      feedbackId,
      nextStatus,
      operatorNotes,
      JSON.stringify(stagedEnhancement),
      JSON.stringify(trainingSignal),
      JSON.stringify(metadata)
    ]
  )

  return {
    feedback: mapFeedbackRow(rows[0]),
    queuedSources
  }
}

/**
 * Discover likely corpus fixes from linked chat context, queue sources, and ingest them.
 */
export async function kickoffTaxgptFeedbackFix (pool, feedbackId, staffUserId, payload = {}) {
  const detail = await getTaxgptFeedbackDetailForOps(pool, feedbackId)
  if (!detail) {
    throw new Error('Feedback not found')
  }

  const discovered = await discoverFeedbackFixSourceUrls(pool, detail)
  const manualUrls = Array.isArray(payload.sourceUrls)
    ? payload.sourceUrls
    : String(payload.sourceUrls || '')
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean)
  const sourceUrls = [...new Set([
    ...discovered.sourceUrls,
    ...safeNormalizeSourceUrls(manualUrls)
  ])]

  if (sourceUrls.length === 0) {
    await updateTaxgptFeedbackForOps(pool, feedbackId, staffUserId, {
      status: 'under_review',
      operatorNotes: payload.operatorNotes ?? detail.feedback.operatorNotes
    })
    throw new Error('No fixable CRA or CanLII source URLs were discovered. Open the feedback detail to add URLs manually.')
  }

  const actionResult = await actionTaxgptFeedbackForOps(pool, feedbackId, staffUserId, {
    sourceUrls,
    status: 'under_review',
    operatorNotes: payload.operatorNotes,
    operatorSummary: payload.operatorSummary || `Kickoff fix discovered ${discovered.sourceUrls.length} source URL(s)`,
    actionType: 'kickoff_fix'
  })

  const reprioritized = await reprioritizePublicationSources(
    pool,
    discovered.publications,
    feedbackId,
    staffUserId
  )

  const queuedIds = [...new Set([
    ...actionResult.queuedSources.map((source) => source.id),
    ...reprioritized.map((source) => source.id)
  ])]

  let ingestResult = { ingested: 0, failed: 0, skipped: 0, results: [] }
  if (payload.runIngest !== false && queuedIds.length > 0) {
    ingestResult = await ingestFeedbackSources(pool, queuedIds, {
      limit: payload.ingestLimit || 5
    })
  }

  let finalStatus = 'staged_for_approval'
  if (ingestResult.ingested > 0 && ingestResult.failed === 0) {
    finalStatus = 'implemented'
  } else if (ingestResult.ingested > 0) {
    finalStatus = 'approved'
  }

  const feedback = await updateTaxgptFeedbackForOps(pool, feedbackId, staffUserId, {
    status: finalStatus,
    operatorNotes: payload.operatorNotes ?? actionResult.feedback.operatorNotes
  })

  return {
    feedback,
    discovered,
    queuedSources: actionResult.queuedSources,
    reprioritized,
    ingestResult
  }
}

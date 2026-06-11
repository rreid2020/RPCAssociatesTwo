const FEEDBACK_CATEGORIES = new Set([
  'feedback',
  'suggestion',
  'answer_quality',
  'corpus_gap'
])

const FEEDBACK_STATUSES = new Set([
  'submitted',
  'under_review',
  'staged_for_approval',
  'approved',
  'rejected',
  'implemented'
])

let feedbackTablesReady = false

export async function ensureTaxgptFeedbackTables (pool) {
  if (feedbackTablesReady) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS taxgpt.chat_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS taxgpt.feedback (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL,
      workspace_id uuid,
      category varchar(32) NOT NULL,
      subject text NOT NULL,
      message text NOT NULL,
      rating smallint,
      session_id uuid REFERENCES taxgpt.chat_sessions(id) ON DELETE SET NULL,
      status varchar(32) NOT NULL DEFAULT 'submitted',
      operator_notes text,
      staged_enhancement jsonb,
      training_signal jsonb,
      metadata jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS taxgpt_feedback_user_id_idx
    ON taxgpt.feedback (user_id, created_at DESC)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS taxgpt_feedback_status_idx
    ON taxgpt.feedback (status, created_at DESC)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS taxgpt_feedback_workspace_idx
    ON taxgpt.feedback (workspace_id, created_at DESC)
    WHERE workspace_id IS NOT NULL
  `)
  feedbackTablesReady = true
}

function assertCategory (category) {
  const value = String(category || '').trim().toLowerCase()
  if (!FEEDBACK_CATEGORIES.has(value)) {
    throw new Error('Invalid feedback category')
  }
  return value
}

function normalizeRating (rating) {
  if (rating === null || rating === undefined || rating === '') return null
  const value = Number(rating)
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error('Rating must be an integer between 1 and 5')
  }
  return value
}

async function assertSessionOwnership (pool, userId, sessionId) {
  if (!sessionId) return null
  const { rows } = await pool.query(
    `SELECT id FROM taxgpt.chat_sessions WHERE id = $1::uuid AND user_id = $2 LIMIT 1`,
    [sessionId, userId]
  )
  if (!rows[0]) {
    throw new Error('Chat session not found')
  }
  return sessionId
}

/**
 * Persist user feedback for operator review and future TaxGPT enhancement staging.
 * Feedback is not applied to model training automatically; it enters a review workflow.
 */
export async function submitTaxgptFeedback (pool, userId, payload = {}) {
  await ensureTaxgptFeedbackTables(pool)

  const category = assertCategory(payload.category)
  const subject = String(payload.subject || '').trim()
  const message = String(payload.message || '').trim()
  const rating = normalizeRating(payload.rating)
  const sessionId = await assertSessionOwnership(pool, userId, payload.sessionId || null)

  if (subject.length < 3 || subject.length > 200) {
    throw new Error('Subject must be between 3 and 200 characters')
  }
  if (message.length < 10 || message.length > 5000) {
    throw new Error('Message must be between 10 and 5000 characters')
  }

  const metadata = {
    sourcePage: payload.sourcePage || 'taxgpt_feedback',
    userAgent: payload.userAgent || null
  }

  const trainingSignal = {
    category,
    subject,
    enhancementIntent: category === 'suggestion' || category === 'corpus_gap'
      ? 'stage_for_operator_review'
      : 'quality_review',
    capturedAt: new Date().toISOString()
  }

  const { rows } = await pool.query(
    `INSERT INTO taxgpt.feedback (
      user_id,
      workspace_id,
      category,
      subject,
      message,
      rating,
      session_id,
      status,
      training_signal,
      metadata,
      created_at,
      updated_at
    )
    VALUES ($1, $2::uuid, $3, $4, $5, $6, $7::uuid, 'submitted', $8::jsonb, $9::jsonb, now(), now())
    RETURNING id, category, subject, message, rating, session_id AS "sessionId", status, created_at AS "createdAt"`,
    [
      userId,
      payload.workspaceId || null,
      category,
      subject,
      message,
      rating,
      sessionId,
      JSON.stringify(trainingSignal),
      JSON.stringify(metadata)
    ]
  )

  return rows[0]
}

export async function listUserTaxgptFeedback (pool, userId, options = {}) {
  await ensureTaxgptFeedbackTables(pool)
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50)

  const { rows } = await pool.query(
    `SELECT
      id,
      category,
      subject,
      message,
      rating,
      session_id AS "sessionId",
      status,
      created_at AS "createdAt"
    FROM taxgpt.feedback
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2`,
    [userId, limit]
  )

  return rows
}

export function getTaxgptFeedbackCategories () {
  return [
    { id: 'feedback', label: 'General feedback' },
    { id: 'suggestion', label: 'Feature suggestion' },
    { id: 'answer_quality', label: 'Answer quality issue' },
    { id: 'corpus_gap', label: 'Missing source or topic' }
  ]
}

export { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES }

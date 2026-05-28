function normalizeConversationTitle (input) {
  const trimmed = String(input || '').trim()
  if (!trimmed) return 'New TaxGPT Chat'
  return trimmed.slice(0, 120)
}

export async function listConversationsForUser (pool, userId, workspaceId = null) {
  const values = [userId]
  const workspaceClause = workspaceId
    ? (() => {
        values.push(workspaceId)
        return `AND s.workspace_id = $${values.length}::uuid`
      })()
    : ''
  const { rows } = await pool.query(
    `SELECT s.id,
            s.user_id,
            s.workspace_id,
            COALESCE(NULLIF(s.title, ''), 'New TaxGPT Chat') AS title,
            s.created_at,
            s.updated_at,
            s.last_message_at,
            COUNT(m.id)::int AS message_count
     FROM taxgpt.chat_sessions s
     LEFT JOIN taxgpt.chat_messages m ON m.session_id = s.id
     WHERE s.user_id = $1
       ${workspaceClause}
     GROUP BY s.id
     ORDER BY COALESCE(s.last_message_at, s.updated_at, s.created_at) DESC`,
    values
  )
  return rows
}

export async function createConversationForUser (pool, { userId, workspaceId = null, title = '' }) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.chat_sessions
      (user_id, workspace_id, title, last_message_at, created_at, updated_at)
     VALUES ($1, $2::uuid, $3, now(), now(), now())
     RETURNING id, user_id, workspace_id, title, created_at, updated_at, last_message_at`,
    [userId, workspaceId, normalizeConversationTitle(title)]
  )
  return rows[0] || null
}

export async function updateConversationTitleForUser (pool, { conversationId, userId, title }) {
  const { rows } = await pool.query(
    `UPDATE taxgpt.chat_sessions
     SET title = $3,
         updated_at = now()
     WHERE id = $1::uuid
       AND user_id = $2
     RETURNING id, user_id, workspace_id, title, created_at, updated_at, last_message_at`,
    [conversationId, userId, normalizeConversationTitle(title)]
  )
  return rows[0] || null
}

export async function deleteConversationForUser (pool, { conversationId, userId }) {
  const { rows } = await pool.query(
    `DELETE FROM taxgpt.chat_sessions
     WHERE id = $1::uuid
       AND user_id = $2
     RETURNING id`,
    [conversationId, userId]
  )
  return Boolean(rows[0])
}

export async function getConversationForUser (pool, { conversationId, userId }) {
  const { rows } = await pool.query(
    `SELECT id, user_id, workspace_id, title, created_at, updated_at, last_message_at
     FROM taxgpt.chat_sessions
     WHERE id = $1::uuid
       AND user_id = $2
     LIMIT 1`,
    [conversationId, userId]
  )
  return rows[0] || null
}

export async function listMessagesForConversation (pool, { conversationId, userId }) {
  const { rows } = await pool.query(
    `SELECT m.id,
            m.session_id AS conversation_id,
            m.role,
            m.content AS message_content,
            m.model_used,
            m.input_tokens,
            m.output_tokens,
            m.total_tokens,
            m.risk_level,
            m.created_at
     FROM taxgpt.chat_messages m
     INNER JOIN taxgpt.chat_sessions s ON s.id = m.session_id
     WHERE m.session_id = $1::uuid
       AND s.user_id = $2
     ORDER BY m.created_at ASC`,
    [conversationId, userId]
  )

  const messageIds = rows.map((row) => row.id)
  if (messageIds.length === 0) return []

  const { rows: citationRows } = await pool.query(
    `SELECT c.id,
            c.message_id,
            c.source_chunk_id,
            c.excerpt,
            c.confidence_score,
            c.source_type,
            c.source_title,
            c.section_reference,
            c.source_url,
            c.created_at
     FROM taxgpt.citations c
     WHERE c.message_id = ANY($1::uuid[])
     ORDER BY c.created_at ASC`,
    [messageIds]
  )

  const citationByMessageId = new Map()
  for (const citation of citationRows) {
    const key = citation.message_id
    if (!citationByMessageId.has(key)) citationByMessageId.set(key, [])
    citationByMessageId.get(key).push(citation)
  }

  return rows.map((row) => ({
    ...row,
    citations: citationByMessageId.get(row.id) || []
  }))
}

export async function insertConversationMessage (pool, payload) {
  const {
    conversationId,
    role,
    messageContent,
    modelUsed = null,
    inputTokens = null,
    outputTokens = null,
    totalTokens = null,
    riskLevel = null
  } = payload

  const { rows } = await pool.query(
    `INSERT INTO taxgpt.chat_messages
      (session_id, role, content, message_content, model_used, input_tokens, output_tokens, total_tokens, risk_level, created_at)
     VALUES ($1::uuid, $2, $3, $3, $4, $5, $6, $7, $8, now())
     RETURNING id, session_id, role, content, model_used, input_tokens, output_tokens, total_tokens, risk_level, created_at`,
    [conversationId, role, messageContent, modelUsed, inputTokens, outputTokens, totalTokens, riskLevel]
  )

  await pool.query(
    `UPDATE taxgpt.chat_sessions
     SET updated_at = now(),
         last_message_at = now()
     WHERE id = $1::uuid`,
    [conversationId]
  )

  return rows[0] || null
}

export async function insertMessageCitations (pool, { messageId, citations }) {
  if (!Array.isArray(citations) || citations.length === 0) return
  for (const citation of citations) {
    await pool.query(
      `INSERT INTO taxgpt.citations
        (message_id, source_chunk_id, excerpt, confidence_score, source_type, source_title, section_reference, source_url, created_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, now())`,
      [
        messageId,
        citation.sourceChunkId || null,
        citation.excerpt || '',
        citation.confidenceScore ?? null,
        citation.sourceType || null,
        citation.sourceTitle || null,
        citation.sectionReference || null,
        citation.sourceUrl || null
      ]
    )
  }
}

export async function insertFeedbackForMessage (pool, { userId, messageId, feedbackType, comments = null }) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.feedback
      (user_id, message_id, feedback_type, comments, created_at, updated_at)
     VALUES ($1, $2::uuid, $3, $4, now(), now())
     RETURNING id, user_id, message_id, feedback_type, comments, created_at`,
    [userId, messageId, feedbackType, comments]
  )
  return rows[0] || null
}

export async function insertRetrievalLog (pool, payload) {
  const {
    userId,
    conversationId = null,
    messageId = null,
    query,
    retrievedChunks = [],
    similarityScores = [],
    responseTimeMs = null,
    modelUsed = null
  } = payload

  await pool.query(
    `INSERT INTO taxgpt.retrieval_logs
      (user_id, conversation_id, message_id, query, retrieved_chunks, similarity_scores, response_time_ms, model_used, created_at)
     VALUES ($1, $2::uuid, $3::uuid, $4, $5::jsonb, $6::jsonb, $7, $8, now())`,
    [
      userId,
      conversationId,
      messageId,
      query,
      JSON.stringify(retrievedChunks),
      JSON.stringify(similarityScores),
      responseTimeMs,
      modelUsed
    ]
  )
}

export async function recordUsageMetric (pool, { userId, promptCount = 1, tokenUsage = 0, planType = 'FREE' }) {
  await pool.query(
    `INSERT INTO taxgpt.usage_tracking
      (user_id, prompt_count, token_usage, recorded_at, plan_type, date_bucket)
     VALUES ($1, $2, $3, now(), $4, CURRENT_DATE)`,
    [userId, promptCount, tokenUsage, planType]
  )
}

export async function getDailyUsageForUser (pool, userId) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(prompt_count), 0)::int AS prompt_count,
            COALESCE(SUM(token_usage), 0)::int AS token_usage
     FROM taxgpt.usage_tracking
     WHERE user_id = $1
       AND date_bucket = CURRENT_DATE`,
    [userId]
  )
  return {
    promptCount: Number(rows[0]?.prompt_count || 0),
    tokenUsage: Number(rows[0]?.token_usage || 0)
  }
}

export async function getMessageForUser (pool, { messageId, userId }) {
  const { rows } = await pool.query(
    `SELECT m.id,
            m.session_id,
            m.role,
            m.content,
            m.created_at
     FROM taxgpt.chat_messages m
     INNER JOIN taxgpt.chat_sessions s ON s.id = m.session_id
     WHERE m.id = $1::uuid
       AND s.user_id = $2
     LIMIT 1`,
    [messageId, userId]
  )
  return rows[0] || null
}

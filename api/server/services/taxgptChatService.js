import OpenAI from 'openai'

const HIGH_RISK_KEYWORDS = [
  'gaar',
  'general anti-avoidance rule',
  'aggressive tax planning',
  'tax avoidance',
  'tax evasion',
  'residency',
  'deemed resident',
  'treaty shopping',
  'offshore',
  'tax haven',
  'transfer pricing',
  'thin capitalization'
]

function redactPII (text) {
  let redacted = String(text || '')
  redacted = redacted.replace(/\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g, '[REDACTED: SIN]')
  redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED: Email]')
  redacted = redacted.replace(/\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g, '[REDACTED: Phone]')
  return redacted.trim()
}

function sanitizeInput (text) {
  return String(text || '')
    .replace(/ignore\s+(previous|all)\s+instructions/gi, '')
    .replace(/system\s*:\s*/gi, '')
    .replace(/assistant\s*:\s*/gi, '')
    .replace(/\n{4,}/g, '\n\n')
    .trim()
}

function detectHighRiskTopics (text) {
  const lower = String(text || '').toLowerCase()
  return HIGH_RISK_KEYWORDS.some((keyword) => lower.includes(keyword))
}

function getOpenAIClient () {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('TaxGPT is not configured. Set OPENAI_API_KEY on the API server.')
  }
  return new OpenAI({ apiKey })
}

function mapOpenAIError (error) {
  const status = error?.status || error?.response?.status
  const message = String(error?.message || error?.error?.message || '')
  if (status === 429 || message.includes('exceeded your current quota')) {
    return new Error(
      'OpenAI usage quota is exceeded. Add billing or credits at platform.openai.com, then try again.'
    )
  }
  if (status === 401 || message.toLowerCase().includes('incorrect api key')) {
    return new Error('OpenAI API key is invalid. Check OPENAI_API_KEY on the API server.')
  }
  if (status === 404 || message.includes('does not exist')) {
    return new Error(
      `OpenAI model is unavailable. Check OPENAI_MODEL on the API server (current: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}).`
    )
  }
  if (message) {
    return new Error(message)
  }
  return new Error('TaxGPT could not reach OpenAI. Please try again.')
}

async function ensureChatTables (pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS taxgpt.chat_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS taxgpt.chat_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id uuid NOT NULL REFERENCES taxgpt.chat_sessions(id) ON DELETE CASCADE,
      role varchar(20) NOT NULL,
      content text NOT NULL,
      citations jsonb,
      risk_level varchar(10),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx
    ON taxgpt.chat_messages (session_id)
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx
    ON taxgpt.chat_sessions (user_id)
  `)
}

const SYSTEM_PROMPT = `You are a helpful Canadian tax assistant. You provide informational guidance based on CRA (Canada Revenue Agency) concepts and common Canadian tax practice.

CRITICAL RULES:
1. Be clear when guidance is general and may depend on facts.
2. Never fabricate citations or legal references.
3. If a question needs professional judgment, recommend consulting a qualified tax professional.
4. Include a brief reminder that this is informational only, not legal or tax advice.
5. Focus on Canadian federal and provincial tax context when relevant.`

export async function handleTaxgptChat (pool, userId, payload = {}) {
  const message = sanitizeInput(redactPII(String(payload.message || '')))
  if (!message) {
    throw new Error('Message is required')
  }
  if (message.length > 10000) {
    throw new Error('Message is too long')
  }

  await ensureChatTables(pool)

  const openai = getOpenAIClient()
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  let sessionId = payload.sessionId || null

  if (sessionId) {
    const { rows } = await pool.query(
      `SELECT id FROM taxgpt.chat_sessions WHERE id = $1::uuid AND user_id = $2 LIMIT 1`,
      [sessionId, userId]
    )
    if (!rows[0]) {
      sessionId = null
    } else {
      await pool.query(
        `UPDATE taxgpt.chat_sessions SET updated_at = now() WHERE id = $1::uuid`,
        [sessionId]
      )
    }
  }

  if (!sessionId) {
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.chat_sessions (user_id, created_at, updated_at)
       VALUES ($1, now(), now())
       RETURNING id`,
      [userId]
    )
    sessionId = rows[0].id
  }

  await pool.query(
    `INSERT INTO taxgpt.chat_messages (session_id, role, content, created_at)
     VALUES ($1::uuid, 'user', $2, now())`,
    [sessionId, message]
  )

  const riskLevel = detectHighRiskTopics(message) ? 'high' : 'low'

  let completion
  try {
    completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    })
  } catch (error) {
    throw mapOpenAIError(error)
  }

  const response = completion.choices[0]?.message?.content ||
    'I apologize, but I could not generate a response.'

  await pool.query(
    `INSERT INTO taxgpt.chat_messages (session_id, role, content, citations, risk_level, created_at)
     VALUES ($1::uuid, 'assistant', $2, $3::jsonb, $4, now())`,
    [sessionId, response, JSON.stringify([]), riskLevel]
  )

  return {
    response,
    citations: [],
    sources: [],
    riskLevel,
    sessionId,
    reasoning: payload.agentic ? ['Analyzed the question using integrated TaxGPT chat.'] : undefined,
    actions: undefined
  }
}

export function getTaxgptStatus () {
  return {
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  }
}

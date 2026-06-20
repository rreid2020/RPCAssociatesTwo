import OpenAI from 'openai'
import { getTaxgptCorpusStats, getTaxgptCorpusStatsSnapshot, refreshTaxgptCorpusStatsInBackground } from './taxgptCorpusRepository.js'
import { buildTaxgptSources } from './taxgptPrompt.js'
import {
  annotateChunksWithBuckets,
  buildTaxgptStructuredSystemPrompt,
  buildTaxgptStructuredUserPrompt,
  parseTaxgptStructuredResponse
} from './taxgptStructuredResponse.js'
import { retrieveTaxgptChunks } from './taxgptRetrievalRepository.js'
import {
  formatRequestedFormsContext,
  resolveRequestedForms
} from './taxgptFormResolver.js'
import {
  formatRequestedPublicationsContext,
  resolveRequestedPublications
} from './taxgptPublicationResolver.js'
import { buildTaxgptFeedbackSuggestion } from './taxgptFeedbackSuggestion.js'
import { getTaxgptModelRoutingSummary, resolveTaxgptChatModel, buildTaxgptChatCompletionOptions } from './taxgptModelRouter.js'
import { normalizeTaxgptLanguage, taxgptLanguageLabel } from './taxgptSourceLanguage.js'
import { retrieveTaxgptStrategyWebSources } from './taxgptStrategyWebRetrieval.js'
import { retrieveTaxgptLegalWebSources } from './taxgptLegalWebRetrieval.js'

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
      structured_response jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  await pool.query(`
    ALTER TABLE taxgpt.chat_messages
    ADD COLUMN IF NOT EXISTS structured_response jsonb
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

async function resolveRetrievedChunks (pool, message, corpus, options = {}) {
  const topK = options.topK || 5
  const language = normalizeTaxgptLanguage(options.language)
  if (!corpus.retrievalReady) {
    return { chunks: [], mode: 'degraded', notice: 'CRA knowledge base is empty. Run TaxGPT ingestion to enable source-backed answers.' }
  }

  try {
    const chunks = await retrieveTaxgptChunks(pool, message, { topK, minSimilarity: 0.25, language })
    if (chunks.length > 0) {
      return { chunks, mode: 'rag', notice: null }
    }
    return {
      chunks: [],
      mode: 'degraded',
      notice: `No sufficiently relevant ${taxgptLanguageLabel(language)} CRA sources were found for this question. Try the other language or rephrase your question. The answer is general guidance only.`
    }
  } catch (error) {
    console.warn('[taxgpt] retrieval failed, falling back to degraded mode:', error)
    return {
      chunks: [],
      mode: 'degraded',
      notice: 'Source retrieval is temporarily unavailable. The answer is general guidance only.'
    }
  }
}

export async function getTaxgptCorpus (pool) {
  return getTaxgptCorpusStats(pool)
}

export async function handleTaxgptChat (pool, userId, payload = {}) {
  const message = sanitizeInput(redactPII(String(payload.message || '')))
  if (!message) {
    throw new Error('Message is required')
  }
  if (message.length > 10000) {
    throw new Error('Message is too long')
  }

  const language = normalizeTaxgptLanguage(payload.language)

  await ensureChatTables(pool)

  const openai = getOpenAIClient()
  const corpus = getTaxgptCorpusStatsSnapshot()
  refreshTaxgptCorpusStatsInBackground(pool)
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
  const requestedPublications = await resolveRequestedPublications(pool, message)
  const requestedForms = await resolveRequestedForms(pool, message)
  const retrieval = await resolveRetrievedChunks(pool, message, corpus, { topK: 10, language })
  const strategyWebRetrieval = riskLevel === 'high'
    ? { chunks: [], citations: [], skipped: true, reason: 'high_risk' }
    : await retrieveTaxgptStrategyWebSources(message, { language })
  const legalWebRetrieval = await retrieveTaxgptLegalWebSources(message, { language })
  const strategyWebChunks = strategyWebRetrieval.chunks
  const annotatedCraChunks = annotateChunksWithBuckets(retrieval.chunks)
  const annotatedLegalChunks = legalWebRetrieval.chunks.map((chunk) => ({
    ...chunk,
    citation: {
      ...chunk.citation,
      sourceBucket: chunk.sourceBucket || chunk.citation?.sourceBucket
    }
  }))
  const annotatedChunks = [...annotatedCraChunks, ...annotatedLegalChunks]
  const effectiveRetrievalMode = annotatedChunks.length > 0 ? 'rag' : retrieval.mode
  const resolvedModelPlan = resolveTaxgptChatModel({
    message,
    retrievalMode: effectiveRetrievalMode,
    riskLevel,
    chunks: annotatedChunks
  })
  const systemPrompt = buildTaxgptStructuredSystemPrompt(effectiveRetrievalMode, language)
  const promptOptions = {
    requestedPublicationsContext: formatRequestedPublicationsContext(requestedPublications),
    requestedFormsContext: formatRequestedFormsContext(requestedForms),
    strategyWebChunks
  }
  const userPrompt = effectiveRetrievalMode === 'rag'
    ? buildTaxgptStructuredUserPrompt(message, annotatedChunks, language, promptOptions)
    : buildTaxgptStructuredUserPrompt(message, [], language, promptOptions)

  let completion
  try {
    completion = await openai.chat.completions.create({
      model: resolvedModelPlan.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      ...buildTaxgptChatCompletionOptions({
        model: resolvedModelPlan.model,
        maxTokens: resolvedModelPlan.maxTokens,
        temperature: effectiveRetrievalMode === 'rag' ? 0.3 : 0.5,
        jsonResponse: true
      })
    })
  } catch (error) {
    throw mapOpenAIError(error)
  }

  const rawResponse = completion.choices[0]?.message?.content ||
    '{"directAnswer":"I apologize, but I could not generate a response.","sourceAnalysis":{"cra":[],"legislation":[],"caseLaw":[]},"complianceRisks":[],"taxTips":[],"taxStrategies":[],"filingDeadlines":[],"penaltiesAndInterest":[],"keyPoints":[],"whatThisMeansForYou":"","considerations":[],"suggestedNextSteps":[],"confidence":"low"}'

  const parsed = parseTaxgptStructuredResponse(rawResponse, annotatedChunks, effectiveRetrievalMode, strategyWebChunks)
  const response = parsed.plainText
  const citations = parsed.citations
  const structuredResponse = {
    ...parsed.structured,
    groupedSources: parsed.groupedSources
  }
  const feedbackSuggestion = buildTaxgptFeedbackSuggestion(message, {
    retrievalMode: effectiveRetrievalMode,
    retrievalNotice: retrieval.notice,
    requestedPublications,
    requestedForms,
    confidence: structuredResponse.confidence
  })
  const sources = effectiveRetrievalMode === 'rag'
    ? buildTaxgptSources(annotatedChunks)
    : []

  await pool.query(
    `INSERT INTO taxgpt.chat_messages (session_id, role, content, citations, risk_level, structured_response, created_at)
     VALUES ($1::uuid, 'assistant', $2, $3::jsonb, $4, $5::jsonb, now())`,
    [sessionId, response, JSON.stringify(citations), riskLevel, JSON.stringify(structuredResponse)]
  )

  return {
    response,
    structuredResponse,
    citations,
    strategyCitations: parsed.strategyCitations || [],
    sources,
    riskLevel,
    sessionId,
    retrievalMode: effectiveRetrievalMode,
    retrievalNotice: retrieval.notice,
    feedbackSuggestion,
    model: resolvedModelPlan.model,
    modelTier: resolvedModelPlan.tier,
    modelRoutingReason: resolvedModelPlan.reason,
    language,
    corpus: {
      retrievalReady: corpus.retrievalReady,
      embeddingCount: corpus.embeddingCount,
      ingestedSourceCount: corpus.ingestedSourceCount
    },
    reasoning: payload.agentic
      ? [
          effectiveRetrievalMode === 'rag'
            ? `Retrieved ${retrieval.chunks.length} CRA source chunks and ${legalWebRetrieval.chunks.length} federal/provincial legislation and case-law web sources for grounding.`
            : 'Answered without retrieved CRA source chunks.'
        ]
      : undefined,
    actions: undefined
  }
}

export function getTaxgptStatusFast () {
  const routing = getTaxgptModelRoutingSummary()
  return {
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: routing.models.standard,
    modelRouting: routing,
    embedModel: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small',
    corpus: getTaxgptCorpusStatsSnapshot()
  }
}

export async function getTaxgptStatus (pool) {
  refreshTaxgptCorpusStatsInBackground(pool)
  return getTaxgptStatusFast()
}

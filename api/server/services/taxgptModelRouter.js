const DEFAULT_FAST_MODEL = 'gpt-4o-mini'
const DEFAULT_STANDARD_MODEL = 'gpt-4o'
/** Reasoning-oriented model for GAAR, residency, avoidance, and multi-step tax analysis. */
const DEFAULT_COMPLEX_MODEL = 'o4-mini'

const COMPLEX_QUESTION_MIN_CHARS = 420
const SIMPLE_QUESTION_MAX_CHARS = 140

/**
 * @returns {string}
 */
function readEnvModel (keys, fallback) {
  for (const key of keys) {
    const value = String(process.env[key] || '').trim()
    if (value) return value
  }
  return fallback
}

/**
 * @returns {{ fast: string, standard: string, complex: string }}
 */
export function getTaxgptModelCatalog () {
  const global = String(process.env.OPENAI_MODEL || '').trim()
  return {
    fast: readEnvModel(['TAXGPT_OPENAI_MODEL_FAST'], global || DEFAULT_FAST_MODEL),
    standard: readEnvModel(
      ['TAXGPT_OPENAI_MODEL_STANDARD', 'TAXGPT_OPENAI_MODEL'],
      global || DEFAULT_STANDARD_MODEL
    ),
    complex: readEnvModel(['TAXGPT_OPENAI_MODEL_COMPLEX'], global || DEFAULT_COMPLEX_MODEL)
  }
}

/**
 * @param {string} message
 */
function countQuestionMarks (message) {
  return (String(message || '').match(/\?/g) || []).length
}

/**
 * @param {string} message
 */
function looksMultiPartQuestion (message) {
  const text = String(message || '')
  if (countQuestionMarks(text) > 1) return true
  return /\b(and also|additionally|furthermore|as well as|another question)\b/i.test(text)
}

/**
 * @param {Array<{ similarity?: number }>} chunks
 */
function averageSimilarity (chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) return 0
  const total = chunks.reduce((sum, chunk) => sum + (Number(chunk.similarity) || 0), 0)
  return total / chunks.length
}

/**
 * Route TaxGPT chat completion to the best model tier for the situation.
 *
 * @param {{
 *   message: string
 *   retrievalMode: 'rag' | 'degraded'
 *   riskLevel: 'high' | 'low'
 *   chunks?: Array<{ similarity?: number }>
 * }}
 */
export function resolveTaxgptChatModel (input) {
  const catalog = getTaxgptModelCatalog()
  const message = String(input.message || '')
  const retrievalMode = input.retrievalMode === 'degraded' ? 'degraded' : 'rag'
  const riskLevel = input.riskLevel === 'high' ? 'high' : 'low'
  const chunks = Array.isArray(input.chunks) ? input.chunks : []
  const chunkCount = chunks.length
  const avgSimilarity = averageSimilarity(chunks)
  const messageLength = message.length
  const multiPart = looksMultiPartQuestion(message)

  if (riskLevel === 'high') {
    return {
      model: catalog.complex,
      tier: 'complex',
      maxTokens: 6000,
      topK: 10,
      reason: 'high_risk_topic'
    }
  }

  if (retrievalMode === 'degraded') {
    return {
      model: catalog.standard,
      tier: 'standard',
      maxTokens: 4096,
      topK: 0,
      reason: 'degraded_mode'
    }
  }

  if (multiPart || messageLength >= COMPLEX_QUESTION_MIN_CHARS || chunkCount >= 6) {
    return {
      model: catalog.standard,
      tier: 'standard',
      maxTokens: 6000,
      topK: 10,
      reason: 'detailed_question'
    }
  }

  if (chunkCount >= 4 || avgSimilarity < 0.42) {
    return {
      model: catalog.standard,
      tier: 'standard',
      maxTokens: 5000,
      topK: 8,
      reason: 'multi_source_or_low_similarity'
    }
  }

  if (messageLength <= SIMPLE_QUESTION_MAX_CHARS && chunkCount >= 2 && avgSimilarity >= 0.5) {
    return {
      model: catalog.fast,
      tier: 'fast',
      maxTokens: 3000,
      topK: 5,
      reason: 'simple_factual_rag'
    }
  }

  return {
    model: catalog.standard,
    tier: 'standard',
    maxTokens: 5000,
    topK: 8,
    reason: 'default_rag'
  }
}

/**
 * @returns {{
 *   routing: 'multi_tier'
 *   models: { fast: string, standard: string, complex: string }
 *   defaults: { fast: string, standard: string, complex: string }
 * }}
 */
export function getTaxgptModelRoutingSummary () {
  const catalog = getTaxgptModelCatalog()
  return {
    routing: 'multi_tier',
    models: catalog,
    defaults: {
      fast: DEFAULT_FAST_MODEL,
      standard: DEFAULT_STANDARD_MODEL,
      complex: DEFAULT_COMPLEX_MODEL
    }
  }
}

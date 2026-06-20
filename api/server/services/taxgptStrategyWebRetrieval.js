import { extractMainContentHtml, cleanWebExcerpt } from './taxgptWebExcerpt.js'
import dns from 'node:dns/promises'
import net from 'node:net'

const ALLOWED_TAVILY_PURPOSES = new Set(['legislation', 'case_law', 'strategy'])

const PLANNING_KEYWORDS = [
  'tax strateg',
  'tax plan',
  'income split',
  'salary',
  'dividend',
  'incorporat',
  'rrsp',
  'tfsa',
  'fhsa',
  'capital gain',
  'lifetime capital',
  'lcge',
  'estate',
  'succession',
  'holdco',
  'holding compan',
  'rental propert',
  'tax-loss',
  'loss selling',
  'stock option',
  'equity comp',
  'pension plan',
  'ipp',
  'charitable',
  'donation',
  'registered account',
  'family trust',
  'prescribed rate',
  'home office',
  'work from home',
  'self-employed',
  'self employed',
  'minimize tax',
  'reduce tax',
  'structure',
  'planning consideration'
]

const HIGH_RISK_STRATEGY_KEYWORDS = [
  'gaar',
  'general anti-avoidance rule',
  'aggressive tax planning',
  'tax avoidance',
  'tax evasion',
  'treaty shopping',
  'offshore',
  'tax haven',
  'transfer pricing',
  'thin capitalization'
]

const FETCH_TIMEOUT_MS = 12_000
const MAX_FETCH_BYTES = 500_000
export const MAX_EXCERPT_CHARS = 1_200
const MAX_RESULTS = 6

export function normalizeWhitespace (text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function stripHtmlToText (html) {
  let text = String(html || '')
  text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
  text = text.replace(/<header[\s\S]*?<\/header>/gi, ' ')
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const value = Number(code)
      return Number.isFinite(value) ? String.fromCharCode(value) : ''
    })
    .replace(/&ccedil;/gi, 'ç')
  return normalizeWhitespace(text)
}

export function publisherFromUrl (url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, '')
    const parts = hostname.split('.')
    if (parts.length >= 2) {
      const label = parts[parts.length - 2]
      return label.charAt(0).toUpperCase() + label.slice(1)
    }
    return hostname
  } catch {
    return 'Web source'
  }
}

function isPrivateIp (ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    if (a === 10) return true
    if (a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 0) return true
    return false
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase()
    if (normalized === '::1') return true
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true
    if (normalized.startsWith('fe80')) return true
  }
  return false
}

async function assertPublicHttpUrl (rawUrl) {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('Invalid URL')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Unsupported URL protocol')
  }

  const hostname = parsed.hostname.toLowerCase()
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  ) {
    throw new Error('Blocked hostname')
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error('Blocked private IP')
    return parsed.toString()
  }

  const records = await dns.lookup(hostname, { all: true, verbatim: true })
  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new Error('Blocked private resolved IP')
    }
  }

  return parsed.toString()
}

/**
 * @param {string} message
 */
export function detectTaxPlanningIntent (message) {
  const lower = String(message || '').toLowerCase()
  return PLANNING_KEYWORDS.some((keyword) => lower.includes(keyword))
}

/**
 * @param {string} message
 */
export function shouldSuppressStrategyWebRetrieval (message) {
  const lower = String(message || '').toLowerCase()
  return HIGH_RISK_STRATEGY_KEYWORDS.some((keyword) => lower.includes(keyword))
}

/**
 * @param {string} url
 * @param {AbortSignal} signal
 */
export async function fetchPageExcerpt (url, signal) {
  const safeUrl = await assertPublicHttpUrl(url)
  const response = await fetch(safeUrl, {
    signal,
    headers: {
      'User-Agent': 'RPCAssociates-TaxGPT/1.0 (+https://rpcassociates.co)',
      Accept: 'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.8,*/*;q=0.5'
    },
    redirect: 'follow'
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const contentType = String(response.headers.get('content-type') || '').toLowerCase()
  if (contentType && !contentType.includes('text/html') && !contentType.includes('text/plain')) {
    throw new Error('Unsupported content type')
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('Empty response body')

  let received = 0
  const chunks = []
  while (received < MAX_FETCH_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    chunks.push(value)
    if (received >= MAX_FETCH_BYTES) break
  }

  const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))
  const html = buffer.toString('utf8')
  const text = stripHtmlToText(extractMainContentHtml(html))
  if (!text || text.length < 80) {
    throw new Error('Insufficient page text')
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = normalizeWhitespace(titleMatch?.[1] || publisherFromUrl(safeUrl))
  const cleaned = cleanWebExcerpt(text, MAX_EXCERPT_CHARS)
  if (!cleaned || cleaned.length < 80) {
    throw new Error('Page content is navigation boilerplate')
  }
  const excerpt = cleaned

  return {
    url: safeUrl,
    title: title || publisherFromUrl(safeUrl),
    publisher: publisherFromUrl(safeUrl),
    excerpt,
    fetchedAt: new Date().toISOString()
  }
}

/**
 * @param {string} query
 * @param {{ includeDomains?: string[], maxResults?: number }} [options]
 */
export async function searchWithTavily (query, options = {}) {
  const purpose = String(options.purpose || '').trim()
  if (!ALLOWED_TAVILY_PURPOSES.has(purpose)) {
    throw new Error(
      `Tavily search blocked: purpose must be one of ${[...ALLOWED_TAVILY_PURPOSES].join(', ')}`
    )
  }

  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return null

  const includeDomains = Array.isArray(options.includeDomains)
    ? options.includeDomains.filter(Boolean)
    : []
  const maxResults = Number(options.maxResults) > 0 ? Number(options.maxResults) : MAX_RESULTS

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: maxResults,
      include_answer: false,
      ...(includeDomains.length > 0 ? { include_domains: includeDomains } : {})
    })
  })

  if (!response.ok) {
    throw new Error(`Tavily search failed: HTTP ${response.status}`)
  }

  const data = await response.json()
  const results = Array.isArray(data?.results) ? data.results : []
  return results
    .map((item) => ({
      url: String(item.url || '').trim(),
      title: String(item.title || '').trim(),
      snippet: String(item.content || item.snippet || '').trim()
    }))
    .filter((item) => item.url)
}

/**
 * @param {string} query
 */
async function searchWithSerper (query) {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return null

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey
    },
    body: JSON.stringify({
      q: query,
      num: MAX_RESULTS
    })
  })

  if (!response.ok) {
    throw new Error(`Serper search failed: HTTP ${response.status}`)
  }

  const data = await response.json()
  const organic = Array.isArray(data?.organic) ? data.organic : []
  return organic
    .map((item) => ({
      url: String(item.link || '').trim(),
      title: String(item.title || '').trim(),
      snippet: String(item.snippet || '').trim()
    }))
    .filter((item) => item.url)
}

/**
 * Strategy-only web search. Tavily is preferred; Serper is an optional fallback.
 * @param {string} query
 */
async function searchWeb (query) {
  const tavily = await searchWithTavily(query, {
    purpose: 'strategy',
    maxResults: MAX_RESULTS
  }).catch((error) => {
    console.warn('[taxgpt] Tavily search failed:', error.message)
    return null
  })
  if (tavily && tavily.length > 0) return tavily

  const serper = await searchWithSerper(query).catch((error) => {
    console.warn('[taxgpt] Serper search failed:', error.message)
    return null
  })
  if (serper && serper.length > 0) return serper

  return []
}

/**
 * @param {string} message
 * @param {{ language?: 'en' | 'fr' }} [options]
 */
export async function retrieveTaxgptStrategyWebSources (message, options = {}) {
  if (!detectTaxPlanningIntent(message) || shouldSuppressStrategyWebRetrieval(message)) {
    return { chunks: [], citations: [], skipped: true, reason: 'not_applicable' }
  }

  if (!process.env.TAVILY_API_KEY && !process.env.SERPER_API_KEY) {
    return { chunks: [], citations: [], skipped: true, reason: 'not_configured' }
  }

  const language = options.language === 'fr' ? 'fr' : 'en'
  const localeHint = language === 'fr' ? 'Canada impôt planification' : 'Canadian tax planning strategies'
  const query = `${localeHint}: ${String(message || '').slice(0, 240)}`

  const searchResults = await searchWeb(query)
  if (searchResults.length === 0) {
    return { chunks: [], citations: [], skipped: true, reason: 'no_results' }
  }

  const chunks = []
  const seenUrls = new Set()

  for (const result of searchResults) {
    if (chunks.length >= MAX_RESULTS) break
    if (!result.url || seenUrls.has(result.url)) continue
    seenUrls.add(result.url)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const page = await fetchPageExcerpt(result.url, controller.signal)
      chunks.push({
        content: page.excerpt || result.snippet,
        citation: {
          sourceTitle: page.title || result.title || page.publisher,
          sourceUrl: page.url,
          publisher: page.publisher
        },
        publisher: page.publisher,
        fetchedAt: page.fetchedAt
      })
    } catch (error) {
      const snippet = normalizeWhitespace(result.snippet)
      if (snippet.length >= 80) {
        chunks.push({
          content: snippet.length > MAX_EXCERPT_CHARS
            ? `${snippet.slice(0, MAX_EXCERPT_CHARS).trim()}…`
            : snippet,
          citation: {
            sourceTitle: result.title || publisherFromUrl(result.url),
            sourceUrl: result.url,
            publisher: publisherFromUrl(result.url)
          },
          publisher: publisherFromUrl(result.url),
          fetchedAt: new Date().toISOString()
        })
      } else {
        console.warn('[taxgpt] strategy web fetch skipped:', result.url, error.message)
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  const citations = chunks.map((chunk, index) => ({
    citationIndex: index + 1,
    sourceTitle: chunk.citation.sourceTitle,
    sourceUrl: chunk.citation.sourceUrl,
    publisher: chunk.publisher,
    excerpt: chunk.content,
    sourceBucket: 'web'
  }))

  return {
    chunks,
    citations,
    skipped: chunks.length === 0,
    reason: chunks.length === 0 ? 'fetch_failed' : null
  }
}

export { FETCH_TIMEOUT_MS }

import {
  FETCH_TIMEOUT_MS,
  MAX_EXCERPT_CHARS,
  fetchPageExcerpt,
  publisherFromUrl,
  searchWithTavily
} from './taxgptStrategyWebRetrieval.js'
import {
  cleanWebExcerpt,
  isGovNavigationBoilerplate,
  isLegislationStatuteUrl
} from './taxgptWebExcerpt.js'
import {
  inferLegalSearchContext,
  isFederalTaxCaseLawUrl,
  isRelevantTaxLegalSource
} from './taxgptLegalRelevance.js'

const MAX_RESULTS_PER_SEARCH = 2
const MAX_TOTAL_PER_BUCKET = 5
const MAX_PROVINCES_TO_SEARCH = 2

const LEGAL_RESEARCH_KEYWORDS = [
  'legislation',
  'statute',
  'regulation',
  'regulations',
  'income tax act',
  'tax act',
  ' ita ',
  ' i.t.a',
  'case law',
  'caselaw',
  'court decision',
  'court ruling',
  'precedent',
  'canlii',
  'tax court',
  'federal court',
  'court of appeal',
  'supreme court',
  'held that',
  'judgment',
  'decision in',
  'ruling in',
  'subsection',
  'paragraph',
  'loi de l\'impôt',
  'législation',
  'jurisprudence',
  'statutory',
  'enacted',
  'provision of the act',
  'general anti-avoidance',
  ' gaar',
  'under the act',
  'in the act',
  'pursuant to',
  'provincial tax act',
  'provincial act',
  'interpretation of section',
  'section of the act'
]

const LEGAL_RESEARCH_PATTERNS = [
  /\b(s\.|section|subs?\.|subparagraph|paragraph|par\.)\s*\d/i,
  /\b\d+\(\d+(?:\.\d+)?\)(?:\(\w\))?/,
  /\bv\.?\s+(?:the\s+)?(?:queen|crown|canada|m\.?n\.?r\.?|minister)/i
]

const MIN_LEGAL_EXCERPT_CHARS = 40

const FEDERAL_LEGISLATION_DOMAINS = [
  'laws-lois.justice.gc.ca',
  'canlii.org',
  'canlii.ca'
]

/** Federal tax courts only — no provincial general courts (family/civil PDFs). */
const FEDERAL_CASE_LAW_DOMAINS = [
  'canlii.org',
  'canlii.ca',
  'decisions.fct-cf.gc.ca',
  'decisions.fca-caf.gc.ca',
  'taxcourt.gc.ca',
  'scc-csc.lexum.com'
]

/** @type {Array<{ code: string, name: string, nameFr: string, patterns: RegExp[], legislationDomains: string[], caseLawDomains: string[] }>} */
const PROVINCE_LEGAL_PROFILES = [
  {
    code: 'ON',
    name: 'Ontario',
    nameFr: 'Ontario',
    patterns: [/\bontario\b/i, /\bON\b(?=[\s,;.]|$)/],
    legislationDomains: ['e-laws.gov.on.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca', 'ontariocourts.ca']
  },
  {
    code: 'QC',
    name: 'Quebec',
    nameFr: 'Québec',
    patterns: [/\bquebec\b/i, /\bquébec\b/i, /\bQC\b(?=[\s,;.]|$)/],
    legislationDomains: ['legisquebec.gouv.qc.ca', 'publicationsduquebec.gouv.qc.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca', 'tribunaux.qc.ca']
  },
  {
    code: 'BC',
    name: 'British Columbia',
    nameFr: 'Colombie-Britannique',
    patterns: [/\bbritish columbia\b/i, /\bBC\b(?=[\s,;.]|$)/],
    legislationDomains: ['bclaws.gov.bc.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca', 'bccourts.ca']
  },
  {
    code: 'AB',
    name: 'Alberta',
    nameFr: 'Alberta',
    patterns: [/\balberta\b/i, /\bAB\b(?=[\s,;.]|$)/],
    legislationDomains: ['qp.alberta.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca', 'albertacourts.ca']
  },
  {
    code: 'SK',
    name: 'Saskatchewan',
    nameFr: 'Saskatchewan',
    patterns: [/\bsaskatchewan\b/i, /\bSK\b(?=[\s,;.]|$)/],
    legislationDomains: ['publications.saskatchewan.ca', 'laws_regs.gov.sk.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'MB',
    name: 'Manitoba',
    nameFr: 'Manitoba',
    patterns: [/\bmanitoba\b/i, /\bMB\b(?=[\s,;.]|$)/],
    legislationDomains: ['web2.gov.mb.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'NS',
    name: 'Nova Scotia',
    nameFr: 'Nouvelle-Écosse',
    patterns: [/\bnova scotia\b/i, /\bNS\b(?=[\s,;.]|$)/],
    legislationDomains: ['nslegislature.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'NB',
    name: 'New Brunswick',
    nameFr: 'Nouveau-Brunswick',
    patterns: [/\bnew brunswick\b/i, /\bNB\b(?=[\s,;.]|$)/],
    legislationDomains: ['laws.gnb.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'NL',
    name: 'Newfoundland and Labrador',
    nameFr: 'Terre-Neuve-et-Labrador',
    patterns: [/\bnewfoundland\b/i, /\blabrador\b/i, /\bNL\b(?=[\s,;.]|$)/],
    legislationDomains: ['assembly.nl.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'PE',
    name: 'Prince Edward Island',
    nameFr: 'Île-du-Prince-Édouard',
    patterns: [/\bprince edward island\b/i, /\bPEI\b/i, /\bPE\b(?=[\s,;.]|$)/],
    legislationDomains: ['assembly.pe.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'YT',
    name: 'Yukon',
    nameFr: 'Yukon',
    patterns: [/\byukon\b/i, /\bYT\b(?=[\s,;.]|$)/],
    legislationDomains: ['legislation.yukon.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'NT',
    name: 'Northwest Territories',
    nameFr: 'Territoires du Nord-Ouest',
    patterns: [/\bnorthwest territories\b/i, /\bNWT\b/i, /\bNT\b(?=[\s,;.]|$)/],
    legislationDomains: ['justice.gov.nt.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'NU',
    name: 'Nunavut',
    nameFr: 'Nunavut',
    patterns: [/\bnunavut\b/i, /\bNU\b(?=[\s,;.]|$)/],
    legislationDomains: ['assembly.nu.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  }
]

const ALL_PROVINCIAL_LEGISLATION_DOMAINS = [...new Set(
  PROVINCE_LEGAL_PROFILES.flatMap((profile) => profile.legislationDomains)
)]

/**
 * @param {string} message
 */
export function detectProvincesFromMessage (message) {
  const text = String(message || '')
  const found = []
  for (const profile of PROVINCE_LEGAL_PROFILES) {
    if (profile.patterns.some((pattern) => pattern.test(text))) {
      found.push(profile)
    }
  }
  return found.slice(0, MAX_PROVINCES_TO_SEARCH)
}

/**
 * @param {string} message
 * @param {'en' | 'fr'} language
 */
function buildFederalLegislationQuery (message, language) {
  const context = inferLegalSearchContext(message, language)
  return context.legislationQuery
}

/**
 * @param {string} message
 * @param {'en' | 'fr'} language
 * @param {{ name: string, nameFr: string }} [province]
 */
function buildProvincialLegislationQuery (message, language, province = null) {
  const context = inferLegalSearchContext(message, language)
  if (province) {
    const provinceName = language === 'fr' ? province.nameFr : province.name
    return `${provinceName} ${context.legislationQuery}`
  }
  return context.legislationQuery
}

/**
 * @param {string} message
 * @param {'en' | 'fr'} language
 * @param {{ name: string, nameFr: string }} [province]
 */
function buildFederalCaseLawQuery (message, language, province = null) {
  const context = inferLegalSearchContext(message, language)
  if (province) {
    const provinceName = language === 'fr' ? province.nameFr : province.name
    return `${provinceName} ${context.caseLawQuery}`
  }
  return context.caseLawQuery
}

/**
 * @param {string} message
 */
export function detectLegalWebResearchIntent (message) {
  const text = String(message || '')
  const lower = text.toLowerCase()
  if (LEGAL_RESEARCH_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return true
  }
  if (LEGAL_RESEARCH_PATTERNS.some((pattern) => pattern.test(text))) {
    return true
  }
  if (detectProvincesFromMessage(text).length > 0) {
    return /\b(provincial|province|act|legislation|statute|regulation)\b/i.test(text)
  }
  return false
}

/**
 * @param {string} query
 * @param {string[]} includeDomains
 * @param {'legislation' | 'case_law'} purpose
 */
async function searchLegalWeb (query, includeDomains, purpose) {
  const tavily = await searchWithTavily(query, {
    includeDomains,
    maxResults: MAX_RESULTS_PER_SEARCH,
    purpose
  }).catch((error) => {
    console.warn('[taxgpt] Tavily legal search failed:', error.message)
    return null
  })
  return tavily || []
}

/**
 * @param {string} url
 * @param {'legislation' | 'case_law'} bucket
 * @param {string} [title]
 */
function isValidLegalSourceUrl (url, bucket, title = '') {
  if (bucket === 'legislation') return isLegislationStatuteUrl(url)
  if (bucket === 'case_law') return isFederalTaxCaseLawUrl(url, title)
  return false
}

/**
 * @param {{ excerpt?: string } | null} page
 * @param {{ snippet?: string }} result
 */
function resolveLegalExcerpt (page, result) {
  const pageExcerpt = cleanWebExcerpt(page?.excerpt || '', MAX_EXCERPT_CHARS)
  if (pageExcerpt.length >= MIN_LEGAL_EXCERPT_CHARS && !isGovNavigationBoilerplate(pageExcerpt)) {
    return pageExcerpt
  }

  const snippetExcerpt = cleanWebExcerpt(result.snippet || '', MAX_EXCERPT_CHARS)
  if (snippetExcerpt.length >= MIN_LEGAL_EXCERPT_CHARS && !isGovNavigationBoilerplate(snippetExcerpt)) {
    return snippetExcerpt
  }

  return ''
}

/**
 * @param {Array<{ url: string, title: string, snippet: string }>} results
 * @param {'legislation' | 'case_law'} bucket
 * @param {Set<string>} seenUrls
 * @param {number} maxResults
 */
async function buildChunksFromSearchResults (results, bucket, seenUrls, maxResults) {
  const chunks = []

  for (const result of results) {
    if (chunks.length >= maxResults) break
    if (!result.url || seenUrls.has(result.url)) continue
    if (!isValidLegalSourceUrl(result.url, bucket, result.title)) continue
    if (!isRelevantTaxLegalSource({
      url: result.url,
      title: result.title,
      snippet: result.snippet,
      bucket
    })) continue
    seenUrls.add(result.url)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let page = null
    try {
      page = await fetchPageExcerpt(result.url, controller.signal)
    } catch (error) {
      console.warn('[taxgpt] legal web fetch skipped:', result.url, error.message)
    } finally {
      clearTimeout(timeout)
    }

    const excerpt = resolveLegalExcerpt(page, result)
    if (!excerpt) continue
    if (!isRelevantTaxLegalSource({
      url: result.url,
      title: page?.title || result.title,
      excerpt,
      snippet: result.snippet,
      bucket
    })) continue

    chunks.push({
      content: excerpt,
      citation: {
        sourceTitle: page?.title || result.title || publisherFromUrl(result.url),
        sourceUrl: page?.url || result.url,
        sourceBucket: bucket
      },
      sourceBucket: bucket,
      sourceCategory: bucket,
      retrievalMethod: 'tavily_web',
      publisher: page?.publisher || publisherFromUrl(result.url),
      fetchedAt: page?.fetchedAt || new Date().toISOString()
    })
  }

  return chunks
}

/**
 * @param {Array<Promise<Array<{ url: string, title: string, snippet: string }>>>} searchPromises
 * @param {'legislation' | 'case_law'} bucket
 * @param {Set<string>} seenUrls
 */
async function collectBucketChunks (searchPromises, bucket, seenUrls) {
  const chunks = []
  const resultsBySearch = await Promise.all(searchPromises)

  for (const results of resultsBySearch) {
    if (chunks.length >= MAX_TOTAL_PER_BUCKET) break
    const nextChunks = await buildChunksFromSearchResults(
      results,
      bucket,
      seenUrls,
      MAX_TOTAL_PER_BUCKET - chunks.length
    )
    chunks.push(...nextChunks)
  }

  return chunks
}

/**
 * Retrieve federal and provincial legislation and case law via Tavily web search.
 *
 * @param {string} message
 * @param {{ language?: 'en' | 'fr' }} [options]
 */
export async function retrieveTaxgptLegalWebSources (message, options = {}) {
  if (!process.env.TAVILY_API_KEY) {
    return {
      chunks: [],
      legislationChunks: [],
      caseLawChunks: [],
      skipped: true,
      reason: 'not_configured'
    }
  }

  const language = options.language === 'fr' ? 'fr' : 'en'
  const provinces = detectProvincesFromMessage(message)
  const seenUrls = new Set()

  const legislationSearches = [
    searchLegalWeb(buildFederalLegislationQuery(message, language), FEDERAL_LEGISLATION_DOMAINS, 'legislation')
  ]
  const caseLawSearches = [
    searchLegalWeb(buildFederalCaseLawQuery(message, language), FEDERAL_CASE_LAW_DOMAINS, 'case_law')
  ]

  if (provinces.length > 0) {
    for (const province of provinces) {
      legislationSearches.push(
        searchLegalWeb(
          buildProvincialLegislationQuery(message, language, province),
          province.legislationDomains,
          'legislation'
        )
      )
      caseLawSearches.push(
        searchLegalWeb(
          buildFederalCaseLawQuery(message, language, province),
          FEDERAL_CASE_LAW_DOMAINS,
          'case_law'
        )
      )
    }
  } else {
    legislationSearches.push(
      searchLegalWeb(
        buildProvincialLegislationQuery(message, language),
        ALL_PROVINCIAL_LEGISLATION_DOMAINS,
        'legislation'
      )
    )
  }

  const [legislationChunks, caseLawChunks] = await Promise.all([
    collectBucketChunks(legislationSearches, 'legislation', seenUrls),
    collectBucketChunks(caseLawSearches, 'case_law', seenUrls)
  ])

  const chunks = [...legislationChunks, ...caseLawChunks]

  return {
    chunks,
    legislationChunks,
    caseLawChunks,
    provinces: provinces.map((province) => province.code),
    skipped: chunks.length === 0,
    reason: chunks.length === 0 ? 'no_results' : null
  }
}

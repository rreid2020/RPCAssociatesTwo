import {
  FETCH_TIMEOUT_MS,
  MAX_EXCERPT_CHARS,
  fetchPageExcerpt,
  normalizeWhitespace,
  publisherFromUrl,
  searchWithTavily
} from './taxgptStrategyWebRetrieval.js'

const MAX_RESULTS_PER_SEARCH = 2
const MAX_TOTAL_PER_BUCKET = 5
const MAX_PROVINCES_TO_SEARCH = 2

const FEDERAL_LEGISLATION_DOMAINS = [
  'laws-lois.justice.gc.ca',
  'justice.gc.ca',
  'canada.ca'
]

const FEDERAL_CASE_LAW_DOMAINS = [
  'canlii.org',
  'canlii.ca',
  'decisions.fct-cf.gc.ca',
  'decisions.fca-caf.gc.ca',
  'scc-csc.lexum.com'
]

/** @type {Array<{ code: string, name: string, nameFr: string, patterns: RegExp[], legislationDomains: string[], caseLawDomains: string[] }>} */
const PROVINCE_LEGAL_PROFILES = [
  {
    code: 'ON',
    name: 'Ontario',
    nameFr: 'Ontario',
    patterns: [/\bontario\b/i, /\bON\b(?=[\s,;.]|$)/],
    legislationDomains: ['e-laws.gov.on.ca', 'ontario.ca'],
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
    legislationDomains: ['bclaws.gov.bc.ca', 'gov.bc.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca', 'bccourts.ca']
  },
  {
    code: 'AB',
    name: 'Alberta',
    nameFr: 'Alberta',
    patterns: [/\balberta\b/i, /\bAB\b(?=[\s,;.]|$)/],
    legislationDomains: ['qp.alberta.ca', 'alberta.ca'],
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
    legislationDomains: ['web2.gov.mb.ca', 'gov.mb.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'NS',
    name: 'Nova Scotia',
    nameFr: 'Nouvelle-Écosse',
    patterns: [/\bnova scotia\b/i, /\bNS\b(?=[\s,;.]|$)/],
    legislationDomains: ['nslegislature.ca', 'novascotia.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'NB',
    name: 'New Brunswick',
    nameFr: 'Nouveau-Brunswick',
    patterns: [/\bnew brunswick\b/i, /\bNB\b(?=[\s,;.]|$)/],
    legislationDomains: ['gnb.ca', 'laws.gnb.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'NL',
    name: 'Newfoundland and Labrador',
    nameFr: 'Terre-Neuve-et-Labrador',
    patterns: [/\bnewfoundland\b/i, /\blabrador\b/i, /\bNL\b(?=[\s,;.]|$)/],
    legislationDomains: ['assembly.nl.ca', 'gov.nl.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'PE',
    name: 'Prince Edward Island',
    nameFr: 'Île-du-Prince-Édouard',
    patterns: [/\bprince edward island\b/i, /\bPEI\b/i, /\bPE\b(?=[\s,;.]|$)/],
    legislationDomains: ['princeedwardisland.ca', 'assembly.pe.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'YT',
    name: 'Yukon',
    nameFr: 'Yukon',
    patterns: [/\byukon\b/i, /\bYT\b(?=[\s,;.]|$)/],
    legislationDomains: ['gov.yk.ca', 'legislation.yukon.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'NT',
    name: 'Northwest Territories',
    nameFr: 'Territoires du Nord-Ouest',
    patterns: [/\bnorthwest territories\b/i, /\bNWT\b/i, /\bNT\b(?=[\s,;.]|$)/],
    legislationDomains: ['justice.gov.nt.ca', 'gov.nt.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  },
  {
    code: 'NU',
    name: 'Nunavut',
    nameFr: 'Nunavut',
    patterns: [/\bnunavut\b/i, /\bNU\b(?=[\s,;.]|$)/],
    legislationDomains: ['nunavut.ca', 'assembly.nu.ca'],
    caseLawDomains: ['canlii.org', 'canlii.ca']
  }
]

const ALL_PROVINCIAL_LEGISLATION_DOMAINS = [...new Set(
  PROVINCE_LEGAL_PROFILES.flatMap((profile) => profile.legislationDomains)
)]

const ALL_PROVINCIAL_CASE_LAW_DOMAINS = [...new Set(
  PROVINCE_LEGAL_PROFILES.flatMap((profile) => profile.caseLawDomains)
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
  const topic = String(message || '').slice(0, 200)
  if (language === 'fr') {
    return `Canada loi impôt sur le revenu fédérale législation ${topic}`
  }
  return `Canada federal Income Tax Act legislation statute section ${topic}`
}

/**
 * @param {string} message
 * @param {'en' | 'fr'} language
 * @param {{ name: string, nameFr: string }} [province]
 */
function buildProvincialLegislationQuery (message, language, province = null) {
  const topic = String(message || '').slice(0, 180)
  if (province) {
    const provinceName = language === 'fr' ? province.nameFr : province.name
    if (language === 'fr') {
      return `${provinceName} loi impôt provincial législation ${topic}`
    }
    return `${provinceName} provincial income tax act legislation statute ${topic}`
  }
  if (language === 'fr') {
    return `Canada impôt provincial législation loi ${topic}`
  }
  return `Canada provincial income tax act legislation statute ${topic}`
}

/**
 * @param {string} message
 * @param {'en' | 'fr'} language
 */
function buildFederalCaseLawQuery (message, language) {
  const topic = String(message || '').slice(0, 200)
  if (language === 'fr') {
    return `Cour canadienne de l'impôt décision fédérale ${topic}`
  }
  return `Canada Tax Court Federal Court of Appeal tax decision ${topic}`
}

/**
 * @param {string} message
 * @param {'en' | 'fr'} language
 * @param {{ name: string, nameFr: string }} [province]
 */
function buildProvincialCaseLawQuery (message, language, province = null) {
  const topic = String(message || '').slice(0, 180)
  if (province) {
    const provinceName = language === 'fr' ? province.nameFr : province.name
    if (language === 'fr') {
      return `${provinceName} décision tribunal cour impôt provincial ${topic}`
    }
    return `${provinceName} provincial tax court decision ruling ${topic}`
  }
  if (language === 'fr') {
    return `Canada décision impôt provincial cour ${topic}`
  }
  return `Canada provincial tax court tribunal decision ${topic}`
}

/**
 * @param {string} query
 * @param {string[]} includeDomains
 */
async function searchLegalWeb (query, includeDomains) {
  const tavily = await searchWithTavily(query, {
    includeDomains,
    maxResults: MAX_RESULTS_PER_SEARCH
  }).catch((error) => {
    console.warn('[taxgpt] Tavily legal search failed:', error.message)
    return null
  })
  return tavily || []
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
          sourceBucket: bucket
        },
        sourceBucket: bucket,
        sourceCategory: bucket,
        retrievalMethod: 'tavily_web',
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
            sourceBucket: bucket
          },
          sourceBucket: bucket,
          sourceCategory: bucket,
          retrievalMethod: 'tavily_web',
          publisher: publisherFromUrl(result.url),
          fetchedAt: new Date().toISOString()
        })
      } else {
        console.warn('[taxgpt] legal web fetch skipped:', result.url, error.message)
      }
    } finally {
      clearTimeout(timeout)
    }
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
    searchLegalWeb(buildFederalLegislationQuery(message, language), FEDERAL_LEGISLATION_DOMAINS)
  ]
  const caseLawSearches = [
    searchLegalWeb(buildFederalCaseLawQuery(message, language), FEDERAL_CASE_LAW_DOMAINS)
  ]

  if (provinces.length > 0) {
    for (const province of provinces) {
      legislationSearches.push(
        searchLegalWeb(
          buildProvincialLegislationQuery(message, language, province),
          province.legislationDomains
        )
      )
      caseLawSearches.push(
        searchLegalWeb(
          buildProvincialCaseLawQuery(message, language, province),
          [...new Set([...FEDERAL_CASE_LAW_DOMAINS, ...province.caseLawDomains])]
        )
      )
    }
  } else {
    legislationSearches.push(
      searchLegalWeb(
        buildProvincialLegislationQuery(message, language),
        ALL_PROVINCIAL_LEGISLATION_DOMAINS
      )
    )
    caseLawSearches.push(
      searchLegalWeb(
        buildProvincialCaseLawQuery(message, language),
        [...new Set([...FEDERAL_CASE_LAW_DOMAINS, ...ALL_PROVINCIAL_CASE_LAW_DOMAINS])]
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

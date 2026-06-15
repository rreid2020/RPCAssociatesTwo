import { cleanPublicationTitle } from './taxgptSourceDisplay.js'
import { matchesSourceLanguage, normalizeTaxgptLanguage } from './taxgptSourceLanguage.js'

/**
 * Detect table-of-contents style PDF extractions (leader dots + page numbers).
 * @param {string} content
 */
export function isTableOfContentsExcerpt (content) {
  const text = String(content || '').trim()
  if (!text || text.length < 40) return false

  const dotRuns = (text.match(/\.{4,}/g) || []).length
  const leaderDotRatio = (text.match(/\./g) || []).length / text.length
  const tocEntryPattern = /.{8,80}\.{3,}\s*\d{1,3}/g
  const tocMatches = (text.match(tocEntryPattern) || []).length

  if (tocMatches >= 3) return true
  if (tocMatches >= 2 && dotRuns >= 1) return true
  if (dotRuns >= 2 && leaderDotRatio > 0.08) return true
  if (dotRuns >= 1 && text.length < 600 && leaderDotRatio > 0.06) return true
  if (/part\s+\d+\s*[-–]/i.test(text) && tocMatches >= 2) return true

  return false
}

/**
 * @param {string} url
 */
export function folioCodeFromUrl (url) {
  const match = String(url || '').match(/folio-(s\d+-f\d+-c\d+)/i)
  return match ? match[1].toLowerCase() : ''
}

/**
 * @param {Record<string, unknown>} row
 */
export function resolveFolioCode (row) {
  const docMeta = row.documentMetadata && typeof row.documentMetadata === 'object' ? row.documentMetadata : {}
  const sourceMeta = row.sourceMetadata && typeof row.sourceMetadata === 'object' ? row.sourceMetadata : {}

  const docCode = docMeta.folioCode ? String(docMeta.folioCode).toLowerCase() : ''
  if (docCode) return docCode

  const sourceCode = sourceMeta.folioCode ? String(sourceMeta.folioCode).toLowerCase() : ''
  if (sourceCode) return sourceCode

  return folioCodeFromUrl(row.sourceUrl)
}

/**
 * @param {string} query
 */
export function extractFolioCodesFromQuery (query) {
  const matches = String(query || '').match(/\bS\d+-F\d+(?:-C\d+)?\b/gi) || []
  return [...new Set(matches.map((code) => code.toLowerCase()))]
}

/**
 * @param {string} code
 */
export function normalizePublicationCode (code) {
  return String(code || '').toLowerCase().replace(/\s+/g, '')
}

/**
 * @param {string} query
 */
export function extractPublicationCodesFromQuery (query) {
  const matches = String(query || '').match(/\b((?:RC|T|IC)\s*\d{2,4}(?:-\d+[A-Z]?)?)\b/gi) || []
  return [...new Set(matches.map((code) => normalizePublicationCode(code)))]
}

/**
 * @param {string} url
 */
export function publicationCodeFromUrl (url) {
  const filename = String(url || '').split('/').pop()?.replace(/\.[^.]+$/, '') || ''
  const guideMatch = filename.match(/^((?:t|rc)\d{4})/i)
  if (guideMatch) return guideMatch[1].toLowerCase()
  const icMatch = filename.match(/^(ic\d{2,3}(?:-\d+[a-z]?)?)/i)
  if (icMatch) return icMatch[1].toLowerCase()
  const taxPackageMatch = filename.match(/^(\d{4}-[a-z])$/i)
  if (taxPackageMatch) return taxPackageMatch[1].toLowerCase()
  return ''
}

/**
 * Stable key for grouping multiple editions of the same publication.
 * @param {Record<string, unknown>} row
 */
export function resolvePublicationFamilyKey (row) {
  const folioCode = resolveFolioCode(row)
  if (folioCode) {
    return `folio:${folioCode}`
  }

  const meta = row.sourceMetadata && typeof row.sourceMetadata === 'object' ? row.sourceMetadata : {}
  const parentMeta = row.parentSourceMetadata && typeof row.parentSourceMetadata === 'object'
    ? row.parentSourceMetadata
    : {}

  const publicationNumber = parentMeta.publicationNumber || meta.publicationNumber
  if (publicationNumber) {
    return `pub:${String(publicationNumber).toLowerCase().replace(/\s+/g, '')}`
  }

  if (row.parentSourceId) {
    return `parent:${row.parentSourceId}`
  }

  const code = publicationCodeFromUrl(row.sourceUrl)
  if (code) return `code:${code}`

  const parentTitle = cleanPublicationTitle(row.parentSourceTitle)
  if (parentTitle) return `title:${parentTitle.toLowerCase()}`

  const title = cleanPublicationTitle(row.sourceTitle)
  if (title) return `title:${title.toLowerCase()}`

  return row.sourceUrl ? `url:${row.sourceUrl}` : ''
}

/**
 * @param {string} query
 */
export function detectPersonalIncomeTaxFilingIntent (query) {
  const normalized = String(query || '').toLowerCase()
  if (/\b(non[- ]?resident|deemed resident|section 216|t4058|t4a-nr|5013-g)\b/.test(normalized)) {
    return false
  }
  return (
    /\b(deadline|due date|due dates|when.*file|filing date|file.*return)\b/.test(normalized) &&
    /\b(personal|individual|income tax return|t1|canada)\b/.test(normalized)
  ) || /\b5000-g\b/i.test(query)
}

/**
 * @param {string} query
 */
export function detectTaxBracketQueryIntent (query) {
  const normalized = String(query || '').toLowerCase()
  return /\b(tax brackets?|income tax brackets?|federal tax rates?|marginal tax rates?|rate of tax|tax rate)\b/.test(normalized)
    || /\bhow are (they|brackets) applied\b/.test(normalized)
}

/**
 * Higher is newer. Uses CRA filename edition codes first, then ingest timestamps.
 * @param {Record<string, unknown>} row
 */
export function resolvePublicationVintage (row) {
  const url = String(row.sourceUrl || '')
  const filename = url.split('/').pop()?.replace(/\.[^.]+$/, '') || ''

  const editionMatch = filename.match(/-(\d{2})e$/i)
  if (editionMatch) {
    const yearSuffix = Number(editionMatch[1])
    if (Number.isFinite(yearSuffix)) {
      return yearSuffix >= 90 ? 1900 + yearSuffix : 2000 + yearSuffix
    }
  }

  const fourDigitYear = filename.match(/(?:^|[-_])(20\d{2})(?:[-_.]|$)/i)
  if (fourDigitYear) {
    return Number(fourDigitYear[1])
  }

  const meta = row.sourceMetadata && typeof row.sourceMetadata === 'object' ? row.sourceMetadata : {}
  const docMeta = row.documentMetadata && typeof row.documentMetadata === 'object' ? row.documentMetadata : {}
  const pdfInfo = meta.pdfInfo && typeof meta.pdfInfo === 'object' ? meta.pdfInfo : {}

  const pdfDate = pdfInfo.CreationDate || pdfInfo.ModDate
  if (pdfDate) {
    const parsed = Date.parse(String(pdfDate).replace(/^D:/, ''))
    if (Number.isFinite(parsed)) return parsed
  }

  if (row.lastIngestedAt) {
    const parsed = new Date(row.lastIngestedAt).getTime()
    if (Number.isFinite(parsed)) return parsed
  }

  if (docMeta.retrievedAt) {
    const parsed = new Date(docMeta.retrievedAt).getTime()
    if (Number.isFinite(parsed)) return parsed
  }

  return 0
}

/**
 * Drop TOC chunks, enforce source language, and keep only the newest edition per publication family.
 * @param {Array<Record<string, unknown>>} rows
 * @param {number} topK
 * @param {{ language?: string }} [options]
 */
export function filterRetrievedChunks (rows, topK, options = {}) {
  const language = normalizeTaxgptLanguage(options.language)
  const qualityRows = rows.filter((row) => !isTableOfContentsExcerpt(row.content))
  let candidateRows = qualityRows.length > 0 ? qualityRows : rows

  const languageRows = candidateRows.filter((row) => matchesSourceLanguage(row.sourceUrl, language))
  if (languageRows.length > 0) {
    candidateRows = languageRows
  }

  const familyMaxVintage = new Map()
  for (const row of candidateRows) {
    const family = resolvePublicationFamilyKey(row)
    if (!family) continue
    const vintage = resolvePublicationVintage(row)
    const current = familyMaxVintage.get(family)
    if (current === undefined || vintage > current) {
      familyMaxVintage.set(family, vintage)
    }
  }

  const latestRows = candidateRows.filter((row) => {
    const family = resolvePublicationFamilyKey(row)
    if (!family || !familyMaxVintage.has(family)) return true
    return resolvePublicationVintage(row) >= familyMaxVintage.get(family)
  })

  return latestRows
    .sort((a, b) => (Number(b.similarity) || 0) - (Number(a.similarity) || 0))
    .slice(0, topK)
}

import { folioCodeFromUrl, publicationCodeFromUrl } from './taxgptRetrievalFilters.js'

const GENERIC_TITLE_PATTERNS = [
  /^standard\s+print\s+pdf$/i,
  /^print\s+pdf$/i,
  /^pdf(\s+version)?$/i,
  /^html(\s+version)?$/i,
  /^accessible\s+pdf$/i,
  /^large\s+print(\s+pdf)?$/i,
  /^epub$/i,
  /^download\s+pdf$/i,
  /^untitled$/i,
  /^pdf en .+$/i
]

const GENERIC_TITLE_WITH_PREFIX = /^\d{4}\s*[–-]\s*(standard\s+print\s+pdf|print\s+pdf|pdf|html)/i
const FILENAME_TITLE_PATTERN = /^(?:t|rc)\d{4}(?:[-_.][a-z0-9]+)*\.(?:html?|pdf)$/i
const EDITION_FILENAME_PATTERN = /^(?:t|rc)\d{4}(?:[-_.][a-z0-9]+)*$/i

function formatFolioCode (slug) {
  const match = String(slug || '').match(/s(\d+)-f(\d+)-c(\d+)/i)
  if (!match) return String(slug || '')
  return `S${match[1]}-F${match[2]}-C${match[3]}`
}

function formatPublicationCode (code) {
  const normalized = String(code || '').trim().toLowerCase()
  if (!normalized) return ''
  if (normalized.startsWith('ic')) return normalized.toUpperCase()
  return normalized.toUpperCase()
}

/**
 * @param {string} title
 */
function isFilenameTitle (title) {
  const normalized = String(title || '').trim()
  return FILENAME_TITLE_PATTERN.test(normalized) ||
    EDITION_FILENAME_PATTERN.test(normalized) ||
    /^[a-z0-9]+-f\.html$/i.test(normalized)
}

/**
 * @param {string} title
 */
function isGenericTitle (title) {
  const normalized = String(title || '').trim()
  if (!normalized) return true
  if (GENERIC_TITLE_WITH_PREFIX.test(normalized)) return true
  if (GENERIC_TITLE_PATTERNS.some((pattern) => pattern.test(normalized))) return true
  if (/standard\s+print\s+pdf/i.test(normalized) && normalized.length < 80) return true
  if (isFilenameTitle(normalized)) return true
  return false
}

/**
 * @param {string} title
 */
export function cleanPublicationTitle (title) {
  return String(title || '')
    .replace(/^\d{4}\s*[–-]\s*/i, '')
    .replace(/\s*\([^)]*\.pdf\)\s*$/i, '')
    .trim()
}

/**
 * @param {string} url
 */
function titleFromPublicationFilename (url) {
  const code = formatPublicationCode(publicationCodeFromUrl(url))
  if (!code) return ''
  if (code.startsWith('IC')) return `Information Circular ${code}`
  if (/^\d{4}-[A-Z]$/.test(code)) return `Guide ${code}`
  if (code.startsWith('T') || code.startsWith('RC')) return `Guide ${code}`
  return code
}

/**
 * @param {string} code
 */
function publicationLabel (code) {
  const normalized = formatPublicationCode(code)
  if (!normalized) return ''
  if (normalized.startsWith('IC')) return `Information Circular ${normalized}`
  if (/^\d{4}-[A-Z]$/.test(normalized)) return `Guide ${normalized}`
  if (normalized.startsWith('T') || normalized.startsWith('RC')) return `Guide ${normalized}`
  return normalized
}

function escapeRegExp (value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isFormattedFolioTitle (title, folioCode) {
  const normalized = String(title || '').trim()
  if (!normalized || !folioCode) return false
  return new RegExp(`^Income Tax Folio ${escapeRegExp(folioCode)}\\s*[—–-]\\s+`, 'i').test(normalized)
}

function extractFolioChapterTitle (title, folioCode) {
  let normalized = cleanPublicationTitle(title)
  if (!normalized || !folioCode) return normalized || null

  normalized = normalized
    .replace(new RegExp(`^Income Tax Folio ${escapeRegExp(folioCode)}\\s*[—–-]\\s*`, 'ig'), '')
    .replace(new RegExp(`^Income Tax Folio ${escapeRegExp(folioCode)}$`, 'i'), '')
    .trim()

  return normalized || null
}

function isFormattedPublicationTitle (title, publicationCode) {
  const label = publicationLabel(publicationCode)
  if (!label) return false
  return String(title || '').trim().startsWith(label)
}

/**
 * @param {{
 *   sourceTitle?: string,
 *   sourceUrl?: string,
 *   sourceMetadata?: Record<string, unknown>,
 *   parentSourceTitle?: string,
 *   parentSourceMetadata?: Record<string, unknown>,
 *   documentMetadata?: Record<string, unknown>
 * }} input
 */
export function resolveDocumentDisplayTitle ({
  sourceTitle,
  sourceUrl,
  sourceMetadata = {},
  parentSourceTitle,
  parentSourceMetadata = {},
  documentMetadata = {}
}) {
  const meta = sourceMetadata && typeof sourceMetadata === 'object' ? sourceMetadata : {}
  const parentMeta = parentSourceMetadata && typeof parentSourceMetadata === 'object' ? parentSourceMetadata : {}
  const docMeta = documentMetadata && typeof documentMetadata === 'object' ? documentMetadata : {}
  const pdfInfo = meta.pdfInfo && typeof meta.pdfInfo === 'object' ? meta.pdfInfo : {}

  const folioSlug = docMeta.folioCode || meta.folioCode || folioCodeFromUrl(sourceUrl)
  if (folioSlug) {
    const folioCode = formatFolioCode(folioSlug)
    const normalizedSource = cleanPublicationTitle(sourceTitle || '')

    if (isFormattedFolioTitle(normalizedSource, folioCode)) {
      return normalizedSource
    }

    const chapterTitle = !isGenericTitle(sourceTitle)
      ? extractFolioChapterTitle(sourceTitle, folioCode)
      : null
    if (chapterTitle) return `Income Tax Folio ${folioCode} — ${chapterTitle}`
    return `Income Tax Folio ${folioCode}`
  }

  const publicationCode = formatPublicationCode(
    parentMeta.publicationNumber || meta.publicationNumber || docMeta.publicationNumber || publicationCodeFromUrl(sourceUrl)
  )

  const normalizedSource = cleanPublicationTitle(sourceTitle || '')
  if (publicationCode && isFormattedPublicationTitle(normalizedSource, publicationCode)) {
    return normalizedSource
  }

  const humanTitleCandidates = [
    parentMeta.title,
    parentSourceTitle,
    docMeta.title,
    meta.title,
    pdfInfo.Title,
    !isGenericTitle(sourceTitle) ? cleanPublicationTitle(sourceTitle) : null
  ]
    .map((value) => cleanPublicationTitle(String(value || '')))
    .filter((value) => value && !isGenericTitle(value))

  const humanTitle = humanTitleCandidates[0] || ''

  if (publicationCode && humanTitle) {
    return `${publicationLabel(publicationCode)} — ${humanTitle}`
  }
  if (publicationCode) return publicationLabel(publicationCode)
  if (humanTitle) return humanTitle

  return titleFromPublicationFilename(sourceUrl) || cleanPublicationTitle(sourceTitle) || 'CRA publication'
}

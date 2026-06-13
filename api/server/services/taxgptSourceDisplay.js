const GENERIC_TITLE_PATTERNS = [
  /^standard\s+print\s+pdf$/i,
  /^print\s+pdf$/i,
  /^pdf(\s+version)?$/i,
  /^html(\s+version)?$/i,
  /^accessible\s+pdf$/i,
  /^large\s+print(\s+pdf)?$/i,
  /^epub$/i,
  /^download\s+pdf$/i,
  /^untitled$/i
]

const GENERIC_TITLE_WITH_PREFIX = /^\d{4}\s*[–-]\s*(standard\s+print\s+pdf|print\s+pdf|pdf|html)$/i

/**
 * @param {string} title
 */
function isGenericTitle (title) {
  const normalized = String(title || '').trim()
  if (!normalized) return true
  if (GENERIC_TITLE_WITH_PREFIX.test(normalized)) return true
  if (GENERIC_TITLE_PATTERNS.some((pattern) => pattern.test(normalized))) return true
  if (/standard\s+print\s+pdf/i.test(normalized) && normalized.length < 80) return true
  return false
}

/**
 * @param {string} title
 */
function cleanPublicationTitle (title) {
  return String(title || '')
    .replace(/^\d{4}\s*[–-]\s*/i, '')
    .replace(/\s*\([^)]*\.pdf\)\s*$/i, '')
    .trim()
}

/**
 * @param {string} url
 */
function titleFromPublicationFilename (url) {
  const filename = String(url || '').split('/').pop()?.replace(/\.[^.]+$/, '') || ''
  const guideMatch = filename.match(/^(t\d{4})/i)
  if (guideMatch) return `Guide ${guideMatch[1].toUpperCase()}`
  const rcMatch = filename.match(/^(rc\d{4})/i)
  if (rcMatch) return rcMatch[1].toUpperCase()
  const icMatch = filename.match(/^(ic\d{2,3})/i)
  if (icMatch) return `Information Circular ${icMatch[1].toUpperCase()}`
  return ''
}

/**
 * @param {{
 *   sourceTitle?: string,
 *   sourceUrl?: string,
 *   sourceMetadata?: Record<string, unknown>,
 *   parentSourceTitle?: string,
 *   documentMetadata?: Record<string, unknown>
 * }} input
 */
export function resolveDocumentDisplayTitle ({
  sourceTitle,
  sourceUrl,
  sourceMetadata = {},
  parentSourceTitle,
  documentMetadata = {}
}) {
  const meta = sourceMetadata && typeof sourceMetadata === 'object' ? sourceMetadata : {}
  const docMeta = documentMetadata && typeof documentMetadata === 'object' ? documentMetadata : {}
  const pdfInfo = meta.pdfInfo && typeof meta.pdfInfo === 'object' ? meta.pdfInfo : {}

  const candidates = [
    docMeta.title,
    meta.title,
    pdfInfo.Title,
    !isGenericTitle(sourceTitle) ? cleanPublicationTitle(sourceTitle) : null,
    parentSourceTitle ? cleanPublicationTitle(parentSourceTitle) : null,
    titleFromPublicationFilename(sourceUrl)
  ]
    .map((value) => cleanPublicationTitle(String(value || '')))
    .filter((value) => value && !isGenericTitle(value))

  if (candidates.length > 0) return candidates[0]

  const cleanedSourceTitle = cleanPublicationTitle(sourceTitle)
  if (cleanedSourceTitle && !isGenericTitle(cleanedSourceTitle)) return cleanedSourceTitle

  return titleFromPublicationFilename(sourceUrl) || cleanedSourceTitle || 'CRA publication'
}

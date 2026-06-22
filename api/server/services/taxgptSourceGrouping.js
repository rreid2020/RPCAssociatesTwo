import { folioCodeFromUrl, publicationCodeFromUrl } from './taxgptRetrievalFilters.js'
import { cleanPublicationTitle, resolveDocumentDisplayTitle } from './taxgptSourceDisplay.js'

const CRA_DOCUMENT_TYPE_ORDER = [
  'folio',
  'guide',
  'information_circular',
  'form',
  'other'
]

const CRA_DOCUMENT_TYPE_LABELS = {
  folio: 'Income Tax Folios',
  guide: 'Guides',
  information_circular: 'Information Circulars',
  form: 'Forms and schedules',
  other: 'Other CRA publications'
}

function formatPublicationCode (code) {
  const normalized = String(code || '').toLowerCase()
  if (!normalized) return ''
  if (normalized.startsWith('ic')) return normalized.toUpperCase()
  if (normalized.startsWith('t') || normalized.startsWith('rc')) {
    return normalized.toUpperCase()
  }
  return normalized.toUpperCase()
}

function formatFolioCode (slug) {
  const match = String(slug || '').match(/s(\d+)-f(\d+)-c(\d+)/i)
  if (!match) return String(slug || '').toUpperCase()
  return `S${match[1]}-F${match[2]}-C${match[3]}`
}

/**
 * @param {{
 *   sourceUrl?: string,
 *   sourceTitle?: string,
 *   sourceCategory?: string,
 *   sourceMetadata?: Record<string, unknown>,
 *   parentSourceTitle?: string,
 *   parentSourceMetadata?: Record<string, unknown>,
 *   documentMetadata?: Record<string, unknown>
 * }} input
 */
export function resolveCraDocumentType (input = {}) {
  const url = String(input.sourceUrl || '').toLowerCase()
  const category = String(input.sourceCategory || '').toLowerCase()
  const folioCode = input.documentMetadata?.folioCode || input.sourceMetadata?.folioCode || folioCodeFromUrl(url)

  if (folioCode || category === 'folio' || url.includes('/income-tax-folio-') || url.includes('/folio-')) {
    return 'folio'
  }

  const publicationCode = resolvePublicationCode(input)
  if (publicationCode.startsWith('ic')) return 'information_circular'
  if (category === 'form' || url.includes('/forms-publications/forms/')) return 'form'
  if (
    category === 'guide' ||
    publicationCode.startsWith('t') ||
    publicationCode.startsWith('rc') ||
    url.includes('/publications/')
  ) {
    return 'guide'
  }

  return 'other'
}

/**
 * @param {{
 *   sourceUrl?: string,
 *   sourceMetadata?: Record<string, unknown>,
 *   parentSourceMetadata?: Record<string, unknown>,
 *   documentMetadata?: Record<string, unknown>
 * }} input
 */
export function resolvePublicationCode (input = {}) {
  const docMeta = input.documentMetadata && typeof input.documentMetadata === 'object' ? input.documentMetadata : {}
  const sourceMeta = input.sourceMetadata && typeof input.sourceMetadata === 'object' ? input.sourceMetadata : {}
  const parentMeta = input.parentSourceMetadata && typeof input.parentSourceMetadata === 'object'
    ? input.parentSourceMetadata
    : {}

  const explicit = parentMeta.publicationNumber || sourceMeta.publicationNumber || docMeta.publicationNumber
  if (explicit) return formatPublicationCode(String(explicit))

  const folioCode = docMeta.folioCode || sourceMeta.folioCode || folioCodeFromUrl(input.sourceUrl)
  if (folioCode) return formatFolioCode(folioCode)

  return formatPublicationCode(publicationCodeFromUrl(input.sourceUrl))
}

/**
 * @param {Record<string, unknown>} input
 */
export function resolveDocumentGroupKey (input = {}) {
  const publicationCode = resolvePublicationCode(input)
  const folioCode = folioCodeFromUrl(input.sourceUrl)
  const type = resolveCraDocumentType(input)

  if (folioCode) return `folio:${folioCode.toLowerCase()}`
  if (publicationCode) return `pub:${publicationCode.toLowerCase()}`

  const parentTitle = cleanPublicationTitle(input.parentSourceTitle)
  if (parentTitle) return `title:${parentTitle.toLowerCase()}`

  const displayTitle = cleanPublicationTitle(input.sourceTitle)
  if (displayTitle) return `title:${displayTitle.toLowerCase()}`

  return input.sourceUrl ? `url:${input.sourceUrl}` : `type:${type}`
}

/**
 * @param {Array<Record<string, unknown>>} entries
 * @param {Array<Record<string, unknown>>} chunks
 */
export function buildCraDocumentGroups (entries, chunks = []) {
  const chunkByIndex = new Map()
  for (const [index, chunk] of chunks.entries()) {
    chunkByIndex.set(index + 1, chunk)
  }

  /** @type {Map<string, Record<string, unknown>>} */
  const documents = new Map()

  for (const entry of entries) {
    const citationIndex = Number(entry.citationIndex) || 0
    const chunk = chunkByIndex.get(citationIndex) ||
      chunks.find((item) => item.citation?.chunkId === entry.chunkId)
    const context = {
      sourceUrl: entry.sourceUrl || chunk?.citation?.sourceUrl,
      sourceTitle: chunk?.rawSourceTitle || entry.sourceTitle || chunk?.citation?.sourceTitle,
      sourceCategory: chunk?.sourceCategory,
      sourceMetadata: chunk?.sourceMetadata,
      parentSourceTitle: chunk?.parentSourceTitle,
      parentSourceMetadata: chunk?.parentSourceMetadata,
      documentMetadata: chunk?.documentMetadata
    }

    const documentKey = resolveDocumentGroupKey(context)
    const documentType = resolveCraDocumentType(context)
    const publicationCode = resolvePublicationCode(context)
    const sourceTitle = resolveDocumentDisplayTitle({
      sourceTitle: context.sourceTitle,
      sourceUrl: context.sourceUrl,
      sourceMetadata: context.sourceMetadata,
      parentSourceTitle: context.parentSourceTitle,
      parentSourceMetadata: context.parentSourceMetadata,
      documentMetadata: context.documentMetadata
    })

    if (!documents.has(documentKey)) {
      documents.set(documentKey, {
        documentKey,
        documentType,
        publicationCode: publicationCode || undefined,
        sourceTitle,
        sourceUrl: context.sourceUrl || '',
        citationIndices: [],
        highlights: [],
        sectionHeadings: []
      })
    }

    const document = documents.get(documentKey)
    if (citationIndex > 0 && !document.citationIndices.includes(citationIndex)) {
      document.citationIndices.push(citationIndex)
    }

    const highlights = Array.isArray(entry.highlights) ? entry.highlights : []
    for (const highlight of highlights) {
      const normalized = String(highlight || '').trim()
      if (normalized && !document.highlights.includes(normalized)) {
        document.highlights.push(normalized)
      }
    }

    const sectionHeading = entry.sectionHeading || chunk?.citation?.sectionHeading
    if (sectionHeading && !document.sectionHeadings.includes(sectionHeading)) {
      document.sectionHeadings.push(sectionHeading)
    }
  }

  const groupedByType = new Map()
  for (const document of documents.values()) {
    const type = document.documentType || 'other'
    if (!groupedByType.has(type)) groupedByType.set(type, [])
    groupedByType.get(type).push(document)
  }

  return CRA_DOCUMENT_TYPE_ORDER
    .filter((type) => groupedByType.has(type))
    .map((type) => ({
      documentType: type,
      label: CRA_DOCUMENT_TYPE_LABELS[type] || CRA_DOCUMENT_TYPE_LABELS.other,
      documents: groupedByType.get(type)
        .sort((a, b) => String(a.sourceTitle).localeCompare(String(b.sourceTitle)))
    }))
}

export { CRA_DOCUMENT_TYPE_LABELS, CRA_DOCUMENT_TYPE_ORDER }

/**
 * Build one entry per CRA document from retrieved chunks for references.
 * @param {Array<Record<string, unknown>>} chunks
 */
export function buildCraDocumentGroupsFromChunks (chunks = []) {
  const craChunkEntries = chunks
    .map((chunk, index) => ({ chunk, citationIndex: index + 1 }))
    .filter(({ chunk }) => (chunk.sourceBucket || chunk.citation?.sourceBucket || 'cra') === 'cra')

  const entries = craChunkEntries.map(({ chunk, citationIndex }) => ({
    citationIndex,
    chunkId: chunk.citation?.chunkId,
    sourceUrl: chunk.citation?.sourceUrl,
    sourceTitle: chunk.citation?.sourceTitle,
    sectionHeading: chunk.citation?.sectionHeading,
    highlights: []
  }))

  return buildCraDocumentGroups(entries, craChunkEntries.map(({ chunk }) => chunk))
}

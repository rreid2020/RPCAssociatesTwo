import { logger } from '@shared/types'

export type CanliiSourceRecord = {
  url: string
  title?: string | null
  metadata?: Record<string, unknown> | null
}

/** CanLII API license allows metadata indexing only — not full decision text. */
export function isCanliiMetadataOnlySource (input: {
  sourceType?: string | null
  url?: string | null
}): boolean {
  if (input.sourceType === 'canlii_decision') return true
  const url = String(input.url || '')
  return url.includes('canlii.org') || url.includes('canlii.ca')
}

export function buildCanliiMetadataIngestDocument (source: CanliiSourceRecord): {
  text: string
  title: string
  metadata: Record<string, unknown>
} {
  const meta = (source.metadata || {}) as Record<string, unknown>
  const title = String(source.title || meta.citation || 'CanLII decision').trim()
  const citation = meta.citation ? String(meta.citation) : ''
  const decisionDate = meta.decisionDate ? String(meta.decisionDate) : ''
  const docketNumber = meta.docketNumber ? String(meta.docketNumber) : ''
  const keywords = meta.keywords ? String(meta.keywords) : ''
  const databaseId = meta.canliiDatabaseId ? String(meta.canliiDatabaseId) : ''
  const caseId = meta.canliiCaseId ? String(meta.canliiCaseId) : ''

  const lines = [
    `# ${title}`,
    '',
    citation ? `Citation: ${citation}` : null,
    decisionDate ? `Decision date: ${decisionDate}` : null,
    docketNumber ? `Docket: ${docketNumber}` : null,
    databaseId && caseId ? `CanLII reference: ${databaseId}/${caseId}` : null,
    keywords ? `Keywords: ${keywords}` : null,
    `Source URL: ${source.url}`,
    '',
    'Indexed fields: metadata only (CanLII API license does not permit full-text indexing).',
    'Use the source URL to read the full decision on CanLII.'
  ].filter((line): line is string => line !== null)

  const text = lines.join('\n')

  logger.ingest('Built CanLII metadata-only ingest document', {
    url: source.url,
    title,
    textLength: text.length,
    hasCitation: !!citation,
    hasKeywords: !!keywords
  })

  return {
    text,
    title,
    metadata: {
      ingestMode: 'metadata_only',
      corpusFamily: 'case_law',
      citation: citation || null,
      decisionDate: decisionDate || null,
      docketNumber: docketNumber || null,
      keywords: keywords || null,
      canliiDatabaseId: databaseId || null,
      canliiCaseId: caseId || null,
      fullTextIndexed: false
    }
  }
}

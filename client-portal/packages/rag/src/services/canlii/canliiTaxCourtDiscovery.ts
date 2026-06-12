import { eq } from 'drizzle-orm'
import { getDb, logger, sources } from '@shared/types'
import { CANLII_TAX_COURT_SEED } from '../../corpus/discoverySeeds'
import { UrlNormalizer } from '../discovery/urlNormalizer'
import { CanliiApiClient } from './canliiApiClient'

export const CANLII_TAX_COURT_DATABASE_ID = 'tcc'
export const CANLII_TAX_COURT_START_DATE = '2010-01-01'

type CanliiCursorMetadata = {
  canliiOffset?: number
  canliiDiscoveryComplete?: boolean
  canliiLastDiscoveredAt?: string
}

function buildCanliiCaseUrl (caseId: string, metadataUrl?: string): string {
  if (metadataUrl) {
    try {
      const parsed = new URL(metadataUrl)
      if (parsed.hostname.includes('canlii')) {
        return parsed.toString()
      }
    } catch {
      // fall through to constructed URL
    }
  }
  return `https://www.canlii.org/en/ca/${CANLII_TAX_COURT_DATABASE_ID}/${caseId}/`
}

async function ensureCanliiSeedSource () {
  const db = getDb()
  const seed = CANLII_TAX_COURT_SEED
  const existing = await db
    .select()
    .from(sources)
    .where(eq(sources.url, seed.url))
    .limit(1)

  if (existing[0]?.id) {
    return existing[0]
  }

  const inserted = await db
    .insert(sources)
    .values({
      url: seed.url,
      title: seed.title,
      sourceType: seed.sourceType,
      category: seed.category,
      ingestStatus: 'skipped',
      pageKind: seed.pageKind,
      priority: seed.priority,
      jurisdictionTags: ['CA-FED'],
      metadata: {
        corpusSeed: seed.key,
        corpusFamily: 'case_law',
        canliiOffset: 0,
        canliiDiscoveryComplete: false
      }
    })
    .returning()

  return inserted[0]
}

export async function discoverCanliiTaxCourtBatch (options: {
  limit?: number
  decisionDateAfter?: string
} = {}): Promise<{
  discovered: number
  skippedDuplicates: number
  errors: number
  offset: number
  complete: boolean
}> {
  if (!process.env.CANLII_API_KEY) {
    logger.crawl('Skipping CanLII discovery — CANLII_API_KEY is not set')
    return { discovered: 0, skippedDuplicates: 0, errors: 0, offset: 0, complete: true }
  }

  const db = getDb()
  const seedRow = await ensureCanliiSeedSource()
  const seedMetadata = (seedRow.metadata || {}) as CanliiCursorMetadata

  if (seedMetadata.canliiDiscoveryComplete) {
    logger.crawl('CanLII Tax Court discovery already complete')
    return {
      discovered: 0,
      skippedDuplicates: 0,
      errors: 0,
      offset: seedMetadata.canliiOffset || 0,
      complete: true
    }
  }

  const limit = options.limit ?? Number(process.env.CANLII_DISCOVER_LIMIT || 50)
  const decisionDateAfter = options.decisionDateAfter || CANLII_TAX_COURT_START_DATE
  const offset = seedMetadata.canliiOffset || 0
  const client = new CanliiApiClient()

  const summary = {
    discovered: 0,
    skippedDuplicates: 0,
    errors: 0,
    offset,
    complete: false
  }

  let listed
  try {
    listed = await client.listCases({
      databaseId: CANLII_TAX_COURT_DATABASE_ID,
      offset,
      resultCount: limit,
      decisionDateAfter
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.crawlError('CanLII listCases failed', { error: message, offset, limit })
    throw error
  }

  if (listed.length === 0) {
    await db
      .update(sources)
      .set({
        metadata: {
          ...seedMetadata,
          corpusSeed: CANLII_TAX_COURT_SEED.key,
          corpusFamily: 'case_law',
          canliiOffset: offset,
          canliiDiscoveryComplete: true,
          canliiLastDiscoveredAt: new Date().toISOString()
        }
      })
      .where(eq(sources.id, seedRow.id))

    summary.complete = true
    return summary
  }

  for (const item of listed) {
    try {
      const metadata = await client.getCaseMetadata(item.databaseId, item.caseId)
      const url = buildCanliiCaseUrl(item.caseId, metadata.url)
      const normalizedUrl = UrlNormalizer.normalize(url)

      const existing = await db
        .select({ id: sources.id })
        .from(sources)
        .where(eq(sources.normalizedUrl, normalizedUrl))
        .limit(1)

      if (existing[0]?.id) {
        summary.skippedDuplicates += 1
        continue
      }

      await db.insert(sources).values({
        url,
        normalizedUrl,
        title: metadata.title || item.title,
        sourceType: 'canlii_decision',
        category: 'case_law',
        jurisdictionTags: ['CA-FED'],
        pageKind: 'content',
        ingestStatus: 'pending',
        priority: 'high',
        parentSourceId: seedRow.id,
        metadata: {
          corpusFamily: 'case_law',
          corpusRole: 'canlii_decision',
          ingestMode: 'metadata_only',
          canliiDatabaseId: item.databaseId,
          canliiCaseId: item.caseId,
          citation: metadata.citation || item.citation,
          decisionDate: metadata.decisionDate || null,
          docketNumber: metadata.docketNumber || null,
          keywords: metadata.keywords || null,
          fullTextIndexed: false
        }
      })

      summary.discovered += 1
    } catch (error) {
      summary.errors += 1
      logger.crawlError('CanLII case discovery failed', {
        caseId: item.caseId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const nextOffset = offset + listed.length
  const complete = listed.length < limit

  await db
    .update(sources)
    .set({
      metadata: {
        ...seedMetadata,
        corpusSeed: CANLII_TAX_COURT_SEED.key,
        corpusFamily: 'case_law',
        canliiOffset: nextOffset,
        canliiDiscoveryComplete: complete,
        canliiLastDiscoveredAt: new Date().toISOString()
      }
    })
    .where(eq(sources.id, seedRow.id))

  summary.offset = nextOffset
  summary.complete = complete

  logger.crawl('CanLII Tax Court discovery batch complete', summary)
  return summary
}

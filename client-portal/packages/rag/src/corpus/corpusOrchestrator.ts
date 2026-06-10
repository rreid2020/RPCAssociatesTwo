import { count, eq, inArray, sql } from 'drizzle-orm'
import { embeddings, getDb, ensureDbValidated, sources } from '@shared/types'
import { CraPublicationsDiscoveryService } from '../services/discovery'
import { CRA_PUBLICATIONS_CATALOG_SEED, CRA_PUBLICATIONS_CATALOG_URL } from './discoverySeeds'
import { isArchivedOrCancelledTitle } from './sourcePolicy'

export type CorpusAuditReport = {
  totals: {
    sourceCount: number
    ingestedSourceCount: number
    pendingSourceCount: number
    skippedSourceCount: number
    failedSourceCount: number
    embeddingCount: number
    retrievalReady: boolean
  }
  archivedPendingCount: number
  byCategory: Array<{ category: string; count: number }>
  byIngestStatus: Array<{ ingestStatus: string; count: number }>
  byPageKind: Array<{ pageKind: string; count: number }>
}

async function ensureCatalogSeedSource () {
  const db = getDb()
  const seed = CRA_PUBLICATIONS_CATALOG_SEED
  const existing = await db
    .select({ id: sources.id })
    .from(sources)
    .where(eq(sources.url, seed.url))
    .limit(1)

  if (existing[0]?.id) {
    return existing[0].id
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
      metadata: { corpusSeed: seed.key }
    })
    .returning({ id: sources.id })

  return inserted[0].id
}

function isPublicationLandingUrl (url: string): boolean {
  if (url === CRA_PUBLICATIONS_CATALOG_URL) return false
  try {
    const path = new URL(url).pathname.toLowerCase()
    return path.includes('/forms-publications/publications/') && path.endsWith('.html')
  } catch {
    return false
  }
}

/** Phase 1: parse publications.html table → one source per publication number. */
export async function discoverPublicationsCatalog (): Promise<{
  newSourcesCreated: number
  skippedDuplicates: number
}> {
  await ensureDbValidated()
  const sourceId = await ensureCatalogSeedSource()
  const discovery = new CraPublicationsDiscoveryService()
  const result = await discovery.discoverFromPublicationsDirectory(sourceId)
  return {
    newSourcesCreated: result.newSourcesCreated,
    skippedDuplicates: result.skippedDuplicates
  }
}

/** Phase 2: for each table landing page, discover linked HTML/PDF content URLs. */
export async function expandPublicationLandingPages (options: { limit?: number } = {}): Promise<{
  processed: number
  expanded: number
  contentSourcesCreated: number
  skipped: number
  errors: number
}> {
  await ensureDbValidated()
  const db = getDb()
  const discovery = new CraPublicationsDiscoveryService()
  const limit = options.limit ?? 50

  const landingPages = await db
    .select()
    .from(sources)
    .where(eq(sources.ingestStatus, 'pending'))

  const candidates = landingPages
    .filter((row) => isPublicationLandingUrl(row.url))
    .filter((row) => !isArchivedOrCancelledTitle(row.title))
    .slice(0, limit)

  const summary = {
    processed: 0,
    expanded: 0,
    contentSourcesCreated: 0,
    skipped: 0,
    errors: 0
  }

  for (const landing of candidates) {
    summary.processed += 1
    try {
      const result = await discovery.discoverFromPublicationPage(landing.id)
      if (result.newSourcesCreated > 0) {
        summary.expanded += 1
        summary.contentSourcesCreated += result.newSourcesCreated
        await db
          .update(sources)
          .set({
            ingestStatus: 'skipped',
            pageKind: 'directory',
            errorMessage: 'Publication landing page — content URLs discovered'
          })
          .where(eq(sources.id, landing.id))
      } else {
        summary.skipped += 1
      }
    } catch {
      summary.errors += 1
    }
  }

  return summary
}

/** Full discovery: catalogue table, then expand landing pages to HTML/PDF targets. */
export async function discoverFullPublicationsCorpus (options: {
  expandLimit?: number
} = {}) {
  const catalog = await discoverPublicationsCatalog()
  const expanded = await expandPublicationLandingPages({ limit: options.expandLimit ?? 100 })
  return { catalog, expanded }
}

export async function reconcileArchivedPendingSources (): Promise<{ updatedCount: number }> {
  await ensureDbValidated()
  const db = getDb()
  const pending = await db
    .select({ id: sources.id, title: sources.title })
    .from(sources)
    .where(eq(sources.ingestStatus, 'pending'))

  const archivedIds = pending
    .filter((row) => isArchivedOrCancelledTitle(row.title))
    .map((row) => row.id)

  if (archivedIds.length === 0) {
    return { updatedCount: 0 }
  }

  await db
    .update(sources)
    .set({
      ingestStatus: 'skipped',
      errorMessage: 'Archived/Cancelled',
      lastAttemptAt: new Date()
    })
    .where(inArray(sources.id, archivedIds))

  return { updatedCount: archivedIds.length }
}

export async function auditCorpus (): Promise<CorpusAuditReport> {
  await ensureDbValidated()
  const db = getDb()

  const [
    sourceRows,
    ingestedRows,
    pendingRows,
    skippedRows,
    failedRows,
    embeddingRows,
    archivedPendingRows,
    categoryRows,
    statusRows,
    pageKindRows
  ] = await Promise.all([
    db.select({ count: count() }).from(sources),
    db.select({ count: count() }).from(sources).where(eq(sources.ingestStatus, 'ingested')),
    db.select({ count: count() }).from(sources).where(eq(sources.ingestStatus, 'pending')),
    db.select({ count: count() }).from(sources).where(eq(sources.ingestStatus, 'skipped')),
    db.select({ count: count() }).from(sources).where(eq(sources.ingestStatus, 'failed')),
    db.select({ count: count() }).from(embeddings),
    db.execute(sql`
      SELECT count(*)::int AS count
      FROM taxgpt.sources
      WHERE ingest_status = 'pending'
        AND title ~* '(archived|cancelled|canceled|annul[eé]e|archiv[eé]e)'
    `),
    db.execute(sql`
      SELECT category, count(*)::int AS count
      FROM taxgpt.sources
      GROUP BY category
      ORDER BY count DESC
    `),
    db.execute(sql`
      SELECT ingest_status AS "ingestStatus", count(*)::int AS count
      FROM taxgpt.sources
      GROUP BY ingest_status
      ORDER BY count DESC
    `),
    db.execute(sql`
      SELECT coalesce(page_kind, 'unknown') AS "pageKind", count(*)::int AS count
      FROM taxgpt.sources
      GROUP BY coalesce(page_kind, 'unknown')
      ORDER BY count DESC
    `)
  ])

  const embeddingCount = embeddingRows[0]?.count || 0

  return {
    totals: {
      sourceCount: sourceRows[0]?.count || 0,
      ingestedSourceCount: ingestedRows[0]?.count || 0,
      pendingSourceCount: pendingRows[0]?.count || 0,
      skippedSourceCount: skippedRows[0]?.count || 0,
      failedSourceCount: failedRows[0]?.count || 0,
      embeddingCount,
      retrievalReady: embeddingCount > 0
    },
    archivedPendingCount: Number((archivedPendingRows as unknown as Array<{ count: number }>)[0]?.count || 0),
    byCategory: categoryRows as unknown as Array<{ category: string; count: number }>,
    byIngestStatus: statusRows as unknown as Array<{ ingestStatus: string; count: number }>,
    byPageKind: pageKindRows as unknown as Array<{ pageKind: string; count: number }>
  }
}

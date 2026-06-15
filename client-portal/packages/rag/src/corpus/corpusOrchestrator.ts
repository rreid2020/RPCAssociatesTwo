import { count, eq, inArray, sql } from 'drizzle-orm'
import { embeddings, getDb, ensureDbValidated, sources } from '@shared/types'
import { CraFolioDiscoveryService, CraPublicationsDiscoveryService } from '../services/discovery'
import {
  CRA_FOLIO_DISCOVERY_SEEDS,
  CRA_PUBLICATIONS_CATALOG_SEED,
  CRA_PUBLICATIONS_CATALOG_URL,
  CRA_TAX_REFERENCE_CONTENT_SEEDS
} from './discoverySeeds'
import {
  isArchivedOrCancelledTitle,
  isCatalogPublicationLandingUrl,
  isFrenchCraPublicationUrl,
  isPublicationLandingPendingExpand
} from './sourcePolicy'

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

async function ensureFolioDiscoverySeedSources (): Promise<string[]> {
  const db = getDb()
  const ids: string[] = []

  for (const seed of CRA_FOLIO_DISCOVERY_SEEDS) {
    const existing = await db
      .select({ id: sources.id })
      .from(sources)
      .where(eq(sources.url, seed.url))
      .limit(1)

    if (existing[0]?.id) {
      ids.push(existing[0].id)
      continue
    }

    const inserted = await db
      .insert(sources)
      .values({
        url: seed.url,
        normalizedUrl: seed.url,
        title: seed.title,
        sourceType: seed.sourceType,
        category: seed.category,
        ingestStatus: 'pending',
        pageKind: seed.pageKind,
        priority: seed.priority,
        metadata: {
          corpusSeed: seed.key,
          corpusRole: 'folio_discovery'
        }
      })
      .returning({ id: sources.id })

    ids.push(inserted[0].id)
  }

  return ids
}

function isFolioDiscoveryCandidate (row: {
  sourceType?: string | null
  metadata?: Record<string, unknown> | null
}) {
  const metadata = (row.metadata || {}) as Record<string, unknown>
  return row.sourceType === 'cra_folio_directory' || metadata.corpusRole === 'folio_discovery'
}

function isPublicationLandingUrl (url: string): boolean {
  if (url === CRA_PUBLICATIONS_CATALOG_URL) return false
  return isCatalogPublicationLandingUrl(url)
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
    .filter((row) => {
      const metadata = (row.metadata || {}) as Record<string, unknown>
      return (
        isPublicationLandingPendingExpand({
          url: row.url,
          pageKind: row.pageKind,
          metadata
        }) ||
        metadata.corpusRole === 'publication_landing'
      )
    })
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
        // No new child sources — ingest this page directly (common for French stubs).
        const existingMeta = (landing.metadata || {}) as Record<string, unknown>
        const { corpusRole: _removed, ...restMeta } = existingMeta
        const promotedMeta: Record<string, unknown> = {
          ...restMeta,
          publicationExpanded: true
        }
        if (isFrenchCraPublicationUrl(landing.url)) {
          promotedMeta.language = 'fr'
        }
        await db
          .update(sources)
          .set({
            pageKind: 'content',
            metadata: promotedMeta
          })
          .where(eq(sources.id, landing.id))
        summary.skipped += 1
      }
    } catch {
      summary.errors += 1
    }
  }

  return summary
}

/**
 * Discover Income Tax Folio chapters from CRA technical-information pages.
 * Folio S#-F#-C# chapters are not listed in publications.html.
 */
export async function discoverFolioDirectories (options: { limit?: number } = {}): Promise<{
  processed: number
  discovered: number
  contentSourcesCreated: number
  skipped: number
  errors: number
}> {
  await ensureDbValidated()
  const db = getDb()
  await ensureFolioDiscoverySeedSources()

  const limit = options.limit ?? 10
  const pending = await db
    .select()
    .from(sources)
    .where(eq(sources.ingestStatus, 'pending'))

  const candidates = pending
    .filter((row) => isFolioDiscoveryCandidate(row))
    .filter((row) => !isArchivedOrCancelledTitle(row.title))
    .slice(0, limit)

  const discovery = new CraFolioDiscoveryService()
  const summary = {
    processed: 0,
    discovered: 0,
    contentSourcesCreated: 0,
    skipped: 0,
    errors: 0
  }

  try {
    for (const row of candidates) {
      summary.processed += 1
      try {
        const result = await discovery.discoverFromSource(row.id)
        summary.discovered += 1
        summary.contentSourcesCreated += result.newSourcesCreated
        await db
          .update(sources)
          .set({
            ingestStatus: 'skipped',
            pageKind: result.pageKind || 'directory',
            errorMessage: 'Folio directory — child sources discovered'
          })
          .where(eq(sources.id, row.id))
      } catch {
        summary.errors += 1
      }
    }
  } finally {
    await discovery.close()
  }

  return summary
}

/** Full discovery: catalogue table, folio technical-information tree, then expand publication landings. */
export async function discoverFullPublicationsCorpus (options: {
  expandLimit?: number
  folioLimit?: number
} = {}) {
  const catalog = await discoverPublicationsCatalog()
  const folios = await discoverFolioDirectories({ limit: options.folioLimit ?? 10 })
  const expanded = await expandPublicationLandingPages({ limit: options.expandLimit ?? 100 })
  return { catalog, folios, expanded }
}

export async function reconcileTaxReferenceContentSources (): Promise<{
  created: number
  existing: number
}> {
  await ensureDbValidated()
  const db = getDb()
  let created = 0
  let existing = 0

  for (const seed of CRA_TAX_REFERENCE_CONTENT_SEEDS) {
    const row = await db
      .select({ id: sources.id })
      .from(sources)
      .where(eq(sources.url, seed.url))
      .limit(1)

    if (row[0]?.id) {
      existing += 1
      continue
    }

    await db.insert(sources).values({
      url: seed.url,
      normalizedUrl: seed.url,
      title: seed.title,
      sourceType: seed.sourceType,
      category: seed.category,
      ingestStatus: 'pending',
      pageKind: seed.pageKind,
      priority: seed.priority,
      metadata: {
        corpusSeed: seed.key,
        corpusRole: 'tax_reference',
        ...(seed.key === 't1_general_income_tax_package' ? { publicationNumber: '5000-G' } : {})
      }
    })
    created += 1
  }

  return { created, existing }
}

/** Reset embedding/API ingest failures so the job can retry after key or model fixes. */
export async function reconcileEmbeddingFailedSources (): Promise<{ updatedCount: number }> {
  await ensureDbValidated()
  const db = getDb()

  const result = await db.execute(sql`
    UPDATE taxgpt.sources
    SET ingest_status = 'pending',
        page_kind = 'content',
        error_code = NULL,
        error_message = NULL,
        last_attempt_at = NOW()
    WHERE ingest_status = 'failed'
      AND (
        error_message ILIKE '%embedding%'
        OR error_message ILIKE '%text-embedding%'
        OR error_message ILIKE '%does not have access to model%'
        OR error_message ILIKE '%incorrect api key%'
        OR error_message ILIKE '%invalid api key%'
      )
    RETURNING id
  `)

  const rows = result as unknown as Array<{ id: string }>
  return { updatedCount: rows.length }
}

/** Reset timeout/abort ingest failures so the job can retry after fetch tuning. */
export async function reconcileTimeoutFailedSources (): Promise<{ updatedCount: number }> {
  await ensureDbValidated()
  const db = getDb()

  const result = await db.execute(sql`
    UPDATE taxgpt.sources
    SET ingest_status = 'pending',
        error_code = NULL,
        error_message = NULL,
        last_attempt_at = NOW()
    WHERE ingest_status = 'failed'
      AND (
        error_message ILIKE '%aborted%'
        OR error_message ILIKE '%timeout%'
        OR error_message ILIKE '%timed out%'
      )
    RETURNING id
  `)

  const rows = result as unknown as Array<{ id: string }>
  return { updatedCount: rows.length }
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

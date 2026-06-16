import { getTaxgptFeedbackStats } from './taxgptFeedbackOpsService.js'

function mapCountRows (rows, keyField, countField = 'count') {
  return (rows || []).map((row) => ({
    key: String(row[keyField] ?? 'unknown'),
    count: Number(row[countField] || 0)
  }))
}

export async function getCorpusAudit (pool) {
  const [
    totalsResult,
    byIngestStatusResult,
    byCategoryResult,
    byPageKindResult,
    taxesHubRoleResult
  ] = await Promise.all([
    pool.query(`
      SELECT
        count(*)::int AS source_count,
        count(*) FILTER (WHERE ingest_status = 'ingested')::int AS ingested_source_count,
        count(*) FILTER (WHERE ingest_status = 'pending')::int AS pending_source_count,
        count(*) FILTER (WHERE ingest_status = 'skipped')::int AS skipped_source_count,
        count(*) FILTER (WHERE ingest_status = 'failed')::int AS failed_source_count,
        (SELECT count(*)::int FROM taxgpt.chunks) AS chunk_count,
        (SELECT count(*)::int FROM taxgpt.embeddings) AS embedding_count,
        EXISTS (
          SELECT 1 FROM taxgpt.embeddings WHERE embedding IS NOT NULL LIMIT 1
        ) AS retrieval_ready
      FROM taxgpt.sources
    `),
    pool.query(`
      SELECT ingest_status AS status, count(*)::int AS count
      FROM taxgpt.sources
      GROUP BY ingest_status
      ORDER BY count DESC
    `),
    pool.query(`
      SELECT coalesce(category, 'unknown') AS category, count(*)::int AS count
      FROM taxgpt.sources
      GROUP BY coalesce(category, 'unknown')
      ORDER BY count DESC
      LIMIT 25
    `),
    pool.query(`
      SELECT coalesce(page_kind, 'unknown') AS page_kind, count(*)::int AS count
      FROM taxgpt.sources
      GROUP BY coalesce(page_kind, 'unknown')
      ORDER BY count DESC
    `),
    pool.query(`
      SELECT coalesce(metadata->>'corpusRole', 'none') AS corpus_role, count(*)::int AS count
      FROM taxgpt.sources
      WHERE metadata::text LIKE '%taxes_hub%'
         OR url LIKE '%/en/services/taxes/%'
      GROUP BY coalesce(metadata->>'corpusRole', 'none')
      ORDER BY count DESC
    `)
  ])

  const totals = totalsResult.rows[0] || {}
  return {
    totals: {
      sourceCount: Number(totals.source_count || 0),
      ingestedSourceCount: Number(totals.ingested_source_count || 0),
      pendingSourceCount: Number(totals.pending_source_count || 0),
      skippedSourceCount: Number(totals.skipped_source_count || 0),
      failedSourceCount: Number(totals.failed_source_count || 0),
      chunkCount: Number(totals.chunk_count || 0),
      embeddingCount: Number(totals.embedding_count || 0),
      retrievalReady: Boolean(totals.retrieval_ready)
    },
    byIngestStatus: mapCountRows(byIngestStatusResult.rows, 'status'),
    byCategory: mapCountRows(byCategoryResult.rows, 'category'),
    byPageKind: mapCountRows(byPageKindResult.rows, 'page_kind'),
    taxesHubByCorpusRole: mapCountRows(taxesHubRoleResult.rows, 'corpus_role')
  }
}

export async function getTaxesHubStats (pool) {
  const { rows: [stats] } = await pool.query(`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE ingest_status = 'pending')::int AS pending,
      count(*) FILTER (WHERE ingest_status = 'ingested')::int AS ingested,
      count(*) FILTER (WHERE ingest_status = 'skipped')::int AS skipped,
      count(*) FILTER (WHERE ingest_status = 'failed')::int AS failed,
      count(*) FILTER (WHERE page_kind = 'unknown')::int AS unknown,
      count(*) FILTER (WHERE page_kind = 'content')::int AS content
    FROM taxgpt.sources
    WHERE metadata::text LIKE '%taxes_hub%'
       OR url LIKE '%/en/services/taxes/%'
  `)
  const { rows: [hubSeed] } = await pool.query(`
    SELECT count(*)::int AS hub_seed_sources
    FROM taxgpt.sources
    WHERE url = 'https://www.canada.ca/en/services/taxes.html'
  `)
  return {
    ...stats,
    hubSeedSources: Number(hubSeed?.hub_seed_sources || 0)
  }
}

export async function getFormRegistryStats (pool) {
  try {
    const [
      statsResult,
      byFamilyResult,
      recentResult
    ] = await Promise.all([
      pool.query(`
        SELECT
          count(*)::int AS total,
          count(*) FILTER (WHERE status = 'active')::int AS active,
          count(*) FILTER (WHERE status = 'archived')::int AS archived
        FROM taxgpt.form_registry
      `),
      pool.query(`
        SELECT form_family AS family, count(*)::int AS count
        FROM taxgpt.form_registry
        GROUP BY form_family
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT form_number AS "formNumber", title, status, landing_url AS "landingUrl"
        FROM taxgpt.form_registry
        ORDER BY catalog_discovered_at DESC
        LIMIT 8
      `)
    ])
    const stats = statsResult.rows[0] || { total: 0, active: 0, archived: 0 }
    return {
      totals: {
        total: Number(stats.total || 0),
        active: Number(stats.active || 0),
        archived: Number(stats.archived || 0)
      },
      byFamily: mapCountRows(byFamilyResult.rows, 'family'),
      recent: recentResult.rows
    }
  } catch (error) {
    if (error?.code === '42P01') {
      return {
        totals: { total: 0, active: 0, archived: 0 },
        byFamily: [],
        recent: [],
        tableMissing: true
      }
    }
    throw error
  }
}

export async function getOpsOverview (pool) {
  const [corpus, taxesHub, formRegistry, feedback] = await Promise.all([
    getCorpusAudit(pool),
    getTaxesHubStats(pool),
    getFormRegistryStats(pool),
    getTaxgptFeedbackStats(pool)
  ])
  return {
    generatedAt: new Date().toISOString(),
    corpus: corpus.totals,
    taxesHub,
    formRegistry: formRegistry.totals,
    feedback: feedback.totals
  }
}

export function getOpsExternalLinks () {
  return [
    {
      id: 'stripe',
      label: 'Stripe Dashboard',
      description: 'Subscriptions, invoices, customers, and webhooks',
      url: process.env.OPS_STRIPE_DASHBOARD_URL || 'https://dashboard.stripe.com/',
      category: 'billing'
    },
    {
      id: 'clerk',
      label: 'Clerk Dashboard',
      description: 'Users, organizations, sessions, and auth settings',
      url: process.env.OPS_CLERK_DASHBOARD_URL || 'https://dashboard.clerk.com/',
      category: 'auth'
    },
    {
      id: 'openai',
      label: 'OpenAI Platform',
      description: 'API usage, billing, and model settings',
      url: process.env.OPS_OPENAI_DASHBOARD_URL || 'https://platform.openai.com/usage',
      category: 'ai'
    },
    {
      id: 'digitalocean',
      label: 'DigitalOcean App Platform',
      description: 'Deployments, jobs, and runtime logs',
      url: process.env.OPS_DIGITALOCEAN_DASHBOARD_URL || 'https://cloud.digitalocean.com/apps',
      category: 'infrastructure'
    },
    {
      id: 'sanity',
      label: 'Sanity Studio',
      description: 'Marketing CMS content administration',
      url: process.env.OPS_SANITY_STUDIO_URL || 'https://www.sanity.io/manage',
      category: 'content'
    }
  ]
}

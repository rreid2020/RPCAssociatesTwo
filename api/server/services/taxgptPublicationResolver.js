import { extractPublicationCodesFromQuery } from './taxgptRetrievalFilters.js'

/**
 * Resolve CRA publication codes named in a user query against the corpus index.
 * @param {import('pg').Pool} pool
 * @param {string} query
 */
export async function resolveRequestedPublications (pool, query) {
  const codes = extractPublicationCodesFromQuery(query)
  if (codes.length === 0) return []

  const results = []
  for (const code of codes) {
    const { rows } = await pool.query(
      `
        SELECT
          title,
          url,
          ingest_status AS "ingestStatus",
          error_message AS "errorMessage",
          category
        FROM taxgpt.sources
        WHERE LOWER(url) LIKE '%/publications/' || $1 || '%'
           OR LOWER(url) LIKE '%/pub/' || $1 || '/%'
           OR LOWER(url) LIKE '%/' || $1 || '.%'
           OR LOWER(url) LIKE '%/' || $1 || '-%'
           OR LOWER(COALESCE(metadata->>'publicationNumber', '')) = $1
           OR LOWER(title) LIKE '%' || $1 || '%'
        ORDER BY
          CASE ingest_status
            WHEN 'ingested' THEN 0
            WHEN 'pending' THEN 1
            WHEN 'failed' THEN 2
            ELSE 3
          END,
          last_ingested_at DESC NULLS LAST,
          discovered_at DESC
        LIMIT 8
      `,
      [code]
    )

    const ingested = rows.filter((row) => row.ingestStatus === 'ingested')
    const skipped = rows.filter((row) => row.ingestStatus === 'skipped')
    const pending = rows.filter((row) => row.ingestStatus === 'pending')

    let status = 'not_indexed'
    let reason = null
    let representative = rows[0] || null

    if (ingested.length > 0) {
      status = 'ingested'
      representative = ingested[0]
    } else if (skipped.length > 0) {
      status = 'skipped'
      representative = skipped[0]
      reason = representative.errorMessage ||
        (/(cancelled|canceled|archived)/i.test(representative.title || '') ? 'Archived/Cancelled by CRA' : 'Skipped during ingestion')
    } else if (pending.length > 0) {
      status = 'pending'
      representative = pending[0]
      reason = 'Discovered but not yet ingested'
    } else if (rows.length > 0) {
      status = rows[0].ingestStatus || 'unknown'
      representative = rows[0]
      reason = rows[0].errorMessage || null
    }

    results.push({
      code: code.toUpperCase(),
      status,
      reason,
      title: representative?.title || null,
      url: representative?.url || null,
      ingestedCount: ingested.length,
      matchCount: rows.length
    })
  }

  return results
}

/**
 * @param {Array<Record<string, unknown>>} requested
 */
export function formatRequestedPublicationsContext (requested) {
  if (!requested.length) return ''

  const lines = requested.map((item) => {
    if (item.status === 'ingested') {
      return `- ${item.code}: available in corpus (${item.title || 'ingested source'}). Prioritize this publication when retrieved excerpts include it.`
    }
    if (item.status === 'skipped') {
      return `- ${item.code}: indexed but NOT available for retrieval (${item.reason || 'skipped'}). Do not claim to have reviewed this guide. State clearly it is unavailable and explain why if known.`
    }
    if (item.status === 'pending') {
      return `- ${item.code}: discovered in corpus but not yet ingested (${item.reason || 'pending ingestion'}).`
    }
    return `- ${item.code}: not found in corpus index. State that this publication is not currently available.`
  })

  return `Requested publications:\n${lines.join('\n')}`
}

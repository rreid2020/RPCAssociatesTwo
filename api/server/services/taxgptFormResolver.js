import { extractFormCodesFromQuery } from './taxgptRetrievalFilters.js'

/**
 * Resolve CRA form numbers named in a user query against taxgpt.form_registry.
 * @param {import('pg').Pool} pool
 * @param {string} query
 */
export async function resolveRequestedForms (pool, query) {
  const codes = extractFormCodesFromQuery(query)
  if (codes.length === 0) return []

  const results = []
  for (const code of codes) {
    let rows = []
    try {
      const queryResult = await pool.query(
        `
          SELECT
            form_number AS "formNumber",
            title,
            landing_url AS "landingUrl",
            status,
            form_family AS "formFamily",
            last_update AS "lastUpdate"
          FROM taxgpt.form_registry
          WHERE form_number = $1
             OR LOWER(title) LIKE '%' || $1 || '%'
          ORDER BY
            CASE WHEN form_number = $1 THEN 0 ELSE 1 END,
            updated_at DESC
          LIMIT 4
        `,
        [code]
      )
      rows = queryResult.rows
    } catch (error) {
      if (error?.code !== '42P01') throw error
      rows = []
    }

    const exact = rows.find((row) => String(row.formNumber || '').toUpperCase() === code)
    const representative = exact || rows[0] || null

    let status = 'not_indexed'
    let reason = null

    if (representative) {
      if (representative.status === 'archived') {
        status = 'archived'
        reason = 'Archived or cancelled by CRA'
      } else {
        status = 'active'
      }
    }

    results.push({
      code,
      status,
      reason,
      title: representative?.title || null,
      url: representative?.landingUrl || null,
      formFamily: representative?.formFamily || null,
      lastUpdate: representative?.lastUpdate || null,
      matchCount: rows.length
    })
  }

  return results
}

/**
 * @param {Array<Record<string, unknown>>} requested
 */
export function formatRequestedFormsContext (requested) {
  if (!requested.length) return ''

  const lines = requested.map((item) => {
    if (item.status === 'active') {
      return `- ${item.code}: listed in CRA forms catalog (${item.title || 'active form'}). Use this as authoritative form metadata; instructions may still require retrieved corpus excerpts.`
    }
    if (item.status === 'archived') {
      return `- ${item.code}: archived/cancelled in CRA forms catalog (${item.reason || 'archived'}). Do not treat as a current filing form.`
    }
    return `- ${item.code}: not found in CRA forms catalog. State that this form is not currently listed.`
  })

  return `Requested forms:\n${lines.join('\n')}`
}

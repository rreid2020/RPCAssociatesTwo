function inferDocumentType (fileName = '') {
  const n = String(fileName).toUpperCase()
  if (n.includes('T4')) return 'T4'
  if (n.includes('T5')) return 'T5'
  if (n.includes('T3')) return 'T3'
  return 'UNKNOWN'
}

function inferTaxYear (fileName = '') {
  const m = String(fileName).match(/(20\d{2})/)
  if (!m) return null
  const y = Number(m[1])
  return Number.isInteger(y) ? y : null
}

export async function listSourceDocuments (pool, clerkUserId) {
  const { rows } = await pool.query(
    `SELECT f.*,
            m.tax_year,
            m.document_type,
            m.taxpayer_name,
            m.suggested_match,
            m.suggestion_status
     FROM taxgpt.portal_client_files f
     LEFT JOIN taxgpt.documents_tax_metadata m ON m.document_id = f.id
     WHERE f.clerk_user_id = $1
     ORDER BY f.created_at DESC`,
    [clerkUserId]
  )
  return rows
}

export async function tagDocumentMetadata (pool, clerkUserId, documentId, payload = {}) {
  const { rows: files } = await pool.query(
    `SELECT id, file_name
     FROM taxgpt.portal_client_files
     WHERE id = $1::uuid AND clerk_user_id = $2`,
    [documentId, clerkUserId]
  )
  const file = files[0]
  if (!file) return null

  const taxYear = payload.taxYear != null ? Number(payload.taxYear) : inferTaxYear(file.file_name)
  const documentType = payload.documentType || inferDocumentType(file.file_name)
  const taxpayerName = payload.taxpayerName || null
  const suggestionStatus = payload.suggestionStatus || 'pending'
  const suggestedMatch = payload.suggestedMatch === true
  const taxReturnId = payload.taxReturnId || null

  const { rows } = await pool.query(
    `INSERT INTO taxgpt.documents_tax_metadata
     (clerk_user_id, document_id, tax_return_id, tax_year, document_type, taxpayer_name, suggested_match, suggestion_status, metadata, updated_at)
     VALUES ($1, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9::jsonb, now())
     ON CONFLICT (document_id)
     DO UPDATE SET tax_return_id = EXCLUDED.tax_return_id,
                   tax_year = EXCLUDED.tax_year,
                   document_type = EXCLUDED.document_type,
                   taxpayer_name = EXCLUDED.taxpayer_name,
                   suggested_match = EXCLUDED.suggested_match,
                   suggestion_status = EXCLUDED.suggestion_status,
                   metadata = EXCLUDED.metadata,
                   updated_at = now()
     RETURNING *`,
    [
      clerkUserId,
      documentId,
      taxReturnId,
      Number.isInteger(taxYear) ? taxYear : null,
      documentType,
      taxpayerName,
      suggestedMatch,
      suggestionStatus,
      JSON.stringify(payload.metadata || {})
    ]
  )
  return rows[0] || null
}

export async function suggestDocumentsForReturn (pool, clerkUserId, taxReturnId) {
  const { rows: returnRows } = await pool.query(
    `SELECT tr.tax_year, tp.full_name
     FROM taxgpt.tax_returns tr
     INNER JOIN taxgpt.taxpayers tp ON tp.id = tr.taxpayer_id
     WHERE tr.id = $1::uuid AND tr.clerk_user_id = $2`,
    [taxReturnId, clerkUserId]
  )
  const taxReturn = returnRows[0]
  if (!taxReturn) return null

  const { rows: docs } = await pool.query(
    `SELECT f.id, f.file_name, f.created_at
     FROM taxgpt.portal_client_files f
     WHERE f.clerk_user_id = $1
     ORDER BY f.created_at DESC`,
    [clerkUserId]
  )

  const suggestions = []
  for (const doc of docs) {
    const inferredYear = inferTaxYear(doc.file_name)
    const inferredType = inferDocumentType(doc.file_name)
    const likely = (inferredYear == null || inferredYear === Number(taxReturn.tax_year)) && inferredType !== 'UNKNOWN'
    if (!likely) continue
    const tagged = await tagDocumentMetadata(pool, clerkUserId, doc.id, {
      taxReturnId,
      taxYear: inferredYear,
      documentType: inferredType,
      taxpayerName: taxReturn.full_name,
      suggestedMatch: true,
      suggestionStatus: 'suggested',
      metadata: { autoMatched: true }
    })
    if (tagged) suggestions.push(tagged)
  }
  return suggestions
}

export async function setDocumentSuggestionStatus (pool, clerkUserId, documentId, status) {
  const accepted = ['accepted', 'ignored', 'pending', 'suggested']
  const nextStatus = accepted.includes(status) ? status : 'pending'
  const { rows } = await pool.query(
    `UPDATE taxgpt.documents_tax_metadata
     SET suggestion_status = $1,
         suggested_match = $2,
         updated_at = now()
     WHERE document_id = $3::uuid AND clerk_user_id = $4
     RETURNING *`,
    [nextStatus, nextStatus === 'accepted' || nextStatus === 'suggested', documentId, clerkUserId]
  )
  return rows[0] || null
}

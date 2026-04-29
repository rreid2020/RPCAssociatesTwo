/**
 * OCR service scaffold.
 * In production this should call a real OCR provider (e.g. Vision API/Textract)
 * using the existing stored object key from portal_client_files.
 */
export async function extractOcrTextFromDocument (pool, clerkUserId, documentId) {
  const { rows } = await pool.query(
    `SELECT id, file_name, storage_key, mime, size_bytes
     FROM taxgpt.portal_client_files
     WHERE id = $1::uuid AND clerk_user_id = $2`,
    [documentId, clerkUserId]
  )
  const doc = rows[0]
  if (!doc) return null

  // Deterministic placeholder text containing key hints for downstream parser scaffold.
  const ocrText = [
    `FILE_NAME: ${doc.file_name}`,
    `MIME: ${doc.mime || ''}`,
    `SIZE: ${doc.size_bytes || 0}`,
    `POSSIBLE_SLIP: ${doc.file_name.toUpperCase().includes('T4') ? 'T4' : doc.file_name.toUpperCase().includes('T5') ? 'T5' : doc.file_name.toUpperCase().includes('T3') ? 'T3' : 'UNKNOWN'}`
  ].join('\n')

  return {
    document: doc,
    text: ocrText
  }
}

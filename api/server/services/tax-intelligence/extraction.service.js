import {
  detectSlipTypeFromText,
  extractStructuredDataFromSchema,
  confidenceFromBoxes
} from './slipExtraction.service.js'
import { getSlipSchema } from './slipSchema.service.js'
import { getSlipCodesForDetection } from './slipMapping.service.js'

function parseMoney (text, labelRegex) {
  const m = text.match(labelRegex)
  if (!m) return null
  const capture = m[2] != null ? m[2] : m[1]
  const v = Number(String(capture).replace(/[$, ]/g, ''))
  return Number.isFinite(v) ? v : null
}

/** Legacy fallback when slip schema is unavailable. */
function buildLegacySchema (slipType, text) {
  if (slipType === 'T4') {
    return {
      employment_income: parseMoney(text, /employment[_\s-]*income[:\s$]*([0-9,.\-]+)/i),
      cpp_contributions: parseMoney(text, /cpp[_\s-]*(contributions?)[:\s$]*([0-9,.\-]+)/i) ?? parseMoney(text, /cpp[:\s$]*([0-9,.\-]+)/i),
      ei_contributions: parseMoney(text, /ei[_\s-]*(contributions?)[:\s$]*([0-9,.\-]+)/i) ?? parseMoney(text, /ei[:\s$]*([0-9,.\-]+)/i),
      income_tax_deducted: parseMoney(text, /income[_\s-]*tax[_\s-]*deducted[:\s$]*([0-9,.\-]+)/i)
    }
  }
  return {}
}

function confidenceFromLegacy (schema, slipType) {
  const values = Object.values(schema)
  const filled = values.filter((v) => v != null).length
  const total = values.length
  if (slipType === 'UNKNOWN' || total === 0) return 0.2
  return Math.min(0.98, 0.35 + (filled / total) * 0.6)
}

export async function extractStructuredDataFromText (text, pool = null) {
  if (pool) {
    const slipCodes = await getSlipCodesForDetection(pool)
    const slipType = detectSlipTypeFromText(text, slipCodes)
    if (slipType !== 'UNKNOWN') {
      const schema = await getSlipSchema(pool, slipType)
      if (schema?.boxes?.length) {
        return extractStructuredDataFromSchema(text, schema, slipType)
      }
    }
  }

  const slipType = detectSlipTypeFromText(text, ['T5018', 'T5013', 'T5007', 'T4PS', 'T4A-NR', 'T4A-RCA', 'T4FHSA', 'T4A', 'T4E', 'T4RSP', 'T4RIF', 'T4', 'T5', 'T3', 'NR4', 'T1198', 'T1212'])
  const legacy = buildLegacySchema(slipType, text)
  const confidence = confidenceFromLegacy(legacy, slipType)
  return {
    slipType,
    boxes: {},
    extracted: legacy,
    confidence,
    reviewRequired: confidence < 0.75
  }
}

export async function persistDocumentExtraction (pool, clerkUserId, payload) {
  const extractionStatus = payload.reviewRequired ? 'REVIEW_REQUIRED' : 'EXTRACTED'
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.document_extractions
     (clerk_user_id, document_id, tax_return_id, extraction_status, extraction_type, confidence_score, review_required, ocr_text, extracted_json, parser_version, reviewed_by_user, reviewed_at, updated_at)
     VALUES ($1, $2::uuid, $3::uuid, $4, 'OCR', $5, $6, $7, $8::jsonb, 'v2', false, null, now())
     RETURNING *`,
    [
      clerkUserId,
      payload.documentId,
      payload.taxReturnId || null,
      extractionStatus,
      Number(payload.confidence || 0),
      Boolean(payload.reviewRequired),
      payload.ocrText || null,
      JSON.stringify({
        slipType: payload.slipType || 'UNKNOWN',
        boxes: payload.boxes || {},
        data: payload.extracted || {}
      })
    ]
  )
  return rows[0] || null
}

export async function markExtractionReviewed (pool, clerkUserId, extractionId) {
  const { rows } = await pool.query(
    `UPDATE taxgpt.document_extractions
     SET reviewed_by_user = true,
         reviewed_at = now(),
         extraction_status = 'CONFIRMED',
         review_required = false,
         updated_at = now()
     WHERE id = $1::uuid AND clerk_user_id = $2
     RETURNING *`,
    [extractionId, clerkUserId]
  )
  return rows[0] || null
}

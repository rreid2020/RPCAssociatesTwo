function parseMoney (text, labelRegex) {
  const m = text.match(labelRegex)
  if (!m) return null
  const v = Number(String(m[1]).replace(/[$, ]/g, ''))
  return Number.isFinite(v) ? v : null
}

function detectSlipType (text = '') {
  const t = String(text).toUpperCase()
  if (/\bT5018\b/.test(t)) return 'T5018'
  if (/\bT5013\b/.test(t)) return 'T5013'
  if (/\bT5007\b/.test(t)) return 'T5007'
  if (/\bT4PS\b/.test(t)) return 'T4PS'
  if (/\bT4A\b/.test(t)) return 'T4A'
  if (/\bT4E\b/.test(t)) return 'T4E'
  if (/\bT4RSP\b/.test(t)) return 'T4RSP'
  if (/\bT4RIF\b/.test(t)) return 'T4RIF'
  if (/\bT4\b/.test(t)) return 'T4'
  if (/\bT5\b/.test(t)) return 'T5'
  if (/\bT3\b/.test(t)) return 'T3'
  return 'UNKNOWN'
}

function buildSchema (slipType, text) {
  if (slipType === 'T4') {
    return {
      employer_name: null,
      employment_income: parseMoney(text, /employment[_\s-]*income[:\s$]*([0-9,.\-]+)/i),
      cpp_contributions: parseMoney(text, /cpp[_\s-]*(contributions?)[:\s$]*([0-9,.\-]+)/i) ?? parseMoney(text, /cpp[:\s$]*([0-9,.\-]+)/i),
      ei_contributions: parseMoney(text, /ei[_\s-]*(contributions?)[:\s$]*([0-9,.\-]+)/i) ?? parseMoney(text, /ei[:\s$]*([0-9,.\-]+)/i),
      income_tax_deducted: parseMoney(text, /income[_\s-]*tax[_\s-]*deducted[:\s$]*([0-9,.\-]+)/i)
    }
  }
  if (slipType === 'T5') {
    return {
      interest_income: parseMoney(text, /interest[_\s-]*income[:\s$]*([0-9,.\-]+)/i),
      dividend_income: parseMoney(text, /dividend[_\s-]*income[:\s$]*([0-9,.\-]+)/i),
      eligible_dividends: parseMoney(text, /eligible[_\s-]*dividends?[:\s$]*([0-9,.\-]+)/i)
    }
  }
  if (slipType === 'T3') {
    return {
      trust_income: parseMoney(text, /trust[_\s-]*income[:\s$]*([0-9,.\-]+)/i),
      capital_gains: parseMoney(text, /capital[_\s-]*gains?[:\s$]*([0-9,.\-]+)/i),
      other_income: parseMoney(text, /other[_\s-]*income[:\s$]*([0-9,.\-]+)/i)
    }
  }
  if (slipType === 'T4A') {
    return {
      pension_income: parseMoney(text, /pension(?:\s+or\s+superannuation)?[:\s$]*([0-9,.\-]+)/i),
      fees_for_services: parseMoney(text, /fees?\s+for\s+services[:\s$]*([0-9,.\-]+)/i),
      income_tax_deducted: parseMoney(text, /income[_\s-]*tax[_\s-]*deducted[:\s$]*([0-9,.\-]+)/i)
    }
  }
  if (slipType === 'T4E') {
    return {
      total_benefits_paid: parseMoney(text, /total[_\s-]*benefits[_\s-]*paid[:\s$]*([0-9,.\-]+)/i),
      income_tax_deducted: parseMoney(text, /income[_\s-]*tax[_\s-]*deducted[:\s$]*([0-9,.\-]+)/i)
    }
  }
  if (slipType === 'T4RSP') {
    return {
      rrsp_income: parseMoney(text, /rrsp[_\s-]*income[:\s$]*([0-9,.\-]+)/i),
      income_tax_deducted: parseMoney(text, /income[_\s-]*tax[_\s-]*deducted[:\s$]*([0-9,.\-]+)/i)
    }
  }
  if (slipType === 'T4RIF') {
    return {
      taxable_amount: parseMoney(text, /taxable[_\s-]*amount[:\s$]*([0-9,.\-]+)/i),
      income_tax_deducted: parseMoney(text, /income[_\s-]*tax[_\s-]*deducted[:\s$]*([0-9,.\-]+)/i)
    }
  }
  if (slipType === 'T5007') {
    return {
      social_assistance_payments: parseMoney(text, /social[_\s-]*assistance(?:[_\s-]*payments?)?[:\s$]*([0-9,.\-]+)/i),
      workers_compensation_benefits: parseMoney(text, /workers?[_\s-]*compensation(?:[_\s-]*benefits?)?[:\s$]*([0-9,.\-]+)/i)
    }
  }
  if (slipType === 'T5013') {
    return {
      business_income: parseMoney(text, /business[_\s-]*income[:\s$]*([0-9,.\-]+)/i),
      capital_gains: parseMoney(text, /capital[_\s-]*gains?[:\s$]*([0-9,.\-]+)/i)
    }
  }
  if (slipType === 'T5018') {
    return {
      contract_payments: parseMoney(text, /contract[_\s-]*payments?[:\s$]*([0-9,.\-]+)/i)
    }
  }
  if (slipType === 'T4PS') {
    return {
      amount_allocated_by_trustee: parseMoney(text, /amount[_\s-]*allocated[_\s-]*by[_\s-]*trustee[:\s$]*([0-9,.\-]+)/i),
      amount_paid_out_of_plan: parseMoney(text, /amount[_\s-]*paid[_\s-]*out[_\s-]*of[_\s-]*plan[:\s$]*([0-9,.\-]+)/i)
    }
  }
  return {}
}

function confidenceFromSchema (schema, slipType) {
  const values = Object.values(schema)
  const filled = values.filter((v) => v != null).length
  const total = values.length
  if (slipType === 'UNKNOWN' || total === 0) return 0.2
  return Math.min(0.98, 0.35 + (filled / total) * 0.6)
}

export async function extractStructuredDataFromText (text) {
  const slipType = detectSlipType(text)
  const data = buildSchema(slipType, text)
  const confidence = confidenceFromSchema(data, slipType)
  return {
    slipType,
    extracted: data,
    confidence,
    reviewRequired: confidence < 0.75
  }
}

export async function persistDocumentExtraction (pool, clerkUserId, payload) {
  const extractionStatus = payload.reviewRequired ? 'REVIEW_REQUIRED' : 'EXTRACTED'
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.document_extractions
     (clerk_user_id, document_id, tax_return_id, extraction_status, extraction_type, confidence_score, review_required, ocr_text, extracted_json, parser_version, reviewed_by_user, reviewed_at, updated_at)
     VALUES ($1, $2::uuid, $3::uuid, $4, 'OCR', $5, $6, $7, $8::jsonb, 'v1', false, null, now())
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

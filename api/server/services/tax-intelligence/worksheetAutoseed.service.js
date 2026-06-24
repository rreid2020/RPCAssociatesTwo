import { classifyRegistryWorksheet } from '../../lib/taxSlips/registryWorksheetClassifier.js'
import { extractWorksheetFieldsFromLandingUrl } from '../../lib/taxSlips/craWorksheetExtractor.js'
import { COMPLETE_SLIP_DEFINITIONS_BY_CODE } from '../../lib/taxSlips/slipDefinitions.seed.js'
import { COMPLETE_FORM_WORKSHEET_DEFINITIONS } from '../../lib/taxSlips/formWorksheetDefinitions.seed.js'
import {
  getSlipSchemaByFormNumber,
  replaceSlipBoxSchemas,
  upsertSlipSchema
} from './slipSchema.repository.js'
import {
  getFormWorksheetSchemaByFormNumber,
  replaceFormWorksheetFields,
  upsertFormRegistryEntry,
  upsertFormWorksheetSchema
} from './formWorksheet.repository.js'

const COMPLETE_SLIP_CODES = new Set(Object.keys(COMPLETE_SLIP_DEFINITIONS_BY_CODE))
const COMPLETE_FORM_CODES = new Set(
  COMPLETE_FORM_WORKSHEET_DEFINITIONS.map((d) => String(d.code).toUpperCase())
)

const MIN_SLIP_BOXES = 3
const MIN_FORM_FIELDS = 5

function groupFormFieldsIntoSections (fields = []) {
  return [{
    id: 'extracted',
    title: 'Extracted fields (current CRA source)',
    description: 'Auto-extracted from the current fillable PDF. Review and refine as needed.',
    fields: fields.map((field) => ({
      code: field.code,
      label: field.label,
      type: field.type || 'currency',
      lineRef: field.code
    }))
  }]
}

export async function autoseedWorksheetFromCra (pool, row, { force = false } = {}) {
  const classification = classifyRegistryWorksheet(row)
  if (!classification.requiresWorksheet || !classification.landingUrl) {
    return { formNumber: classification.formNumber, skipped: true, reason: 'not_required' }
  }

  const code = classification.formNumber
  const codeUpper = code.toUpperCase()

  if (classification.worksheetKind === 'slip') {
    if (COMPLETE_SLIP_CODES.has(code) && !force) {
      return { formNumber: code, skipped: true, reason: 'hand_curated_slip' }
    }
    const existing = await getSlipSchemaByFormNumber(pool, code)
    if (existing?.schema_status === 'complete' && !force) {
      return { formNumber: code, skipped: true, reason: 'already_complete' }
    }

    const extracted = await extractWorksheetFieldsFromLandingUrl(classification.landingUrl, { worksheetKind: 'slip' })
    if (extracted.fields.length < MIN_SLIP_BOXES) {
      return {
        formNumber: code,
        skipped: true,
        reason: extracted.error || 'insufficient_fields',
        fieldCount: extracted.fields.length,
        sourceUrl: extracted.sourceUrl
      }
    }

    const schema = await upsertSlipSchema(pool, {
      formNumber: code,
      title: classification.title,
      schemaStatus: 'complete',
      metadata: {
        seededFrom: 'cra_autoseed_v1',
        sourceUrl: extracted.sourceUrl,
        extractedAt: new Date().toISOString()
      }
    })
    await replaceSlipBoxSchemas(pool, schema.id, extracted.fields.map((f) => ({
      code: f.code,
      label: f.label,
      type: f.type || 'currency',
      targets: []
    })))

    return {
      formNumber: code,
      worksheetKind: 'slip',
      status: 'complete',
      fieldCount: extracted.fields.length,
      sourceUrl: extracted.sourceUrl
    }
  }

  if (COMPLETE_FORM_CODES.has(codeUpper) && !force) {
    return { formNumber: code, skipped: true, reason: 'hand_curated_form' }
  }
  const existingForm = await getFormWorksheetSchemaByFormNumber(pool, code)
  if (existingForm?.schema_status === 'complete' && !force) {
    return { formNumber: code, skipped: true, reason: 'already_complete' }
  }

  const extracted = await extractWorksheetFieldsFromLandingUrl(classification.landingUrl, { worksheetKind: 'form' })
  if (extracted.fields.length < MIN_FORM_FIELDS) {
    return {
      formNumber: code,
      skipped: true,
      reason: extracted.error || 'insufficient_fields',
      fieldCount: extracted.fields.length,
      sourceUrl: extracted.sourceUrl
    }
  }

  await upsertFormRegistryEntry(pool, {
    formNumber: code,
    title: classification.title,
    landingUrl: classification.landingUrl,
    formFamily: classification.artifactKind === 't1_schedule' ? 't1_schedule' : 't1_form',
    metadata: { autoseed: true }
  })

  const schema = await upsertFormWorksheetSchema(pool, {
    formNumber: code,
    title: classification.title,
    formFamily: classification.artifactKind === 't1_schedule' ? 't1_schedule' : 't1_form',
    schemaStatus: 'complete',
    landingUrl: classification.landingUrl,
    metadata: {
      seededFrom: 'cra_autoseed_v1',
      sourceUrl: extracted.sourceUrl,
      extractedAt: new Date().toISOString(),
      artifactKind: classification.artifactKind
    }
  })

  await replaceFormWorksheetFields(pool, schema.id, groupFormFieldsIntoSections(extracted.fields))

  return {
    formNumber: code,
    worksheetKind: 'form',
    status: 'complete',
    fieldCount: extracted.fields.length,
    sourceUrl: extracted.sourceUrl
  }
}

export async function autoseedRegistryWorksheetsBatch (pool, {
  limit = 25,
  onlyPending = true,
  force = false
} = {}) {
  const { rows } = await pool.query(
    `SELECT form_number, title, landing_url
     FROM taxgpt.form_registry
     WHERE status = 'active'
     ORDER BY form_number ASC`
  )

  const results = []
  let processed = 0

  for (const row of rows) {
    if (processed >= limit) break
    const classification = classifyRegistryWorksheet(row)
    if (!classification.requiresWorksheet) continue

    if (onlyPending) {
      if (classification.worksheetKind === 'slip' && COMPLETE_SLIP_CODES.has(classification.formNumber) && !force) continue
      if (classification.worksheetKind !== 'slip' && COMPLETE_FORM_CODES.has(classification.formNumber.toUpperCase()) && !force) continue
    }

    const result = await autoseedWorksheetFromCra(pool, row, { force })
    if (!result.skipped || force) processed += 1
    results.push(result)
  }

  return { processed, results }
}

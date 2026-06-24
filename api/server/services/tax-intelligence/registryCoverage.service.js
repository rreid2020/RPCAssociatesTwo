import { COMPLETE_FORM_WORKSHEET_DEFINITIONS } from '../../lib/taxSlips/formWorksheetDefinitions.seed.js'
import { COMPLETE_SLIP_DEFINITIONS } from '../../lib/taxSlips/slipDefinitions.seed.js'
import { classifyRegistryWorksheet } from '../../lib/taxSlips/registryWorksheetClassifier.js'
import { listFormWorksheetsForReturnBuilder } from './formWorksheet.service.js'
import { listSlipSchemasForReturnBuilder } from './slipSchema.service.js'

const COMPLETE_SLIP_CODES = new Set(COMPLETE_SLIP_DEFINITIONS.map((d) => String(d.code).toUpperCase()))
const COMPLETE_FORM_CODES = new Set(COMPLETE_FORM_WORKSHEET_DEFINITIONS.map((d) => String(d.code).toUpperCase()))

async function queryActiveRegistry (pool) {
  const { rows } = await pool.query(
    `SELECT form_number, title, landing_url, form_family, status
     FROM taxgpt.form_registry
     WHERE status = 'active'
     ORDER BY form_number ASC`
  )
  return rows
}

function slipStatus (schema) {
  if (!schema) return 'missing'
  if (schema.schemaStatus === 'complete' || COMPLETE_SLIP_CODES.has(String(schema.code).toUpperCase())) {
    return schema.boxes?.length ? 'complete' : 'incomplete_boxes'
  }
  return schema.schemaStatus || 'catalog_only'
}

function formStatus (schema) {
  if (!schema) return 'missing'
  if (schema.schemaStatus === 'complete' || COMPLETE_FORM_CODES.has(String(schema.code).toUpperCase())) {
    return schema.fieldCount > 0 || schema.sections?.some((s) => s.fields?.length) ? 'complete' : 'incomplete_fields'
  }
  return schema.schemaStatus || 'catalog_only'
}

export async function getRegistryCoverageReport (pool) {
  const [registryRows, slipSchemas, formSchemas] = await Promise.all([
    queryActiveRegistry(pool),
    listSlipSchemasForReturnBuilder(pool),
    listFormWorksheetsForReturnBuilder(pool)
  ])

  const slipsByCode = Object.fromEntries(slipSchemas.map((s) => [String(s.code).toUpperCase(), s]))
  const formsByCode = Object.fromEntries(formSchemas.map((s) => [String(s.code).toUpperCase(), s]))

  function lookupSlip (code) {
    const upper = String(code || '').toUpperCase()
    return slipsByCode[upper] || slipsByCode[upper.replace(/\s+/g, '')]
  }

  function lookupForm (code) {
    const upper = String(code || '').toUpperCase()
    return formsByCode[upper] || formsByCode[upper.replace(/\s+/g, '')]
  }

  const entries = []
  const summary = {
    registryTotal: registryRows.length,
    requiresWorksheet: 0,
    complete: 0,
    catalogOnly: 0,
    missing: 0,
    incomplete: 0,
    guidesExcluded: 0,
    slipComplete: 0,
    slipPending: 0,
    formComplete: 0,
    formPending: 0
  }

  for (const row of registryRows) {
    const classification = classifyRegistryWorksheet(row)
    let status = 'not_required'
    let fieldCount = 0
    let schemaStatus = null

    if (classification.requiresWorksheet) {
      summary.requiresWorksheet += 1
      if (classification.worksheetKind === 'slip') {
        const schema = lookupSlip(classification.formNumber)
        status = slipStatus(schema)
        fieldCount = schema?.boxes?.length || 0
        schemaStatus = schema?.schemaStatus || null
        if (status === 'complete') summary.slipComplete += 1
        else summary.slipPending += 1
      } else {
        const schema = lookupForm(classification.formNumber)
        status = formStatus(schema)
        fieldCount = schema?.fieldCount
          ?? schema?.sections?.reduce((n, s) => n + (s.fields?.length || 0), 0)
          ?? 0
        schemaStatus = schema?.schemaStatus || null
        if (status === 'complete') summary.formComplete += 1
        else summary.formPending += 1
      }

      if (status === 'complete') summary.complete += 1
      else if (status === 'missing') summary.missing += 1
      else if (status === 'catalog_only') summary.catalogOnly += 1
      else summary.incomplete += 1
    } else {
      summary.guidesExcluded += 1
    }

    entries.push({
      formNumber: classification.formNumber,
      title: classification.title,
      landingUrl: classification.landingUrl,
      worksheetKind: classification.worksheetKind,
      worksheetStore: classification.worksheetStore,
      requiresWorksheet: classification.requiresWorksheet,
      status,
      schemaStatus,
      fieldCount
    })
  }

  summary.percentComplete = summary.requiresWorksheet
    ? Math.round((summary.complete / summary.requiresWorksheet) * 1000) / 10
    : 100

  return {
    summary,
    entries,
    pending: entries
      .filter((e) => e.requiresWorksheet && e.status !== 'complete')
      .sort((a, b) => a.formNumber.localeCompare(b.formNumber))
  }
}

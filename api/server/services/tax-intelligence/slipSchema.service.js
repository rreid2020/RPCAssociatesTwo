import { COMPLETE_SLIP_DEFINITIONS } from '../../lib/taxSlips/slipDefinitions.seed.js'
import {
  countSlipSchemas,
  getSlipSchemaByFormNumber,
  inferPayerLabel,
  listCatalogSlipCandidates,
  listSlipSchemasWithBoxes,
  replaceSlipBoxSchemas,
  upsertSlipSchema
} from './slipSchema.repository.js'

let slipSchemaSeedPromise = null

function mapSchemaRow (row) {
  if (!row) return null
  return {
    code: row.formNumber,
    name: row.title,
    payerLabel: row.payerLabel,
    slipKind: row.slipKind,
    schemaStatus: row.schemaStatus,
    catalogTitle: row.catalogTitle,
    taxYearsSupported: Array.isArray(row.taxYearsSupported) ? row.taxYearsSupported : [],
    boxes: Array.isArray(row.boxes) ? row.boxes : []
  }
}

export async function ensureSlipSchemasSeeded (pool) {
  if (!slipSchemaSeedPromise) {
    slipSchemaSeedPromise = seedSlipSchemas(pool).catch((error) => {
      slipSchemaSeedPromise = null
      throw error
    })
  }
  return slipSchemaSeedPromise
}

export async function seedSlipSchemas (pool) {
  for (const definition of COMPLETE_SLIP_DEFINITIONS) {
    const schema = await upsertSlipSchema(pool, {
      formNumber: definition.code,
      title: definition.name,
      payerLabel: definition.payerLabel,
      slipKind: 'information_slip',
      schemaStatus: 'complete',
      catalogTitle: definition.name,
      metadata: { seededFrom: 'complete_definitions_v2' }
    })
    await replaceSlipBoxSchemas(pool, schema.id, definition.boxes)
  }

  let catalogCandidates = []
  try {
    catalogCandidates = await listCatalogSlipCandidates(pool)
  } catch (error) {
    if (error?.code !== '42P01') throw error
  }

  for (const candidate of catalogCandidates) {
    const formNumber = String(candidate.form_number || '')
    const title = String(candidate.title || formNumber)
    const alreadyComplete = COMPLETE_SLIP_DEFINITIONS.some((d) => d.code === formNumber)
    if (alreadyComplete) continue
    await upsertSlipSchema(pool, {
      formNumber,
      title,
      payerLabel: inferPayerLabel(formNumber),
      slipKind: 'information_slip',
      schemaStatus: 'catalog_only',
      catalogTitle: title,
      metadata: { seededFrom: 'form_registry_catalog' }
    })
  }

  return { total: await countSlipSchemas(pool) }
}

export async function listSlipSchemasForReturnBuilder (pool) {
  await ensureSlipSchemasSeeded(pool)
  const rows = await listSlipSchemasWithBoxes(pool)
  return rows.map(mapSchemaRow)
}

export async function getSlipSchema (pool, formNumber) {
  await ensureSlipSchemasSeeded(pool)
  const row = await getSlipSchemaByFormNumber(pool, formNumber)
  return mapSchemaRow(row)
}

export async function getSlipSchemasByCode (pool) {
  const schemas = await listSlipSchemasForReturnBuilder(pool)
  return Object.fromEntries(schemas.map((schema) => [String(schema.code).toUpperCase(), schema]))
}

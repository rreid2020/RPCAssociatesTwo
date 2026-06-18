import { getSlipSchemasByCode, getSlipSchema, listSlipSchemasForReturnBuilder } from './slipSchema.service.js'
import { mapSlipInstancesToEntries } from './slipEntry.service.js'
import { normalizeExtractedDataToBoxes } from './slipExtraction.service.js'

function n (value) {
  const out = Number(value || 0)
  return Number.isFinite(out) ? out : 0
}

function mergeMetadata (entry, baseMeta = {}) {
  return {
    ...entry,
    metadata: {
      ...(entry.metadata || {}),
      ...baseMeta,
      source: baseMeta.source || entry.metadata?.source || 'document_extraction'
    }
  }
}

export async function mapExtractedSlipToEntries (pool, slipType, extractedData, baseMeta = {}) {
  const schemasByCode = await getSlipSchemasByCode(pool)
  const schema = schemasByCode[String(slipType || '').toUpperCase()]
  if (!schema) return []

  const boxes = normalizeExtractedDataToBoxes(slipType, extractedData, schema)
  const mapped = mapSlipInstancesToEntries([{
    slipCode: schema.code,
    payerName: extractedData?.employer_name || extractedData?.payer_name || null,
    taxYear: Number(extractedData?.tax_year || new Date().getFullYear()),
    taxpayerRole: baseMeta.taxpayerRole || 'self',
    boxes
  }], schemasByCode)

  const entries = []
  for (const entry of mapped.incomeEntries) {
    entries.push(mergeMetadata({
      kind: 'income',
      category: entry.category,
      description: entry.description,
      amount: n(entry.amount),
      metadata: entry.metadata
    }, baseMeta))
  }
  for (const entry of mapped.deductionEntries) {
    entries.push(mergeMetadata({
      kind: 'deduction',
      category: entry.category,
      description: entry.description,
      amount: n(entry.amount),
      metadata: entry.metadata
    }, baseMeta))
  }
  return entries
}

export async function getSlipCodesForDetection (pool) {
  const schemas = await listSlipSchemasForReturnBuilder(pool)
  return schemas.map((schema) => schema.code)
}

export { getSlipSchema }

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { ensurePortalSchema } from '../db/ensurePortalSchema.js'
import { ensureSlipSchemasSeeded, listSlipSchemasForReturnBuilder } from '../services/tax-intelligence/slipSchema.service.js'
import {
  COMPLETE_SLIP_DEFINITIONS,
  COMPLETE_SLIP_MIN_BOX_COUNTS
} from '../lib/taxSlips/slipDefinitions.seed.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
try {
  await ensurePortalSchema(pool)
  await ensureSlipSchemasSeeded(pool)
  const schemas = await listSlipSchemasForReturnBuilder(pool)

  const complete = schemas.filter((s) => s.schemaStatus === 'complete')
  const catalogOnly = schemas.filter((s) => s.schemaStatus === 'catalog_only')

  const seedByCode = Object.fromEntries(COMPLETE_SLIP_DEFINITIONS.map((d) => [d.code, d]))
  const gaps = []

  for (const schema of complete) {
    const seed = seedByCode[schema.code]
    const minExpected = COMPLETE_SLIP_MIN_BOX_COUNTS[schema.code]
    const boxCount = schema.boxes?.length || 0
    const seedBoxCount = seed?.boxes?.length || 0

    if (!seed) {
      gaps.push({ code: schema.code, issue: 'complete_in_db_but_missing_from_seed', boxCount })
      continue
    }
    if (boxCount !== seedBoxCount) {
      gaps.push({ code: schema.code, issue: 'db_seed_box_count_mismatch', boxCount, seedBoxCount })
    }
    if (minExpected && boxCount < minExpected) {
      gaps.push({ code: schema.code, issue: 'below_minimum_expected', boxCount, minExpected })
    }
  }

  const duplicateCodes = COMPLETE_SLIP_DEFINITIONS
    .map((d) => d.code)
    .filter((code, index, arr) => arr.indexOf(code) !== index)

  const report = {
    completeCount: complete.length,
    catalogOnlyCount: catalogOnly.length,
    seedDefinitionCount: COMPLETE_SLIP_DEFINITIONS.length,
    duplicateSeedCodes: duplicateCodes,
    gaps,
    completeSlipBoxCounts: complete
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((s) => ({
        code: s.code,
        boxes: s.boxes.length,
        minExpected: COMPLETE_SLIP_MIN_BOX_COUNTS[s.code] || null
      })),
    catalogOnlySample: catalogOnly
      .sort((a, b) => a.code.localeCompare(b.code))
      .slice(0, 15)
      .map((s) => ({ code: s.code, title: s.name }))
  }

  console.log(JSON.stringify(report, null, 2))
  if (gaps.length > 0) process.exitCode = 1
} finally {
  await pool.end()
}

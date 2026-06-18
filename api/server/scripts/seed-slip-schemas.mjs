import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { ensurePortalSchema } from '../db/ensurePortalSchema.js'
import { ensureSlipSchemasSeeded, listSlipSchemasForReturnBuilder } from '../services/tax-intelligence/slipSchema.service.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
try {
  await ensurePortalSchema(pool)
  const seed = await ensureSlipSchemasSeeded(pool)
  const schemas = await listSlipSchemasForReturnBuilder(pool)
  const complete = schemas.filter((s) => s.schemaStatus === 'complete')
  const catalogOnly = schemas.filter((s) => s.schemaStatus === 'catalog_only')
  console.log(JSON.stringify({
    seededTotal: seed.total,
    complete: complete.length,
    catalogOnly: catalogOnly.length,
    sampleComplete: complete.slice(0, 3).map((s) => ({ code: s.code, boxes: s.boxes.length })),
    sampleCatalog: catalogOnly.slice(0, 5).map((s) => s.code)
  }, null, 2))
} finally {
  await pool.end()
}

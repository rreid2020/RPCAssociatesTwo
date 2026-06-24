import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { ensurePortalSchema } from '../db/ensurePortalSchema.js'
import { ensureSlipSchemasSeeded } from '../services/tax-intelligence/slipSchema.service.js'
import { ensureFormWorksheetSchemasSeeded } from '../services/tax-intelligence/formWorksheet.service.js'
import { autoseedRegistryWorksheetsBatch } from '../services/tax-intelligence/worksheetAutoseed.service.js'
import { getRegistryCoverageReport } from '../services/tax-intelligence/registryCoverage.service.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const limit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || 20)
const force = process.argv.includes('--force')

const pool = createPool()
try {
  await ensurePortalSchema(pool)
  await ensureSlipSchemasSeeded(pool)
  await ensureFormWorksheetSchemasSeeded(pool)

  const before = await getRegistryCoverageReport(pool)
  console.log('Before:', JSON.stringify(before.summary))

  const batch = await autoseedRegistryWorksheetsBatch(pool, { limit, onlyPending: !force, force })
  console.log('Batch:', JSON.stringify({ processed: batch.processed, results: batch.results }, null, 2))

  const after = await getRegistryCoverageReport(pool)
  console.log('After:', JSON.stringify(after.summary))
} finally {
  await pool.end()
}

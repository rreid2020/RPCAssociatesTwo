import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { ensurePortalSchema } from '../db/ensurePortalSchema.js'
import { ensureSlipSchemasSeeded } from '../services/tax-intelligence/slipSchema.service.js'
import { ensureFormWorksheetSchemasSeeded } from '../services/tax-intelligence/formWorksheet.service.js'
import { getRegistryCoverageReport } from '../services/tax-intelligence/registryCoverage.service.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const pool = createPool()
try {
  await ensurePortalSchema(pool)
  await ensureSlipSchemasSeeded(pool)
  await ensureFormWorksheetSchemasSeeded(pool)

  const report = await getRegistryCoverageReport(pool)
  const output = {
    summary: report.summary,
    pendingSample: report.pending.slice(0, 40),
    pendingCount: report.pending.length
  }

  console.log(JSON.stringify(output, null, 2))
  if (report.summary.complete < report.summary.requiresWorksheet) {
    process.exitCode = 1
  }
} finally {
  await pool.end()
}

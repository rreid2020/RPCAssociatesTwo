import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const modulePath = join(dirname(fileURLToPath(import.meta.url)), '../lib/tax-intelligence/craProvinceQuestions.cjs')
const exports = require(modulePath)

if (typeof exports.normalizeOrganDonorConsent !== 'function') {
  console.error('craProvinceQuestions.cjs is missing normalizeOrganDonorConsent')
  process.exit(1)
}

if (typeof exports.normalizeProvincialElections !== 'function') {
  console.error('craProvinceQuestions.cjs is missing normalizeProvincialElections')
  process.exit(1)
}

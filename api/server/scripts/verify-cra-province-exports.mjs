import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const esmPath = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '../lib/tax-intelligence/craProvinceQuestions.js')).href
const exports = await import(esmPath)

if (typeof exports.normalizeOrganDonorConsent !== 'function') {
  console.error('craProvinceQuestions.js is missing normalizeOrganDonorConsent export')
  process.exit(1)
}

if (typeof exports.normalizeProvincialElections !== 'function') {
  console.error('craProvinceQuestions.js is missing normalizeProvincialElections export')
  process.exit(1)
}

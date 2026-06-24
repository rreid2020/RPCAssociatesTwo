import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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

const esmPath = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '../lib/tax-intelligence/craProvinceQuestions.js')).href
const esmExports = await import(esmPath)

if (typeof esmExports.normalizeOrganDonorConsent !== 'function') {
  console.error('craProvinceQuestions.js is missing normalizeOrganDonorConsent ESM export')
  process.exit(1)
}

if (typeof esmExports.normalizeProvincialElections !== 'function') {
  console.error('craProvinceQuestions.js is missing normalizeProvincialElections ESM export')
  process.exit(1)
}

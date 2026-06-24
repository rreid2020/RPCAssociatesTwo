import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const helpers = require('./craProvinceQuestions.cjs')

export const {
  normalizeProvinceCode,
  hasOrganDonorQuestion,
  hasProvincialElectionsQuestions,
  normalizeOrganDonorConsent,
  normalizeProvincialElections
} = helpers

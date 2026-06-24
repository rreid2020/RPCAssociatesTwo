import { isExcludedSlipForm, isInformationSlipCandidate } from '../../services/tax-intelligence/slipSchema.repository.js'
import { classifyReturnBuilderArtifact } from './formScope.js'

export function normalizeRegistryFormNumber (value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ')
}

/**
 * Classify a form_registry row for worksheet completion tracking.
 * Every active registry entry must map to slip or form worksheet coverage.
 */
export function classifyRegistryWorksheet (row = {}) {
  const formNumber = normalizeRegistryFormNumber(row.form_number || row.formNumber)
  const title = String(row.title || '').trim()
  const landingUrl = String(row.landing_url || row.landingUrl || '')

  if (!formNumber) {
    return { formNumber: '', worksheetKind: 'unknown', artifactKind: 'unknown', requiresWorksheet: false }
  }

  const artifact = classifyReturnBuilderArtifact(formNumber, title, landingUrl)

  if (isInformationSlipCandidate(formNumber, title)) {
    return {
      formNumber,
      title,
      landingUrl,
      worksheetKind: 'slip',
      artifactKind: 'information_slip',
      requiresWorksheet: true,
      worksheetStore: 'slip_schemas'
    }
  }

  if (isExcludedSlipForm(formNumber, title) && /guide/i.test(title)) {
    return {
      formNumber,
      title,
      landingUrl,
      worksheetKind: 'guide',
      artifactKind: artifact.artifactKind,
      requiresWorksheet: false,
      worksheetStore: null
    }
  }

  if (/authorization|election|consent|declaration|information about your/i.test(title) && !/\d{4}/.test(title)) {
    return {
      formNumber,
      title,
      landingUrl,
      worksheetKind: 'supporting_form',
      artifactKind: 't1_form',
      requiresWorksheet: true,
      worksheetStore: 'form_worksheet_schemas'
    }
  }

  return {
    formNumber,
    title,
    landingUrl,
    worksheetKind: 'form',
    artifactKind: artifact.artifactKind || 't1_form',
    requiresWorksheet: true,
    worksheetStore: 'form_worksheet_schemas'
  }
}

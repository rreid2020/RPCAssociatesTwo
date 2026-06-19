import { getTaxReturnById } from './taxReturn.service.js'
import { listDeductions, listIncomeEntries } from './income.service.js'
import {
  getProvincialPackage,
  getT1PackageCatalog,
  resolveFormsForLineRefs,
  collectTriggeredLineRefs
} from '../../lib/taxSlips/t1Package.registry.js'
import { classifyReturnBuilderArtifact } from '../../lib/taxSlips/formScope.js'

export function getT1ReturnPackageCatalog () {
  return getT1PackageCatalog()
}

export async function getT1ReturnPackageForReturn (pool, clerkUserId, taxReturnId) {
  const taxReturn = await getTaxReturnById(pool, clerkUserId, taxReturnId)
  if (!taxReturn) return null

  const provinceCode = String(taxReturn.province_code || taxReturn.taxpayer_profile?.residenceProvinceDec31 || 'ON').toUpperCase()
  const provincialPackage = getProvincialPackage(provinceCode)
  const [incomeEntries, deductions] = await Promise.all([
    listIncomeEntries(pool, clerkUserId, taxReturnId),
    listDeductions(pool, clerkUserId, taxReturnId)
  ])

  const triggeredLineRefs = collectTriggeredLineRefs(incomeEntries, deductions)
  const crosswalk = resolveFormsForLineRefs(triggeredLineRefs, { provinceCode })

  return {
    domain: 't1_personal',
    taxReturnId,
    taxYear: taxReturn.tax_year,
    taxpayerName: taxReturn.taxpayer_name,
    provinceCode,
    provincialPackage,
    packageIndexUrl: getT1PackageCatalog().indexUrl,
    crosswalkUrl: getT1PackageCatalog().crosswalkUrl,
    triggeredLineRefs,
    requiredArtifacts: {
      forms: crosswalk.forms,
      schedules: crosswalk.schedules,
      worksheets: crosswalk.worksheets
    },
    referenceGuides: crosswalk.guides,
    scopeNote: 'Return Builder covers personal T1 returns only. Corporate T2, trust returns, and partnership administrative filings are excluded.'
  }
}

export function filterRegistryRowForReturnBuilder (row) {
  const classification = classifyReturnBuilderArtifact(row.form_number || row.formNumber, row.title, row.landing_url || row.landingUrl)
  return {
    ...row,
    returnBuilderScope: classification
  }
}

/**
 * CCPC federal + provincial active business income tax (SBD vs general portions).
 */

import { FEDERAL_CCPC } from '../data/federal'
import { PROVINCIAL_DATA } from '../data/provinces'
import type { CorporateInput, CorporateTaxResult } from '../types/taxTypes'

export const round2 = (n: number): number => Math.round(n * 100) / 100

export function calculateCorporateTax(input: CorporateInput): CorporateTaxResult {
  const income = Math.max(0, input.income)
  const prov = PROVINCIAL_DATA[input.province]

  let sbdPortion = 0
  let generalPortion = 0

  if (input.isSbdEligible) {
    const cap = input.sbdRoom ?? income
    sbdPortion = Math.min(income, Math.max(0, cap))
    generalPortion = Math.max(0, income - sbdPortion)
  } else {
    generalPortion = income
  }

  const fedSbd = sbdPortion * FEDERAL_CCPC.smallBusinessRate
  const fedGen = generalPortion * FEDERAL_CCPC.generalRate
  const provSbd = sbdPortion * prov.corporate.smallBusiness
  const provGen = generalPortion * prov.corporate.general

  return {
    federal: {
      sbdPortion: round2(fedSbd),
      generalPortion: round2(fedGen),
      tax: round2(fedSbd + fedGen),
    },
    provincial: {
      sbdPortion: round2(provSbd),
      generalPortion: round2(provGen),
      tax: round2(provSbd + provGen),
    },
    total: round2(fedSbd + fedGen + provSbd + provGen),
  }
}

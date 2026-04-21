/**
 * Personal income tax (federal + provincial) with BPA, Quebec federal abatement,
 * dividend gross-up/credits, and CPP/QPP on employment income.
 */

import {
  FEDERAL_BPA,
  FEDERAL_BRACKETS,
  FEDERAL_LOWEST_RATE,
  QUEBEC_FEDERAL_ABATEMENT_RATE,
} from '../data/federal'
import { PROVINCIAL_DATA } from '../data/provinces'
import type { Bracket, PersonalTaxResult, Province, TaxBreakdown, TaxInput } from '../types/taxTypes'
import { calculateCppOrQpp } from './cppCalc'
import { buildDividendDetail, totalFederalDividendCredits, totalProvincialDividendCredits } from './dividendTax'

export const round2 = (n: number): number => Math.round(n * 100) / 100

/** Progressive tax on `income` using ordered brackets (`upTo: null` = top). */
export function calculateProgressiveTax(income: number, brackets: Bracket[]): number {
  if (income <= 0) return 0

  let tax = 0
  let previousBracketTop = 0

  for (const bracket of brackets) {
    if (bracket.upTo === null) {
      const remainingIncome = income - previousBracketTop
      if (remainingIncome > 0) {
        tax += remainingIncome * bracket.rate
      }
      break
    }
    const bracketSize = bracket.upTo - previousBracketTop
    const incomeInBracket = Math.min(income - previousBracketTop, bracketSize)
    if (incomeInBracket > 0) {
      tax += incomeInBracket * bracket.rate
    }
    if (income <= bracket.upTo) break
    previousBracketTop = bracket.upTo
  }

  return round2(tax)
}

function federalBpaCredit(taxableIncome: number): number {
  const { fullAmount, phaseOutStart, phaseOutEnd, minimumAmount } = FEDERAL_BPA

  if (taxableIncome <= phaseOutStart) {
    return round2(fullAmount * FEDERAL_LOWEST_RATE)
  }
  if (taxableIncome >= phaseOutEnd) {
    return round2(minimumAmount * FEDERAL_LOWEST_RATE)
  }
  const phaseOutRange = phaseOutEnd - phaseOutStart
  const incomeAboveStart = taxableIncome - phaseOutStart
  const phaseOutRatio = incomeAboveStart / phaseOutRange
  const bpaAmount = fullAmount - (fullAmount - minimumAmount) * phaseOutRatio
  return round2(bpaAmount * FEDERAL_LOWEST_RATE)
}

function provincialBasicCredit(province: Province, taxableIncome: number): number {
  const p = PROVINCIAL_DATA[province]
  const base = Math.min(Math.max(0, taxableIncome), p.basicPersonalAmount)
  return round2(base * p.lowestRate)
}

export function calculatePersonalTax(input: TaxInput): PersonalTaxResult {
  const province = input.province
  const ordinary = Math.max(0, input.employmentIncome) + Math.max(0, input.otherIncome)
  const el = Math.max(0, input.dividendEligible)
  const nel = Math.max(0, input.dividendNonEligible)
  const divDetail = buildDividendDetail(province, el, nel)
  const taxableIncome = round2(ordinary + divDetail.eligibleGrossedUp + divDetail.nonEligibleGrossedUp)

  const federalGross = calculateProgressiveTax(taxableIncome, FEDERAL_BRACKETS)
  const qcAbatementCredit =
    province === 'QC' ? round2(federalGross * QUEBEC_FEDERAL_ABATEMENT_RATE) : 0

  const bpaFed = federalBpaCredit(taxableIncome)
  const divFed = totalFederalDividendCredits(divDetail)
  const federalNet = Math.max(0, round2(federalGross - qcAbatementCredit - bpaFed - divFed))

  const prov = PROVINCIAL_DATA[province]
  const provincialGross = calculateProgressiveTax(taxableIncome, prov.brackets)
  const provBpa = provincialBasicCredit(province, taxableIncome)
  const divProv = totalProvincialDividendCredits(divDetail)
  const provincialNet = Math.max(0, round2(provincialGross - provBpa - divProv))

  const cpp = calculateCppOrQpp(Math.max(0, input.employmentIncome), province)
  const totalNetTax = round2(federalNet + provincialNet + cpp.employee)

  return {
    taxableIncome,
    ordinaryIncome: round2(ordinary),
    eligibleDividendReceived: el,
    nonEligibleDividendReceived: nel,
    eligibleGrossedUp: divDetail.eligibleGrossedUp,
    nonEligibleGrossedUp: divDetail.nonEligibleGrossedUp,
    federal: {
      grossTax: federalGross,
      bpaCredit: bpaFed,
      qcAbatementCredit,
      dividendCredits: divFed,
      netTax: federalNet,
    },
    provincial: {
      grossTax: provincialGross,
      basicPersonalCredit: provBpa,
      dividendCredits: divProv,
      netTax: provincialNet,
    },
    cpp,
    totalNetTax,
  }
}

/** Aggregate breakdown for calculators / APIs. */
export function calculateTaxBreakdown(input: TaxInput): TaxBreakdown {
  const r = calculatePersonalTax(input)
  return {
    federalTax: r.federal.netTax,
    provincialTax: r.provincial.netTax,
    cpp: r.cpp.employee,
    total: r.totalNetTax,
  }
}

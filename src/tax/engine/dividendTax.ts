/**
 * Dividend gross-up and dividend tax credits (federal + provincial).
 * Credits are applied as non-refundable reductions against gross tax in personalTax.
 */

import { DIVIDEND_FEDERAL_DTC_ON_GROSSUP, DIVIDEND_GROSSUP } from '../data/federal'
import { PROVINCIAL_DATA } from '../data/provinces'
import type { DividendTaxDetail, Province } from '../types/taxTypes'

export const round2 = (n: number): number => Math.round(n * 100) / 100

export function grossUpEligible(amount: number): number {
  if (amount <= 0) return 0
  return round2(amount * DIVIDEND_GROSSUP.eligible)
}

export function grossUpNonEligible(amount: number): number {
  if (amount <= 0) return 0
  return round2(amount * DIVIDEND_GROSSUP.nonEligible)
}

export function federalEligibleCreditOnGrossUp(grossedUp: number): number {
  if (grossedUp <= 0) return 0
  return round2(grossedUp * DIVIDEND_FEDERAL_DTC_ON_GROSSUP.eligible)
}

export function federalNonEligibleCreditOnGrossUp(grossedUp: number): number {
  if (grossedUp <= 0) return 0
  return round2(grossedUp * DIVIDEND_FEDERAL_DTC_ON_GROSSUP.nonEligible)
}

export function provincialEligibleCredit(province: Province, grossedUpEligible: number): number {
  if (grossedUpEligible <= 0) return 0
  const r = PROVINCIAL_DATA[province].dividendProvincial.eligibleOnGrossUp
  return round2(grossedUpEligible * r)
}

export function provincialNonEligibleCredit(province: Province, grossedUpNonEligible: number): number {
  if (grossedUpNonEligible <= 0) return 0
  const r = PROVINCIAL_DATA[province].dividendProvincial.nonEligibleOnGrossUp
  return round2(grossedUpNonEligible * r)
}

export function buildDividendDetail(
  province: Province,
  eligibleReceived: number,
  nonEligibleReceived: number
): DividendTaxDetail {
  const eligibleGrossedUp = grossUpEligible(eligibleReceived)
  const nonEligibleGrossedUp = grossUpNonEligible(nonEligibleReceived)
  return {
    eligibleGrossedUp,
    nonEligibleGrossedUp,
    federalEligibleCredit: federalEligibleCreditOnGrossUp(eligibleGrossedUp),
    federalNonEligibleCredit: federalNonEligibleCreditOnGrossUp(nonEligibleGrossedUp),
    provincialEligibleCredit: provincialEligibleCredit(province, eligibleGrossedUp),
    provincialNonEligibleCredit: provincialNonEligibleCredit(province, nonEligibleGrossedUp),
  }
}

export function totalFederalDividendCredits(d: DividendTaxDetail): number {
  return round2(d.federalEligibleCredit + d.federalNonEligibleCredit)
}

export function totalProvincialDividendCredits(d: DividendTaxDetail): number {
  return round2(d.provincialEligibleCredit + d.provincialNonEligibleCredit)
}

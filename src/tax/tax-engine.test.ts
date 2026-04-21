import { describe, expect, it } from 'vitest'
import { calcEligibleDividendCredit } from '../lib/tax/calcDividendTax'
import { maxCppEmployeeContribution2025 } from './data/cpp'
import { FEDERAL_BRACKETS } from './data/federal'
import { calculateCorporateTax } from './engine/corporateTax'
import { federalEligibleCreditOnGrossUp, grossUpEligible } from './engine/dividendTax'
import { calculateCPP } from './engine/cppCalc'
import { calculateProgressiveTax } from './engine/personalTax'
import { evaluateCcpcExtraction } from './strategies/optimization'

describe('calculateProgressiveTax', () => {
  it('returns 0 for non-positive income', () => {
    expect(calculateProgressiveTax(0, FEDERAL_BRACKETS)).toBe(0)
    expect(calculateProgressiveTax(-100, FEDERAL_BRACKETS)).toBe(0)
  })

  it('matches first-bracket federal tax for income in first band', () => {
    const income = 50_000
    expect(calculateProgressiveTax(income, FEDERAL_BRACKETS)).toBeCloseTo(income * 0.145, 1)
  })
})

describe('dividend federal parity with legacy calc', () => {
  it('eligible gross-up and federal credit match legacy calcEligibleDividendCredit', () => {
    const amt = 10_000
    const legacy = calcEligibleDividendCredit(amt)
    expect(grossUpEligible(amt)).toBe(legacy.grossedUpAmount)
    expect(federalEligibleCreditOnGrossUp(legacy.grossedUpAmount)).toBe(legacy.federalCredit)
  })
})

describe('CPP 2025', () => {
  it('caps employee contribution at YMPE', () => {
    const high = calculateCPP(500_000)
    expect(high.employee).toBe(maxCppEmployeeContribution2025())
  })

  it('is zero below basic exemption', () => {
    const low = calculateCPP(3000)
    expect(low.employee).toBe(0)
  })
})

describe('corporate CCPC ON', () => {
  it('applies combined SBD federal + ON on small business income', () => {
    const r = calculateCorporateTax({
      income: 100_000,
      province: 'ON',
      isSbdEligible: true,
    })
    const expectedCombinedRate = 0.09 + 0.032
    expect(r.total).toBeCloseTo(100_000 * expectedCombinedRate, 1)
  })
})

describe('evaluateCcpcExtraction', () => {
  it('retains undistributed after-tax pool and lowers personal tax vs full payout', () => {
    const corp = { isSbdEligible: true as const }
    const full = evaluateCcpcExtraction(200_000, 0, Number.POSITIVE_INFINITY, 'ON', corp)
    const partial = evaluateCcpcExtraction(200_000, 0, 50_000, 'ON', corp)
    expect(full.poolAfterCorpTax).toBe(full.dividendPaid)
    expect(partial.dividendPaid).toBe(50_000)
    expect(partial.retainedInCorporation).toBeCloseTo((full.poolAfterCorpTax ?? 0) - 50_000, 1)
    expect(partial.personalTax).toBeLessThan(full.personalTax)
    expect(partial.totalTax).toBeLessThan(full.totalTax)
  })
})

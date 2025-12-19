/**
 * Dev-only self-checks for tax calculation logic
 * Run in development mode to verify calculations
 */

import { calcTaxFromBrackets } from './calcTaxFromBrackets'
import { calcFederalBPA } from './calcFederalBPA'
import { TaxBracket, FederalTaxData } from './types'

export function runSelfChecks() {
  if (!import.meta.env.DEV) {
    return // Only run in dev mode
  }

  console.log('Running tax calculation self-checks...')

  // Test 1: Bracket boundary math
  const testBrackets: TaxBracket[] = [
    { upTo: 10000, rate: 0.10 },
    { upTo: 50000, rate: 0.20 },
    { upTo: null, rate: 0.30 }
  ]

  // Test at exact boundary
  const taxAtBoundary = calcTaxFromBrackets(10000, testBrackets)
  const expectedAtBoundary = 10000 * 0.10
  if (Math.abs(taxAtBoundary - expectedAtBoundary) > 0.01) {
    console.error('❌ Bracket boundary test failed:', { taxAtBoundary, expectedAtBoundary })
  } else {
    console.log('✅ Bracket boundary test passed')
  }

  // Test just above boundary
  const taxAboveBoundary = calcTaxFromBrackets(10001, testBrackets)
  const expectedAboveBoundary = 10000 * 0.10 + 1 * 0.20
  if (Math.abs(taxAboveBoundary - expectedAboveBoundary) > 0.01) {
    console.error('❌ Bracket above boundary test failed:', { taxAboveBoundary, expectedAboveBoundary })
  } else {
    console.log('✅ Bracket above boundary test passed')
  }

  // Test 2: BPA phase-out
  const testBPA: FederalTaxData = {
    year: 2025,
    dataLastUpdated: '2025-01-15',
    brackets: [],
    lowestRate: 0.15,
    bpa: {
      fullAmount: 15705,
      phaseOutStart: 173000,
      phaseOutEnd: 246752,
      minimumAmount: 14000
    }
  }

  // Full BPA
  const bpaFull = calcFederalBPA(100000, testBPA)
  const expectedBPAFull = 15705 * 0.15
  if (Math.abs(bpaFull - expectedBPAFull) > 0.01) {
    console.error('❌ BPA full test failed:', { bpaFull, expectedBPAFull })
  } else {
    console.log('✅ BPA full test passed')
  }

  // Minimum BPA
  const bpaMin = calcFederalBPA(250000, testBPA)
  const expectedBPAMin = 14000 * 0.15
  if (Math.abs(bpaMin - expectedBPAMin) > 0.01) {
    console.error('❌ BPA minimum test failed:', { bpaMin, expectedBPAMin })
  } else {
    console.log('✅ BPA minimum test passed')
  }

  // Mid-range BPA (should be between full and min)
  const bpaMid = calcFederalBPA(200000, testBPA)
  if (bpaMid <= expectedBPAMin || bpaMid >= expectedBPAFull) {
    console.error('❌ BPA mid-range test failed:', { bpaMid, expectedBPAMin, expectedBPAFull })
  } else {
    console.log('✅ BPA mid-range test passed')
  }

  // Test 3: Monotonicity - increasing income should not decrease gross tax
  const income1 = 50000
  const income2 = 60000
  const tax1 = calcTaxFromBrackets(income1, testBrackets)
  const tax2 = calcTaxFromBrackets(income2, testBrackets)
  if (tax2 < tax1) {
    console.error('❌ Monotonicity test failed:', { income1, tax1, income2, tax2 })
  } else {
    console.log('✅ Monotonicity test passed')
  }

  console.log('Self-checks completed')
}


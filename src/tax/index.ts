/**
 * Canadian tax computation engine — public API (pure functions, no UI).
 */

export type {
  Bracket,
  CorporateInput,
  CorporateTaxResult,
  DividendTaxDetail,
  PersonalTaxResult,
  Province,
  StrategyResult,
  TaxBreakdown,
  TaxEngineExtensions,
  TaxInput,
  TaxYear,
} from './types/taxTypes'

export * from './data/federal'
export * from './data/cpp'
export { PROVINCIAL_DATA } from './data/provinces'
export type { ProvincialData, ProvincialDividendDtcRates, ProvincialCorporateRates } from './data/provinces'

export { calculateProgressiveTax, calculatePersonalTax, calculateTaxBreakdown } from './engine/personalTax'
export {
  buildDividendDetail,
  federalEligibleCreditOnGrossUp,
  federalNonEligibleCreditOnGrossUp,
  grossUpEligible,
  grossUpNonEligible,
  provincialEligibleCredit,
  provincialNonEligibleCredit,
  totalFederalDividendCredits,
  totalProvincialDividendCredits,
} from './engine/dividendTax'
export { calculateCPP, calculateCppOrQpp, calculateQPP } from './engine/cppCalc'
export type { CppResult } from './engine/cppCalc'
export { calculateCorporateTax } from './engine/corporateTax'

export { evaluateSalarySlice } from './strategies/salaryStrategy'
export type { SalaryAllocationParams } from './strategies/salaryStrategy'
export { evaluateDividendOnly } from './strategies/dividendStrategy'
export type { DividendAllocationParams } from './strategies/dividendStrategy'
export { evaluateCcpcExtraction, optimizeSalaryDividend } from './strategies/optimization'
export type { OptimizationCell, OptimizationParams, OptimizationResult } from './strategies/optimization'

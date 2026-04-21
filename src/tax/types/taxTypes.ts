/**
 * Public types for the Canadian tax computation engine (CRA-oriented, extensible).
 */

export type Province =
  | 'ON'
  | 'BC'
  | 'AB'
  | 'QC'
  | 'MB'
  | 'SK'
  | 'NS'
  | 'NB'
  | 'NL'
  | 'PE'
  | 'YT'
  | 'NT'
  | 'NU'

export type TaxYear = 2025

/** Bracket: `upTo: null` means top bracket (no ceiling). */
export interface Bracket {
  upTo: number | null
  rate: number
}

export interface TaxInput {
  employmentIncome: number
  dividendEligible: number
  dividendNonEligible: number
  otherIncome: number
  province: Province
}

/** CCPC active business income — extend for SBD grind / RDTOH in future versions. */
export interface CorporateInput {
  /** Active business income before salary deduction (if any). */
  income: number
  province: Province
  /** Whether income is eligible for the small business deduction (SBD room > 0 in future). */
  isSbdEligible: boolean
  /** Remaining SBD limit in dollars; omit = no grind modeling (treat as unlimited if isSbdEligible). */
  sbdRoom?: number
}

export interface TaxBreakdown {
  federalTax: number
  provincialTax: number
  cpp: number
  total: number
}

export interface StrategyResult {
  corporateTax: number
  personalTax: number
  totalTax: number
  netCash: number
  rrspRoom: number
}

/** Detailed personal tax output for APIs / TaxGPT. */
export interface PersonalTaxResult {
  taxableIncome: number
  ordinaryIncome: number
  eligibleDividendReceived: number
  nonEligibleDividendReceived: number
  eligibleGrossedUp: number
  nonEligibleGrossedUp: number
  federal: {
    grossTax: number
    bpaCredit: number
    qcAbatementCredit: number
    dividendCredits: number
    netTax: number
  }
  provincial: {
    grossTax: number
    basicPersonalCredit: number
    dividendCredits: number
    netTax: number
  }
  cpp: {
    employee: number
    pensionableEarnings: number
    isQuebec: boolean
  }
  totalNetTax: number
}

export interface CorporateTaxResult {
  federal: { sbdPortion: number; generalPortion: number; tax: number }
  provincial: { sbdPortion: number; generalPortion: number; tax: number }
  total: number
}

export interface DividendTaxDetail {
  eligibleGrossedUp: number
  nonEligibleGrossedUp: number
  federalEligibleCredit: number
  federalNonEligibleCredit: number
  provincialEligibleCredit: number
  provincialNonEligibleCredit: number
}

/** Placeholders for future engine configuration (RDTOH, AAII grind, trusts). */
export interface TaxEngineExtensions {
  rdtoh?: { nonEligibleIii: number; eligibleRDTOH: number }
  aaiiGrind?: { activeBusinessIncome: number; threshold: number }
}

/** All provinces and territories with modeled provincial charitable credit rates. */
export type ProvinceCode =
  | 'AB'
  | 'BC'
  | 'MB'
  | 'NB'
  | 'NL'
  | 'NS'
  | 'NT'
  | 'NU'
  | 'ON'
  | 'PE'
  | 'QC'
  | 'SK'
  | 'YT'

export type FilingType = 'single' | 'couple'

/** Who claims the pooled household charitable amount (single-return / one $200 step). */
export type CharitableClaimant = 'taxpayer' | 'spouse'

/**
 * Single dollar amount X: model compares (A) X to charitable vs (B) X to federal political — mutually exclusive uses of the same money.
 */
export interface ComparisonInputPayload {
  province: ProvinceCode
  filingType: FilingType
  taxpayerIncome: number
  spouseIncome: number
  /** Same contribution total applied entirely to charitable in one scenario and entirely to political in the other. */
  contributionAmount: number
}

/** Full inputs for the legacy multi-scenario optimizer (not used by the public this-or-that UI). */
export interface InputPayload {
  province: ProvinceCode
  filingType: FilingType
  taxpayerIncome: number
  spouseIncome: number
  charitableDonations: number
  politicalDonations: number
  priorCharitableDonations: number
}

export interface CharitableBreakdown {
  federal: number
  provincial: number
  total: number
}

export interface PoliticalBreakdown {
  federal: number
  total: number
}

export interface CreditBreakdown {
  charitable: CharitableBreakdown
  political: PoliticalBreakdown
  /** charitable.total + political.total */
  combined: number
}

export interface PoliticalSplit {
  taxpayerAmount: number
  spouseAmount: number
}

export interface ScenarioResult {
  id: string
  label: string
  /** Charitable pool this scenario uses (current + carryforward if applicable). */
  charitablePool: number
  useCarryforward: boolean
  charitableClaimant: CharitableClaimant
  politicalSplit: PoliticalSplit
  breakdown: CreditBreakdown
  totalCredit: number
}

export interface OptimizationResult {
  taxYear: number
  naiveScenario: ScenarioResult
  bestScenario: ScenarioResult
  optimalTotalCredit: number
  optimalAllocation: {
    charitableClaimant: CharitableClaimant | 'n/a'
    charitableUseCarryforward: boolean
    politicalSplit: PoliticalSplit
  }
  /** Human-readable tips (e.g. higher-income spouse, political split). */
  insights: string[]
  /** Ideas not fully captured (e.g. donation limits, full Schedule 9). */
  unusedOpportunities: string[]
  deltaVsNaive: {
    dollars: number
    percent: number
  }
  /** All evaluated scenarios for comparison UI. */
  scenarios: ScenarioResult[]
}

/** Result of the “this or that” comparison: same $X → charitable credits vs political credits. */
export interface ThisOrThatResult {
  contributionAmount: number
  charitable: {
    totalCredit: number
    breakdown: CharitableBreakdown
  }
  political: {
    totalCredit: number
    breakdown: PoliticalBreakdown
  }
  betterStrategy: 'charitable' | 'political' | 'tie'
  /** How much more the better strategy credits vs the other (0 if tie). */
  advantageDollars: number
  summary: string
  footnotes: string[]
}

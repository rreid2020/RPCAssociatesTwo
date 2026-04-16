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

export interface InputPayload {
  province: ProvinceCode
  filingType: FilingType
  taxpayerIncome: number
  spouseIncome: number
  charitableDonations: number
  politicalDonations: number
  /** Optional prior-year charitable carryforward (no expiry logic in this module). */
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

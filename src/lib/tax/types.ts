export interface TaxBracket {
  upTo: number | null
  rate: number
}

export interface FederalTaxData {
  year: number
  dataLastUpdated: string
  brackets: TaxBracket[]
  lowestRate: number
  bpa: {
    fullAmount: number
    phaseOutStart: number
    phaseOutEnd: number
    minimumAmount: number
  }
}

export interface ProvincialTaxData {
  brackets: TaxBracket[]
  lowestRate: number
}

export interface ProvincesTaxData {
  [provinceCode: string]: ProvincialTaxData
}

export interface TaxCalculatorInputs {
  taxYear: number
  province: string
  employmentIncome: number
  selfEmploymentIncome: number
  otherIncome: number
  rrspContributions: number
}

export interface TaxBreakdown {
  gross: number
  credits: number
  net: number
}

export interface TaxCalculatorResults {
  taxableIncome: number
  federalTax: TaxBreakdown
  provincialTax: TaxBreakdown
  totalTax: number
  averageTaxRate: number
  marginalTaxRate: number
}


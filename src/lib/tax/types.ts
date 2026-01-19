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
  interestAndInvestmentIncome: number
  otherIncome: number
  rrspContributions: number
  fhsaContributions: number
  capitalGains: number
  eligibleDividends: number
  ineligibleDividends: number
  cppContributions: number
  donations: number
  incomeTaxesPaid: number
}

export interface TaxBreakdown {
  gross: number
  credits: number
  net: number
}

export interface DetailedBreakdown {
  // Total Income Section
  totalIncome: {
    employmentIncome: number
    interestAndInvestmentIncome: number
    netBusinessIncome: number
    capitalGains: number
    eligibleDividends: number
    ineligibleDividends: number
    total: number
  }
  // Net Income Section
  netIncome: {
    totalIncome: number
    rrspDeduction: number
    fhsaDeduction: number
    cppDeduction: number
    totalDeductions: number
    netIncomeBeforeAdjustments: number
    netIncome: number
  }
  // Taxable Income
  taxableIncome: number
  // Federal Non-Refundable Tax Credits
  federalCredits: {
    basicPersonalAmount: number
    cppContributions: number
    canadaEmploymentAmount: number
    donationsCredit: number
    sumOfCredits: number
    creditsAt15Percent: number
    totalFederalCredits: number
  }
  // Federal Tax
  federalTax: {
    taxOnTaxableIncome: number
    basicFederalTax: number
    federalForeignTaxCredit: number
    netFederalTax: number
  }
  // Provincial Tax
  provincialTax: {
    gross: number
    credits: number
    net: number
  }
  // Refund or Balance Owing
  refundOrOwing: {
    netFederalTax: number
    cppContributionsPayable: number
    provincialTax: number
    totalPayable: number
    totalIncomeTaxDeducted: number
    totalCredits: number
    refund: number
    balanceOwing: number
  }
  // Additional Information
  additionalInfo: {
    marginalTaxRate: number
    averageTaxRate: number
    totalRRSPDeductionLimit: number
    unusedRRSPContributions: number
    totalInstalmentsPayable: number
  }
}

export interface TaxCalculatorResults {
  taxableIncome: number
  federalTax: TaxBreakdown
  provincialTax: TaxBreakdown
  totalTax: number
  averageTaxRate: number
  marginalTaxRate: number
  refundOrOwing: number // Positive = refund, Negative = amount owing
  detailedBreakdown?: DetailedBreakdown // Optional detailed breakdown
}


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
  dateOfBirth: string // Format: YYYY-MM-DD
  maritalStatus: string // 'single', 'married', 'common-law', 'divorced', 'widowed'
  numberOfDependents: number // Dependents 18 years or younger
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
  // Worksheet fields
  carryingCharges: number // Line 22100
  interestExpenses: number // Line 22100
  otherExpenses: number // Line 22100
  oasPension: number // Line 11300 - for Line 23500 calculation
  netFederalSupplements: number // Line 14600 - for Line 23500 calculation
  politicalContributions: number // Line 40900 - for Line 41000 calculation
  medicalExpenses: number // Line 21500 - for Line 45200 calculation
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
    carryingChargesDeduction: number // Line 22100
    totalDeductions: number
    netIncomeBeforeAdjustments: number
    socialBenefitsRepayment: number // Line 23500
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
    dividendTaxCredit: number // Line 40425
    politicalContributionCredit: number // Line 41000
    medicalExpenseSupplement: number // Line 45200
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


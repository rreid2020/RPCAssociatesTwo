import { TaxCalculatorInputs, TaxCalculatorResults, FederalTaxData, ProvincialTaxData } from './types'
import { calcFederalTax } from './calcFederalTax'
import { calcProvincialTax } from './calcProvincialTax'

/**
 * Main calculation function that returns all calculator outputs
 * @param inputs - User inputs (year, province, income sources, RRSP)
 * @param federalData - Federal tax data for the year
 * @param provincialData - Provincial tax data for the province
 * @returns Complete tax calculation results
 */
export function calcSummary(
  inputs: TaxCalculatorInputs,
  federalData: FederalTaxData,
  provincialData: ProvincialTaxData
): TaxCalculatorResults {
  // Calculate taxable income
  const totalIncome = inputs.employmentIncome + inputs.selfEmploymentIncome + inputs.otherIncome
  const taxableIncome = Math.max(0, totalIncome - inputs.rrspContributions)

  // Calculate federal tax
  const federalTax = calcFederalTax(taxableIncome, federalData)

  // Calculate provincial tax
  const provincialTax = calcProvincialTax(taxableIncome, provincialData)

  // Calculate total tax
  const totalTax = federalTax.net + provincialTax.net

  // Calculate average tax rate
  const averageTaxRate = taxableIncome > 0 
    ? Math.round((totalTax / taxableIncome) * 10000) / 100 
    : 0

  // Calculate marginal tax rate (combined federal + provincial)
  // Find the bracket that the income falls into
  let marginalFederalRate = 0
  let marginalProvincialRate = 0
  
  // Find federal marginal rate
  for (const bracket of federalData.brackets) {
    if (bracket.upTo === null || taxableIncome <= bracket.upTo) {
      marginalFederalRate = bracket.rate
      break
    }
  }

  // Find provincial marginal rate
  for (const bracket of provincialData.brackets) {
    if (bracket.upTo === null || taxableIncome <= bracket.upTo) {
      marginalProvincialRate = bracket.rate
      break
    }
  }

  const marginalTaxRate = Math.round((marginalFederalRate + marginalProvincialRate) * 10000) / 100

  return {
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    federalTax,
    provincialTax,
    totalTax: Math.round(totalTax * 100) / 100,
    averageTaxRate,
    marginalTaxRate
  }
}


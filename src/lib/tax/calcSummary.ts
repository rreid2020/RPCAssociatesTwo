import { TaxCalculatorInputs, TaxCalculatorResults, FederalTaxData, ProvincialTaxData } from './types'
import { calcFederalTax } from './calcFederalTax'
import { calcProvincialTax } from './calcProvincialTax'
import { 
  calcEligibleDividendCredit, 
  calcIneligibleDividendCredit,
  calcProvincialDividendCredit 
} from './calcDividendTax'

/**
 * Main calculation function that returns all calculator outputs
 * @param inputs - User inputs (year, province, income sources, RRSP, dividends, capital gains, taxes paid)
 * @param federalData - Federal tax data for the year
 * @param provincialData - Provincial tax data for the province
 * @returns Complete tax calculation results
 */
export function calcSummary(
  inputs: TaxCalculatorInputs,
  federalData: FederalTaxData,
  provincialData: ProvincialTaxData
): TaxCalculatorResults {
  // Calculate regular income (employment, self-employment, other)
  const regularIncome = inputs.employmentIncome + inputs.selfEmploymentIncome + inputs.otherIncome
  
  // Capital gains: 50% inclusion rate (only half is taxable)
  const capitalGainsTaxable = inputs.capitalGains * 0.5
  
  // Calculate dividend gross-ups and credits
  const eligibleDividend = calcEligibleDividendCredit(inputs.eligibleDividends)
  const ineligibleDividend = calcIneligibleDividendCredit(inputs.ineligibleDividends)
  
  // Calculate total taxable income
  // Include: regular income + capital gains (50%) + grossed-up dividends - RRSP
  const totalIncomeBeforeRRSP = regularIncome + capitalGainsTaxable + 
    eligibleDividend.grossedUpAmount + ineligibleDividend.grossedUpAmount
  const taxableIncome = Math.max(0, totalIncomeBeforeRRSP - inputs.rrspContributions)

  // Calculate federal tax on taxable income
  const federalTaxBeforeCredits = calcFederalTax(taxableIncome, federalData)
  
  // Apply dividend tax credits to federal tax
  const totalFederalDividendCredit = eligibleDividend.federalCredit + ineligibleDividend.federalCredit
  const federalTaxAfterDividendCredits = {
    gross: federalTaxBeforeCredits.gross,
    credits: federalTaxBeforeCredits.credits + totalFederalDividendCredit,
    net: Math.max(0, federalTaxBeforeCredits.net - totalFederalDividendCredit)
  }

  // Calculate provincial tax on taxable income
  const provincialTaxBeforeCredits = calcProvincialTax(taxableIncome, provincialData)
  
  // Apply provincial dividend tax credits
  const provincialEligibleCredit = calcProvincialDividendCredit(eligibleDividend.federalCredit, inputs.province)
  const provincialIneligibleCredit = calcProvincialDividendCredit(ineligibleDividend.federalCredit, inputs.province)
  const totalProvincialDividendCredit = provincialEligibleCredit + provincialIneligibleCredit
  const provincialTaxAfterDividendCredits = {
    gross: provincialTaxBeforeCredits.gross,
    credits: provincialTaxBeforeCredits.credits + totalProvincialDividendCredit,
    net: Math.max(0, provincialTaxBeforeCredits.net - totalProvincialDividendCredit)
  }

  // Calculate total tax
  const totalTax = federalTaxAfterDividendCredits.net + provincialTaxAfterDividendCredits.net
  
  // Calculate refund or amount owing
  const refundOrOwing = inputs.incomeTaxesPaid - totalTax

  // Calculate average tax rate (based on total income including dividends and capital gains)
  const totalIncome = regularIncome + inputs.capitalGains + inputs.eligibleDividends + inputs.ineligibleDividends
  const averageTaxRate = totalIncome > 0 
    ? Math.round((totalTax / totalIncome) * 10000) / 100 
    : 0

  // Calculate marginal tax rate (combined federal + provincial)
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
    federalTax: federalTaxAfterDividendCredits,
    provincialTax: provincialTaxAfterDividendCredits,
    totalTax: Math.round(totalTax * 100) / 100,
    averageTaxRate,
    marginalTaxRate,
    refundOrOwing: Math.round(refundOrOwing * 100) / 100
  }
}


import { TaxCalculatorInputs, TaxCalculatorResults, FederalTaxData, ProvincialTaxData, DetailedBreakdown } from './types'
import { calcFederalTax } from './calcFederalTax'
import { calcProvincialTax } from './calcProvincialTax'
import { calcFederalBPA } from './calcFederalBPA'
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
  // Calculate regular income (employment, self-employment, interest/investment, other)
  const regularIncome = inputs.employmentIncome + inputs.selfEmploymentIncome + 
    inputs.interestAndInvestmentIncome + inputs.otherIncome
  
  // Capital gains: 50% inclusion rate (only half is taxable)
  const capitalGainsTaxable = inputs.capitalGains * 0.5
  
  // Calculate dividend gross-ups and credits
  const eligibleDividend = calcEligibleDividendCredit(inputs.eligibleDividends)
  const ineligibleDividend = calcIneligibleDividendCredit(inputs.ineligibleDividends)
  
  // Calculate total taxable income
  // Include: regular income + capital gains (50%) + grossed-up dividends - RRSP - FHSA
  const totalIncomeBeforeDeductions = regularIncome + capitalGainsTaxable + 
    eligibleDividend.grossedUpAmount + ineligibleDividend.grossedUpAmount
  const totalDeductions = inputs.rrspContributions + inputs.fhsaContributions
  const taxableIncome = Math.max(0, totalIncomeBeforeDeductions - totalDeductions)

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

  // Calculate detailed breakdown
  const bpaCredit = calcFederalBPA(taxableIncome, federalData)
  const bpaAmount = taxableIncome <= federalData.bpa.phaseOutStart 
    ? federalData.bpa.fullAmount 
    : taxableIncome >= federalData.bpa.phaseOutEnd
    ? federalData.bpa.minimumAmount
    : federalData.bpa.fullAmount - ((federalData.bpa.fullAmount - federalData.bpa.minimumAmount) * ((taxableIncome - federalData.bpa.phaseOutStart) / (federalData.bpa.phaseOutEnd - federalData.bpa.phaseOutStart)))

  // Use actual CPP contributions if provided, otherwise estimate
  const cppContributions = inputs.cppContributions > 0 
    ? inputs.cppContributions 
    : Math.min(inputs.employmentIncome * 0.0595, 3867.50) // 2025 max CPP contribution estimate
  const cppCredit = cppContributions * federalData.lowestRate

  // Canada Employment Amount (for 2025: $1,433)
  const canadaEmploymentAmount = 1433
  const canadaEmploymentCredit = canadaEmploymentAmount * federalData.lowestRate

  // Calculate donations credit (15% on first $200, 29% on remainder)
  const donationsCredit = inputs.donations > 0
    ? Math.min(inputs.donations, 200) * 0.15 + Math.max(0, inputs.donations - 200) * 0.29
    : 0

  // Sum of federal credits (before 15% multiplication)
  const sumOfCredits = bpaAmount + cppContributions + canadaEmploymentAmount
  const creditsAt15Percent = sumOfCredits * federalData.lowestRate

  // Total federal credits (BPA + CPP + Canada Employment + Dividend credits + Donations)
  const totalFederalCredits = bpaCredit + cppCredit + canadaEmploymentCredit + totalFederalDividendCredit + donationsCredit

  // Calculate net income (total income minus deductions)
  // Note: totalIncome was already calculated above for average tax rate
  const netIncomeBeforeAdjustments = totalIncome - totalDeductions
  const netIncome = netIncomeBeforeAdjustments // Simplified - no other adjustments in MVP

  // Estimate CPP contributions payable on self-employment (simplified)
  const cppSelfEmploymentPayable = inputs.selfEmploymentIncome > 0 
    ? Math.min(inputs.selfEmploymentIncome * 0.119, 7735.00) * 0.5 // Self-employed pay both employee and employer portions
    : 0

  // Detailed breakdown
  const detailedBreakdown: DetailedBreakdown = {
    totalIncome: {
      employmentIncome: inputs.employmentIncome,
      interestAndInvestmentIncome: inputs.interestAndInvestmentIncome,
      netBusinessIncome: inputs.selfEmploymentIncome,
      capitalGains: inputs.capitalGains,
      eligibleDividends: inputs.eligibleDividends,
      ineligibleDividends: inputs.ineligibleDividends,
      total: totalIncome
    },
    netIncome: {
      totalIncome: totalIncome,
      rrspDeduction: inputs.rrspContributions,
      fhsaDeduction: inputs.fhsaContributions,
      cppDeduction: 0, // CPP is not a deduction, it's a credit
      totalDeductions: totalDeductions,
      netIncomeBeforeAdjustments: netIncomeBeforeAdjustments,
      netIncome: netIncome
    },
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    federalCredits: {
      basicPersonalAmount: Math.round(bpaAmount * 100) / 100,
      cppContributions: Math.round(cppContributions * 100) / 100,
      canadaEmploymentAmount: canadaEmploymentAmount,
      donationsCredit: Math.round(donationsCredit * 100) / 100,
      sumOfCredits: Math.round(sumOfCredits * 100) / 100,
      creditsAt15Percent: Math.round(creditsAt15Percent * 100) / 100,
      totalFederalCredits: Math.round(totalFederalCredits * 100) / 100
    },
    federalTax: {
      taxOnTaxableIncome: Math.round(federalTaxBeforeCredits.gross * 100) / 100,
      basicFederalTax: Math.max(0, Math.round((federalTaxBeforeCredits.gross - totalFederalCredits) * 100) / 100),
      federalForeignTaxCredit: 0, // Not calculated in MVP
      netFederalTax: Math.round(federalTaxAfterDividendCredits.net * 100) / 100
    },
    provincialTax: {
      gross: Math.round(provincialTaxBeforeCredits.gross * 100) / 100,
      credits: Math.round(totalProvincialDividendCredit * 100) / 100,
      net: Math.round(provincialTaxAfterDividendCredits.net * 100) / 100
    },
    refundOrOwing: {
      netFederalTax: Math.round(federalTaxAfterDividendCredits.net * 100) / 100,
      cppContributionsPayable: Math.round(cppSelfEmploymentPayable * 100) / 100,
      provincialTax: Math.round(provincialTaxAfterDividendCredits.net * 100) / 100,
      totalPayable: Math.round((federalTaxAfterDividendCredits.net + provincialTaxAfterDividendCredits.net + cppSelfEmploymentPayable) * 100) / 100,
      totalIncomeTaxDeducted: inputs.incomeTaxesPaid,
      totalCredits: inputs.incomeTaxesPaid,
      refund: refundOrOwing > 0 ? Math.round(refundOrOwing * 100) / 100 : 0,
      balanceOwing: refundOrOwing < 0 ? Math.round(Math.abs(refundOrOwing) * 100) / 100 : 0
    },
    additionalInfo: {
      marginalTaxRate: marginalTaxRate,
      averageTaxRate: averageTaxRate,
      totalRRSPDeductionLimit: 0, // Would need previous year's data to calculate
      unusedRRSPContributions: 0, // Would need contribution history
      totalInstalmentsPayable: 0 // Would need to estimate based on current year
    }
  }

  return {
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    federalTax: federalTaxAfterDividendCredits,
    provincialTax: provincialTaxAfterDividendCredits,
    totalTax: Math.round(totalTax * 100) / 100,
    averageTaxRate,
    marginalTaxRate,
    refundOrOwing: Math.round(refundOrOwing * 100) / 100,
    detailedBreakdown
  }
}


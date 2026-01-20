import { TaxCalculatorInputs, TaxCalculatorResults, FederalTaxData, ProvincialTaxData, DetailedBreakdown } from './types'
import { calcFederalTax } from './calcFederalTax'
import { calcProvincialTax } from './calcProvincialTax'
import { calcFederalBPA } from './calcFederalBPA'
import { 
  calcEligibleDividendCredit, 
  calcIneligibleDividendCredit,
  calcProvincialDividendCredit 
} from './calcDividendTax'
import {
  calcFederalDividendTaxCredit,
  calcCarryingCharges,
  calcSocialBenefitsRepayment,
  calcPoliticalContributionCredit,
  calcMedicalExpenseSupplement
} from './calcWorksheet'

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
  
  // Calculate worksheet deductions
  const carryingChargesDeduction = calcCarryingCharges(
    inputs.carryingCharges || 0,
    inputs.interestExpenses || 0,
    inputs.otherExpenses || 0
  )
  
  // Calculate total taxable income
  // Include: regular income + capital gains (50%) + grossed-up dividends - RRSP - FHSA - carrying charges - security options - other payments
  const totalIncomeBeforeDeductions = regularIncome + capitalGainsTaxable + 
    eligibleDividend.grossedUpAmount + ineligibleDividend.grossedUpAmount
  const totalDeductions = inputs.rrspContributions + inputs.fhsaContributions + carryingChargesDeduction +
    (inputs.securityOptionsDeduction || 0) + (inputs.otherPaymentsDeduction || 0)
  const taxableIncome = Math.max(0, totalIncomeBeforeDeductions - totalDeductions)

  // Calculate federal tax on taxable income
  const federalTaxBeforeCredits = calcFederalTax(taxableIncome, federalData)
  
  // Calculate federal dividend tax credit using worksheet (Line 40425)
  const worksheetDividendCredit = calcFederalDividendTaxCredit(
    inputs.eligibleDividends,
    inputs.ineligibleDividends
  )
  
  // Use worksheet calculation if it differs, otherwise use standard calculation
  const totalFederalDividendCredit = worksheetDividendCredit > 0 
    ? worksheetDividendCredit 
    : eligibleDividend.federalCredit + ineligibleDividend.federalCredit
  
  // Calculate additional credits from worksheet
  const politicalContributionCredit = calcPoliticalContributionCredit(inputs.politicalContributions || 0)
  
  const federalTaxAfterDividendCredits = {
    gross: federalTaxBeforeCredits.gross,
    credits: federalTaxBeforeCredits.credits + totalFederalDividendCredit + politicalContributionCredit,
    net: Math.max(0, federalTaxBeforeCredits.net - totalFederalDividendCredit - politicalContributionCredit)
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

  // Calculate net income (total income minus deductions)
  // Note: totalIncome was already calculated above for average tax rate
  const netIncomeBeforeAdjustments = totalIncome - totalDeductions
  
  // Calculate social benefits repayment (Line 23500)
  const socialBenefitsRepayment = calcSocialBenefitsRepayment(
    netIncomeBeforeAdjustments,
    inputs.oasPension || 0,
    inputs.netFederalSupplements || 0
  )
  
  const netIncome = Math.max(0, netIncomeBeforeAdjustments - socialBenefitsRepayment)

  // Calculate medical expense supplement (Line 45200) - needs netIncome
  const medicalExpenseSupplement = calcMedicalExpenseSupplement(
    inputs.medicalExpenses || 0,
    netIncome,
    inputs.employmentIncome
  )
  
  // Total federal credits (BPA + CPP + Canada Employment + Dividend credits + Donations + Political + Medical supplement)
  const totalFederalCredits = bpaCredit + cppCredit + canadaEmploymentCredit + totalFederalDividendCredit + donationsCredit + politicalContributionCredit + medicalExpenseSupplement

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
      carryingChargesDeduction: carryingChargesDeduction,
      totalDeductions: totalDeductions,
      netIncomeBeforeAdjustments: netIncomeBeforeAdjustments,
      socialBenefitsRepayment: socialBenefitsRepayment,
      netIncome: netIncome
    },
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    federalCredits: {
      basicPersonalAmount: Math.round(bpaAmount * 100) / 100,
      cppContributions: Math.round(cppContributions * 100) / 100,
      canadaEmploymentAmount: canadaEmploymentAmount,
      donationsCredit: Math.round(donationsCredit * 100) / 100,
      dividendTaxCredit: Math.round(totalFederalDividendCredit * 100) / 100, // Line 40425
      politicalContributionCredit: Math.round(politicalContributionCredit * 100) / 100, // Line 41000
      medicalExpenseSupplement: Math.round(medicalExpenseSupplement * 100) / 100, // Line 45200
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


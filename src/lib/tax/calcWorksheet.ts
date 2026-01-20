/**
 * Federal Tax Worksheet Calculations (T1-2024)
 * Based on 5000-D1 worksheet
 */

/**
 * Line 12000 and 12010 - Taxable amount of dividends
 * Calculates grossed-up dividend amounts for tax purposes
 */
export function calcDividendAmounts(
  eligibleDividends: number,
  ineligibleDividends: number
): {
  line12010: number // Taxable amount of dividends (other than eligible)
  line12000: number // Taxable amount of dividends (eligible and other than eligible)
} {
  // Line 12010: Other than eligible dividends grossed up by 115%
  const line12010 = ineligibleDividends * 1.15

  // Line 12000: Eligible dividends grossed up by 138% + ineligible grossed up by 115%
  const eligibleGrossedUp = eligibleDividends * 1.38
  const line12000 = eligibleGrossedUp + line12010

  return {
    line12010: Math.round(line12010 * 100) / 100,
    line12000: Math.round(line12000 * 100) / 100
  }
}

/**
 * Line 40425 - Federal dividend tax credit
 * Calculates the federal dividend tax credit based on worksheet
 */
export function calcFederalDividendTaxCredit(
  eligibleDividends: number,
  ineligibleDividends: number
): number {
  // If no information slip received, use worksheet calculation
  // Line 6: Ineligible dividends × 9.0301%
  const ineligibleCredit = ineligibleDividends * 0.090301

  // Line 7: (Eligible dividends) × 15.0198%
  const eligibleCredit = eligibleDividends * 0.150198

  // Line 8: Line 6 + Line 7
  const totalCredit = ineligibleCredit + eligibleCredit

  return Math.round(totalCredit * 100) / 100
}

/**
 * Line 22100 - Carrying charges, interest expenses, and other expenses
 * Deduction for investment-related expenses
 */
export function calcCarryingCharges(
  carryingCharges: number,
  interestExpenses: number,
  otherExpenses: number
): number {
  return Math.round((carryingCharges + interestExpenses + otherExpenses) * 100) / 100
}

/**
 * Line 23500 - Social benefits repayment
 * Calculates OAS and other social benefits repayment if net income exceeds thresholds
 */
export function calcSocialBenefitsRepayment(
  netIncome: number,
  oasPension: number,
  netFederalSupplements: number
): number {
  // Only calculate if net income exceeds thresholds
  // OAS repayment threshold: $79,000
  // Federal supplements threshold: $90,997
  const oasThreshold = 79000
  const supplementsThreshold = 90997

  let repayment = 0

  // OAS repayment calculation
  if (oasPension > 0 && netIncome > oasThreshold) {
    const adjustedNetIncome = netIncome // Simplified - would need more details for full calculation
    if (adjustedNetIncome > oasThreshold) {
      const excess = adjustedNetIncome - oasThreshold
      const repaymentRate = 0.15 // 15%
      repayment += Math.min(oasPension, excess * repaymentRate)
    }
  }

  // Federal supplements repayment calculation
  if (netFederalSupplements > 0 && netIncome > supplementsThreshold) {
    const adjustedNetIncome = netIncome // Simplified
    if (adjustedNetIncome > supplementsThreshold) {
      const excess = adjustedNetIncome - supplementsThreshold
      const repaymentRate = 0.15 // 15%
      repayment += Math.min(netFederalSupplements, excess * repaymentRate)
    }
  }

  return Math.round(repayment * 100) / 100
}

/**
 * Line 41000 - Federal political contribution tax credit
 * Calculates tax credit for political contributions
 */
export function calcPoliticalContributionCredit(contributions: number): number {
  if (contributions <= 0) return 0
  if (contributions >= 1275) return 650 // Maximum credit

  if (contributions <= 400) {
    return Math.round(contributions * 0.75 * 100) / 100
  } else if (contributions <= 750) {
    return Math.round((contributions - 400) * 0.50 + 300)
  } else {
    return Math.round((contributions - 750) * 0.3333 + 475)
  }
}

/**
 * Line 45200 - Refundable medical expense supplement
 * Calculates supplement for medical expenses (simplified - requires more data for full calculation)
 */
export function calcMedicalExpenseSupplement(
  medicalExpenses: number,
  netIncome: number,
  _employmentIncome: number // Reserved for future use in full calculation
): number {
  // Simplified calculation - full calculation requires adjusted family net income
  // and other factors
  if (medicalExpenses <= 0) return 0

  // Basic calculation: 25% of medical expenses up to $1,464, reduced by 5% of income over threshold
  const incomeThreshold = 32419
  const maxSupplement = 1464
  const supplementRate = 0.25
  const reductionRate = 0.05

  const excessIncome = Math.max(0, netIncome - incomeThreshold)
  const supplement = Math.min(medicalExpenses * supplementRate, maxSupplement)
  const reduction = excessIncome * reductionRate

  return Math.max(0, Math.round((supplement - reduction) * 100) / 100)
}

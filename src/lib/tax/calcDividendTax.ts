/**
 * Calculate dividend tax credits for eligible and ineligible dividends
 * Based on CRA dividend tax credit system
 */

/**
 * Calculate eligible dividend tax credit (federal)
 * Eligible dividends are grossed up by 38% and receive a 15.0198% tax credit
 * @param dividendAmount - Actual dividend amount received
 * @returns Object with grossed-up amount and federal tax credit
 */
export function calcEligibleDividendCredit(dividendAmount: number): {
  grossedUpAmount: number
  federalCredit: number
} {
  if (dividendAmount <= 0) {
    return { grossedUpAmount: 0, federalCredit: 0 }
  }

  // Gross-up: multiply by 1.38 (38% gross-up for 2025)
  const grossedUpAmount = dividendAmount * 1.38
  
  // Federal tax credit: 15.0198% of grossed-up amount
  const federalCredit = grossedUpAmount * 0.150198

  return {
    grossedUpAmount: Math.round(grossedUpAmount * 100) / 100,
    federalCredit: Math.round(federalCredit * 100) / 100
  }
}

/**
 * Calculate ineligible dividend tax credit (federal)
 * Ineligible dividends are grossed up by 15% and receive a 9.0301% tax credit
 * @param dividendAmount - Actual dividend amount received
 * @returns Object with grossed-up amount and federal tax credit
 */
export function calcIneligibleDividendCredit(dividendAmount: number): {
  grossedUpAmount: number
  federalCredit: number
} {
  if (dividendAmount <= 0) {
    return { grossedUpAmount: 0, federalCredit: 0 }
  }

  // Gross-up: multiply by 1.15 (15% gross-up for 2025)
  const grossedUpAmount = dividendAmount * 1.15
  
  // Federal tax credit: 9.0301% of grossed-up amount
  const federalCredit = grossedUpAmount * 0.090301

  return {
    grossedUpAmount: Math.round(grossedUpAmount * 100) / 100,
    federalCredit: Math.round(federalCredit * 100) / 100
  }
}

/**
 * Calculate provincial dividend tax credit (simplified)
 * Provincial credits vary by province and are typically a percentage of the federal credit
 * For simplicity, we'll use approximate rates
 * @param federalCredit - Federal dividend tax credit
 * @param province - Province code
 * @returns Provincial dividend tax credit
 */
export function calcProvincialDividendCredit(
  federalCredit: number,
  province: string
): number {
  if (federalCredit <= 0) return 0

  // Provincial dividend tax credit rates (approximate, as they vary)
  // These are rough estimates - actual rates vary by province
  const provincialRates: { [key: string]: number } = {
    'ON': 0.10, // Ontario: approximately 10% of federal credit
    'BC': 0.10,
    'AB': 0.10,
    'QC': 0.11, // Quebec has different system
    'MB': 0.10,
    'SK': 0.10,
    'NS': 0.10,
    'NB': 0.10,
    'NL': 0.10,
    'PE': 0.10,
    'NT': 0.10,
    'YT': 0.10,
    'NU': 0.10
  }

  const rate = provincialRates[province] || 0.10
  return Math.round(federalCredit * rate * 100) / 100
}


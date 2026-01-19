import { ProvincialTaxData } from './types'
import { calcTaxFromBrackets } from './calcTaxFromBrackets'

/**
 * Calculate provincial/territorial tax (gross only, no credits in MVP)
 * @param taxableIncome - Taxable income
 * @param provincialData - Provincial tax data
 * @returns Object with gross, credits (0), and net provincial tax
 */
export function calcProvincialTax(
  taxableIncome: number,
  provincialData: ProvincialTaxData
): { gross: number; credits: number; net: number } {
  // Calculate gross provincial tax using brackets
  const grossTax = calcTaxFromBrackets(taxableIncome, provincialData.brackets)
  
  // No provincial credits in MVP
  const credits = 0
  
  return {
    gross: Math.round(grossTax * 100) / 100,
    credits,
    net: Math.round(grossTax * 100) / 100
  }
}



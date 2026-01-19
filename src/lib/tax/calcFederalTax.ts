import { FederalTaxData } from './types'
import { calcTaxFromBrackets } from './calcTaxFromBrackets'
import { calcFederalBPA } from './calcFederalBPA'

/**
 * Calculate federal tax (gross tax minus BPA credit)
 * @param taxableIncome - Taxable income
 * @param federalData - Federal tax data
 * @returns Object with gross, credits, and net federal tax
 */
export function calcFederalTax(
  taxableIncome: number,
  federalData: FederalTaxData
): { gross: number; credits: number; net: number } {
  // Calculate gross federal tax using brackets
  const grossTax = calcTaxFromBrackets(taxableIncome, federalData.brackets)
  
  // Calculate BPA credit (using taxableIncome as netIncome for phase-out)
  const bpaCredit = calcFederalBPA(taxableIncome, federalData)
  
  // Net federal tax
  const netTax = Math.max(0, grossTax - bpaCredit)
  
  return {
    gross: Math.round(grossTax * 100) / 100,
    credits: Math.round(bpaCredit * 100) / 100,
    net: Math.round(netTax * 100) / 100
  }
}



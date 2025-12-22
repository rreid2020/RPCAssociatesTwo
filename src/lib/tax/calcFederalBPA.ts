import { FederalTaxData } from './types'

/**
 * Calculate Federal Basic Personal Amount (BPA) credit
 * BPA phases out between phaseOutStart and phaseOutEnd
 * @param netIncome - Net income (used for phase-out calculation)
 * @param federalData - Federal tax data including BPA configuration
 * @returns BPA credit amount (in dollars, not percentage)
 */
export function calcFederalBPA(netIncome: number, federalData: FederalTaxData): number {
  const { fullAmount, phaseOutStart, phaseOutEnd, minimumAmount } = federalData.bpa

  if (netIncome <= phaseOutStart) {
    // Full BPA credit
    return Math.round(fullAmount * federalData.lowestRate * 100) / 100
  } else if (netIncome >= phaseOutEnd) {
    // Minimum BPA credit
    return minimumAmount * federalData.lowestRate
  } else {
    // Phase-out calculation: linear reduction between phaseOutStart and phaseOutEnd
    const phaseOutRange = phaseOutEnd - phaseOutStart
    const incomeAboveStart = netIncome - phaseOutStart
    const phaseOutRatio = incomeAboveStart / phaseOutRange
    
    // Linear interpolation between fullAmount and minimumAmount
    const bpaAmount = fullAmount - (fullAmount - minimumAmount) * phaseOutRatio
    
    return Math.round(bpaAmount * federalData.lowestRate * 100) / 100
  }
}


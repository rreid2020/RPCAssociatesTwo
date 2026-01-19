import { TaxBracket } from './types'

/**
 * Calculate tax using progressive bracket system
 * @param income - Taxable income
 * @param brackets - Array of tax brackets with upTo and rate
 * @returns Total tax amount
 */
export function calcTaxFromBrackets(income: number, brackets: TaxBracket[]): number {
  if (income <= 0) return 0

  let tax = 0
  let previousBracketTop = 0

  for (const bracket of brackets) {
    if (bracket.upTo === null) {
      // Top bracket - apply rate to remaining income
      const remainingIncome = income - previousBracketTop
      if (remainingIncome > 0) {
        tax += remainingIncome * bracket.rate
      }
      break
    } else {
      // Calculate tax for this bracket
      const bracketSize = bracket.upTo - previousBracketTop
      const incomeInBracket = Math.min(income - previousBracketTop, bracketSize)
      
      if (incomeInBracket > 0) {
        tax += incomeInBracket * bracket.rate
      }

      // If income is less than this bracket's top, we're done
      if (income <= bracket.upTo) {
        break
      }

      previousBracketTop = bracket.upTo
    }
  }

  return Math.round(tax * 100) / 100 // Round to 2 decimals
}



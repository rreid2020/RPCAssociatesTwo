/**
 * CPP (rest of Canada) and QPP (Quebec) employee contributions — 2025.
 */

import { CPP_2025, QPP_2025 } from '../data/cpp'
import type { Province } from '../types/taxTypes'

export const round2 = (n: number): number => Math.round(n * 100) / 100

export interface CppResult {
  employee: number
  pensionableEarnings: number
  isQuebec: boolean
}

function employeeContribution(
  employmentIncome: number,
  basicExemption: number,
  ympe: number,
  rate: number
): CppResult {
  const pensionable = Math.min(Math.max(0, employmentIncome), ympe)
  const contributory = Math.max(0, pensionable - basicExemption)
  const raw = contributory * rate
  return {
    employee: round2(raw),
    pensionableEarnings: round2(pensionable),
    isQuebec: false,
  }
}

/** Employee CPP (excluding CPP2). */
export function calculateCPP(employmentIncome: number): CppResult {
  return employeeContribution(employmentIncome, CPP_2025.basicExemption, CPP_2025.ympe, CPP_2025.employeeRate)
}

/** Employee QPP (Quebec). */
export function calculateQPP(employmentIncome: number): CppResult {
  const r = employeeContribution(employmentIncome, QPP_2025.basicExemption, QPP_2025.ympe, QPP_2025.employeeRate)
  return { ...r, isQuebec: true }
}

export function calculateCppOrQpp(employmentIncome: number, province: Province): CppResult {
  return province === 'QC' ? calculateQPP(employmentIncome) : calculateCPP(employmentIncome)
}

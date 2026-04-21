/**
 * CPP / QPP — 2025 employee contributions (CRA-aligned).
 * CPP2 (second additional) omitted in v1; reserved for extension.
 */

export const CPP_2025 = {
  year: 2025,
  basicExemption: 3_500,
  /** Maximum pensionable earnings (YMPE). */
  ympe: 71_300,
  /** Year’s additional maximum pensionable earnings ceiling (YMPE2) — CPP2; not applied in v1. */
  ympe2: 81_200,
  employeeRate: 0.0595,
  /** Maximum employee contribution at YMPE (YMPE − basic exemption) × rate. */
} as const

export const QPP_2025 = {
  year: 2025,
  basicExemption: 3_500,
  /** QPP maximum pensionable earnings (aligned with CPP YMPE for 2025). */
  ympe: 71_300,
  employeeRate: 0.064,
} as const

export function maxCppEmployeeContribution2025(): number {
  const pensionable = Math.max(0, CPP_2025.ympe - CPP_2025.basicExemption)
  return Math.round(pensionable * CPP_2025.employeeRate * 100) / 100
}

export function maxQppEmployeeContribution2025(): number {
  const pensionable = Math.max(0, QPP_2025.ympe - QPP_2025.basicExemption)
  return Math.round(pensionable * QPP_2025.employeeRate * 100) / 100
}

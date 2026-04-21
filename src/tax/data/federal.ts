/**
 * Federal tax parameters — 2025 (CRA-aligned).
 * Sources: canada.ca individual tax rates; T4044 dividend gross-up/DTC.
 */

import type { Bracket } from '../types/taxTypes'

/** Progressive federal brackets (Part I tax on ordinary income). */
export const FEDERAL_BRACKETS: Bracket[] = [
  { upTo: 57_375, rate: 0.145 },
  { upTo: 114_750, rate: 0.205 },
  { upTo: 177_882, rate: 0.26 },
  { upTo: 253_414, rate: 0.29 },
  { upTo: null, rate: 0.33 },
]

/** Lowest federal rate (used for non-refundable credits including BPA). */
export const FEDERAL_LOWEST_RATE = 0.145

/** Federal Basic Personal Amount (BPA) — phase-out 2025. */
export const FEDERAL_BPA = {
  fullAmount: 15_705,
  phaseOutStart: 173_000,
  phaseOutEnd: 246_752,
  minimumAmount: 14_000,
} as const

/** Federal dividend gross-up multipliers (actual dividend × multiplier = taxable amount). */
export const DIVIDEND_GROSSUP = {
  eligible: 1.38,
  nonEligible: 1.15,
} as const

/**
 * Federal dividend tax credit rates applied to **grossed-up** dividend income (same basis as CRA forms).
 * Eligible: 15.0198% of grossed-up; other than eligible: 9.0301% of grossed-up (2025).
 */
export const DIVIDEND_FEDERAL_DTC_ON_GROSSUP = {
  eligible: 0.150198,
  nonEligible: 0.090301,
} as const

/** Federal tax abatement factor for Quebec residents (reduces federal Part I tax). */
export const QUEBEC_FEDERAL_ABATEMENT_RATE = 0.165

/** Federal CCPC rates on active business income (Part I). */
export const FEDERAL_CCPC = {
  smallBusinessRate: 0.09,
  generalRate: 0.15,
} as const

/** Extension hooks — no logic in v1. */
export type RDTOHPlaceholder = Record<string, never>
export type SbdGrindPlaceholder = Record<string, never>

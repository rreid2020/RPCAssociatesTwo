/**
 * Central tax parameters for the donation optimizer (2025).
 * Federal bracket start for 33% marginal rate aligns with src/tax-data/2025/federal.json.
 */

export const DONATION_TAX_YEAR = 2025

/** First dollar of taxable income taxed at the top federal rate (33% in 2025 data file). */
export const FEDERAL_TOP_BRACKET_START = 253_414

/** Federal charitable donation credit — first $200 at lowest federal rate (2025: 14.5%). */
export const FEDERAL_CHARITY_FIRST_200_RATE = 0.145
/** Remainder when not in top bracket for donation credit purposes (simplified). */
export const FEDERAL_CHARITY_ABOVE_200_RATE_STANDARD = 0.29
/** Remainder when simplified high-income rule applies. */
export const FEDERAL_CHARITY_ABOVE_200_RATE_HIGH = 0.33

export const ONTARIO_CHARITY_FIRST_200_RATE = 0.0505
export const ONTARIO_CHARITY_ABOVE_200_RATE = 0.1116

/** Federal political contribution credit tiers (Schedule 1 / line 41000 style). */
export const POLITICAL_TIER_1_MAX = 400
export const POLITICAL_TIER_1_RATE = 0.75
export const POLITICAL_TIER_2_MAX = 750 // 400 + 350
export const POLITICAL_TIER_2_RATE = 0.5
export const POLITICAL_TIER_3_MAX = 1275 // 750 + 525
export const POLITICAL_TIER_3_RATE = 1 / 3
export const POLITICAL_MAX_CREDIT = 650

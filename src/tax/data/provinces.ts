/**
 * Provincial / territorial data — 2025.
 * Brackets: canada.ca provincial rates. Dividend provincial DTC: % of **grossed-up** dividend (CRA-aligned style).
 * Corporate rates: active business — small business vs general (combined with federal in corporateTax engine).
 * Basic personal amounts: approximate credit bases for non-refundable provincial BPA credit at lowest rate (v1, no provincial BPA phase-out).
 */

import type { Bracket, Province } from '../types/taxTypes'

export interface ProvincialDividendDtcRates {
  /** Provincial eligible DTC as fraction of grossed-up eligible dividends. */
  eligibleOnGrossUp: number
  /** Provincial other-than-eligible DTC as fraction of grossed-up OTI dividends. */
  nonEligibleOnGrossUp: number
}

export interface ProvincialCorporateRates {
  smallBusiness: number
  general: number
}

export interface ProvincialData {
  brackets: Bracket[]
  lowestRate: number
  /** Credit base × lowestRate = simplified provincial BPA credit (v1). */
  basicPersonalAmount: number
  dividendProvincial: ProvincialDividendDtcRates
  corporate: ProvincialCorporateRates
}

function brackets(rows: [number | null, number][]): Bracket[] {
  return rows.map(([upTo, rate]) => ({ upTo, rate }))
}

export const PROVINCIAL_DATA: Record<Province, ProvincialData> = {
  AB: {
    brackets: brackets([
      [60_000, 0.08],
      [151_234, 0.1],
      [181_481, 0.12],
      [241_974, 0.13],
      [362_961, 0.14],
      [null, 0.15],
    ]),
    lowestRate: 0.08,
    basicPersonalAmount: 21_003,
    dividendProvincial: { eligibleOnGrossUp: 0.08, nonEligibleOnGrossUp: 0.025493 },
    corporate: { smallBusiness: 0.02, general: 0.12 },
  },
  BC: {
    brackets: brackets([
      [47_937, 0.0506],
      [95_875, 0.077],
      [110_076, 0.105],
      [133_664, 0.1229],
      [181_232, 0.147],
      [252_752, 0.168],
      [null, 0.205],
    ]),
    lowestRate: 0.0506,
    basicPersonalAmount: 11_981,
    dividendProvincial: { eligibleOnGrossUp: 0.12, nonEligibleOnGrossUp: 0.0196 },
    corporate: { smallBusiness: 0.02, general: 0.12 },
  },
  MB: {
    brackets: brackets([
      [47_000, 0.108],
      [100_000, 0.1275],
      [null, 0.174],
    ]),
    lowestRate: 0.108,
    basicPersonalAmount: 15_130,
    dividendProvincial: { eligibleOnGrossUp: 0.08, nonEligibleOnGrossUp: 0.02625 },
    corporate: { smallBusiness: 0, general: 0.12 },
  },
  NB: {
    brackets: brackets([
      [49_958, 0.094],
      [99_916, 0.14],
      [185_064, 0.16],
      [null, 0.195],
    ]),
    lowestRate: 0.094,
    basicPersonalAmount: 13_328,
    dividendProvincial: { eligibleOnGrossUp: 0.12, nonEligibleOnGrossUp: 0.024 },
    corporate: { smallBusiness: 0.025, general: 0.14 },
  },
  NL: {
    brackets: brackets([
      [43_198, 0.087],
      [86_395, 0.145],
      [154_244, 0.158],
      [215_943, 0.173],
      [null, 0.183],
    ]),
    lowestRate: 0.087,
    basicPersonalAmount: 10_177,
    dividendProvincial: { eligibleOnGrossUp: 0.064, nonEligibleOnGrossUp: 0.028 },
    corporate: { smallBusiness: 0.03, general: 0.15 },
  },
  NS: {
    brackets: brackets([
      [29_590, 0.0879],
      [59_180, 0.1495],
      [93_000, 0.1667],
      [150_000, 0.175],
      [null, 0.21],
    ]),
    lowestRate: 0.0879,
    basicPersonalAmount: 11_444,
    dividendProvincial: { eligibleOnGrossUp: 0.08895, nonEligibleOnGrossUp: 0.02986 },
    corporate: { smallBusiness: 0.0275, general: 0.14 },
  },
  NT: {
    brackets: brackets([
      [50_877, 0.059],
      [101_754, 0.086],
      [165_429, 0.122],
      [null, 0.1405],
    ]),
    lowestRate: 0.059,
    basicPersonalAmount: 16_734,
    dividendProvincial: { eligibleOnGrossUp: 0.06, nonEligibleOnGrossUp: 0.025 },
    corporate: { smallBusiness: 0.02, general: 0.115 },
  },
  NU: {
    brackets: brackets([
      [50_877, 0.04],
      [101_754, 0.07],
      [165_429, 0.09],
      [null, 0.115],
    ]),
    lowestRate: 0.04,
    basicPersonalAmount: 18_209,
    dividendProvincial: { eligibleOnGrossUp: 0.04, nonEligibleOnGrossUp: 0.03 },
    corporate: { smallBusiness: 0.03, general: 0.12 },
  },
  ON: {
    brackets: brackets([
      [51_446, 0.0505],
      [102_894, 0.0915],
      [150_000, 0.1116],
      [220_000, 0.1216],
      [null, 0.1316],
    ]),
    lowestRate: 0.0505,
    basicPersonalAmount: 12_421,
    dividendProvincial: { eligibleOnGrossUp: 0.1, nonEligibleOnGrossUp: 0.029863 },
    corporate: { smallBusiness: 0.032, general: 0.115 },
  },
  PE: {
    brackets: brackets([
      [32_656, 0.098],
      [65_312, 0.138],
      [105_000, 0.167],
      [null, 0.18],
    ]),
    lowestRate: 0.098,
    basicPersonalAmount: 14_250,
    dividendProvincial: { eligibleOnGrossUp: 0.102, nonEligibleOnGrossUp: 0.0296 },
    corporate: { smallBusiness: 0.01, general: 0.16 },
  },
  QC: {
    brackets: brackets([
      [53_080, 0.14],
      [106_155, 0.19],
      [null, 0.24],
    ]),
    lowestRate: 0.14,
    basicPersonalAmount: 18_056,
    /** Quebec uses a distinct integration; these approximate provincial DTC on gross-up for modeling. */
    dividendProvincial: { eligibleOnGrossUp: 0.11735, nonEligibleOnGrossUp: 0.05205 },
    corporate: { smallBusiness: 0.032, general: 0.115 },
  },
  SK: {
    brackets: brackets([
      [52_057, 0.105],
      [148_734, 0.125],
      [null, 0.145],
    ]),
    lowestRate: 0.105,
    basicPersonalAmount: 18_491,
    dividendProvincial: { eligibleOnGrossUp: 0.11, nonEligibleOnGrossUp: 0.01625 },
    corporate: { smallBusiness: 0.01, general: 0.12 },
  },
  YT: {
    brackets: brackets([
      [55_867, 0.064],
      [111_733, 0.09],
      [173_446, 0.109],
      [500_000, 0.128],
      [null, 0.15],
    ]),
    lowestRate: 0.064,
    basicPersonalAmount: 15_705,
    dividendProvincial: { eligibleOnGrossUp: 0.125, nonEligibleOnGrossUp: 0.0205 },
    corporate: { smallBusiness: 0, general: 0.12 },
  },
}

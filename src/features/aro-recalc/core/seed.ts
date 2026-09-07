/**
 * Seeded demo obligations — the three rows the original calculator opened on.
 *
 * Lifted from the client Master Sheet + PBC Rep 6 so a reviewer can see the
 * chain work before any extract is loaded. They are illustrative: importing
 * REP04 replaces them (`mergeRep04` with `seeded: true`).
 */

import { RecalcRow } from '../engine/recalc';
import { RecalcRegister, emptyRecalcRegister } from './recalc';

export const SEED_ROWS: RecalcRow[] = [
  {
    id: '1104279',
    cost: 19_546_595.86,
    costEstimateDate: '1992-12-23',
    settlementDate: '2037-01-31',
    rateOverride: null,
    sourceFv: 46_815_157.32,
    sourcePv: 32_685_377.12,
  },
  {
    id: '1104240',
    cost: 20_004_539.42,
    costEstimateDate: '1994-02-24',
    settlementDate: '2038-03-31',
    rateOverride: null,
    sourceFv: 47_909_321.55,
    sourcePv: 31_960_299.02,
  },
  {
    id: '1103206',
    cost: 15_176_150.94,
    costEstimateDate: '2026-01-01',
    settlementDate: '2049-08-28',
    rateOverride: null,
    sourceFv: 24_246_622.84,
    sourcePv: 10_245_340.20,
  },
];

export const INFLATION_PRESETS: { label: string; basis: string; rate: number }[] = [
  { label: 'DND policy inflation', basis: 'Current', rate: 0.02 },
  { label: 'CPI-U long run', basis: 'Sensitivity — high', rate: 0.025 },
  { label: 'Construction cost', basis: 'Sensitivity — ENR', rate: 0.031 },
];

export function seededRecalcRegister(fyEnd: string): RecalcRegister {
  return {
    ...emptyRecalcRegister(fyEnd),
    rows: SEED_ROWS.map((r) => ({ ...r })),
    seeded: true,
  };
}

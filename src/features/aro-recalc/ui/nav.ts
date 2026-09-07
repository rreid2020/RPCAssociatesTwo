/**
 * The ten steps of a recalculation — the original calculator's workflow,
 * labelled in the ARO Suite's vocabulary so a firm running both reads one
 * language.
 *
 * The ids are load-bearing beyond the sidebar: `exceptions()` in
 * `core/recalc.ts` names the step that resolves each exception, and the
 * "Resolve" button on Exceptions & clearance navigates by that id.
 */

export type Phase = 'Prepare' | 'Measure' | 'Assure';

export const PHASES: Phase[] = ['Prepare', 'Measure', 'Assure'];

export interface StepDef {
  id: string;
  label: string;
  phase: Phase;
  /** The one-line purpose shown under the step name in the header strip. */
  purpose: string;
}

export const STEPS: StepDef[] = [
  /* ── Prepare ──────────────────────────────────────────────────────────── */
  {
    id: 'recalc-import',
    label: 'Source extracts',
    phase: 'Prepare',
    purpose:
      'Load the cost estimate extract (REP04), the settlement date and reported value extract (REP06) and the interest rate curve. Each file is staged, its columns mapped and its content shown before anything is merged, so nothing enters the register unseen.',
  },
  {
    id: 'recalc-source',
    label: 'Imported data',
    phase: 'Prepare',
    purpose:
      'The extracts as they were read, with the mapped columns marked, so a reader can tie every figure in the recalculation back to a row in the original workbook.',
  },

  /* ── Measure ──────────────────────────────────────────────────────────── */
  {
    id: 'recalculation',
    label: 'Calculation results',
    phase: 'Measure',
    purpose:
      'The independent recalculation, obligation by obligation: the cost estimate escalated to the year end, escalated again to settlement, then discounted back at the rate the curve gives for the rounded term. Open a row for the same calculation written as Excel — paste the column into a blank sheet and every figure here reproduces, unaided.',
  },
  {
    id: 'recalc-accretion',
    label: 'Results & accretion',
    phase: 'Measure',
    purpose:
      'The discount unwinding from the recalculated present value to the future value at settlement, period by period, so the two figures can be seen to be the same measurement at different dates.',
  },
  {
    id: 'recalc-compare',
    label: 'Source comparison',
    phase: 'Measure',
    purpose:
      'The recalculation against the figures the source system reported, obligation by obligation and in total, tested against tiered materiality. The trial-balance control total sits here too: agreeing the extract to an independently sourced total is what proves the population complete — without it a perfect recalculation of half the balance still reads clean.',
  },

  /* ── Assure ───────────────────────────────────────────────────────────── */
  {
    id: 'recalc-exceptions',
    label: 'Exceptions & clearance',
    phase: 'Assure',
    purpose:
      'Everything standing between the register and a finalised recalculation. Nothing here is a checkbox: each item reads live state and computes its own pass/fail, so it clears when the data that caused it changes and not before. A blocker means the recalculation cannot be concluded; a review means it needs an explanation on file first.',
  },
  {
    id: 'recalc-variance',
    label: 'Variance & sign-off',
    phase: 'Assure',
    purpose:
      'Why one obligation differs from what the source system reported, in two steps that sum to the variance exactly. The source publishes three figures and none of its assumptions, so its rates are back-solved over the recalculated terms — an implied rate absorbs everything in its leg, which is why the FV variance is reported separately.',
  },
  {
    id: 'recalc-audit',
    label: 'Audit trail',
    phase: 'Assure',
    purpose:
      'Every write to the register, newest first. An auditor can see what changed and when, then reproduce the calculation as it stood.',
  },
  {
    id: 'recalc-assumptions',
    label: 'Assumptions library',
    phase: 'Assure',
    purpose:
      'Inflation and the FY year end are set once and apply to every obligation. The discount rate is looked up on the curve at each obligation\'s term, rounded up to the next whole year — the source system\'s own convention.',
  },
  {
    id: 'recalc-raw',
    label: 'Raw dataset',
    phase: 'Assure',
    purpose:
      'The register as stored, per obligation, with CSV, JSON and Excel exports. Inflation, the year end and the curve live in the assumptions library, not on the rows.',
  },
];

/** A fresh register opens on the calculation, as the original tool did. */
export const FIRST_STEP = 'recalculation';

export function stepById(id: string): StepDef | undefined {
  return STEPS.find((s) => s.id === id);
}

/**
 * A stored or supplied screen id, resolved to one that exists.
 *
 * An unknown id lands on the first step rather than a blank frame — a stale
 * `localStorage` blob from an earlier build should cost a click, not the
 * register.
 */
export function resolveScreen(id: string): string {
  return stepById(id) ? id : FIRST_STEP;
}

/** "03" — the step's position, for the sidebar. */
export function stepNumber(id: string): string {
  const i = STEPS.findIndex((s) => s.id === id);
  return i < 0 ? '' : String(i + 1).padStart(2, '0');
}

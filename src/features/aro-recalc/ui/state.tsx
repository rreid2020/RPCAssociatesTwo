/**
 * The whole of this tool's state.
 *
 * One register and one append-only action log — held in React state and
 * persisted to `localStorage`. There is no server, no database, no sign-in and
 * no engagement: an auditor can run this on an extract they are not permitted
 * to upload anywhere, and the client's file never leaves the machine.
 *
 * That also sets the limits honestly. Two of the ARO Suite's invariants do not
 * and cannot apply here:
 *
 * - **§3, the authority model.** A single-purpose tool has one user, who owns
 *   everything in it. There is nothing to refuse a write against.
 * - **§7, role gating.** Preparer / reviewer / partner is a property of an
 *   engagement team, not of a calculator. The sign-off below records *that* a
 *   conclusion was reached and by whom; it does not enforce who may reach it.
 *
 * §2 does apply and is kept: the action log is only ever prepended to.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { RecalcRegister, emptyRecalcRegister } from '../core/recalc';
import { seededRecalcRegister } from '../core/seed';
import { FIRST_STEP, resolveScreen } from './nav';

const STORE = 'aro-recalc-v3';

/** The default year end for a new register — a March year end, as the client's. */
const DEFAULT_FY_END = '2026-03-31';

export interface LogEntry {
  /** ISO timestamp. */
  at: string;
  action: string;
  detail: string;
}

/**
 * Where the user is and who they are.
 *
 * Genuine client state — README, "State management". It is persisted only so
 * that a reload lands back on the step the work was left on; nothing here is
 * an input to a figure. `userName` is the one exception, and it is not a
 * credential: it is the name written onto the variance conclusion and the
 * export, typed by whoever is signing.
 */
export interface UiState {
  screen: string;
  userName: string;
  /** Obligation opened on Variance / accretion via Explain. */
  inspectId: string;
}

export interface AppState {
  reg: RecalcRegister;
  /** Append-only — INVARIANTS §2. Newest first. */
  log: LogEntry[];
}

interface Persisted {
  state: AppState;
  ui: UiState;
}

function initialState(): AppState {
  return { reg: seededRecalcRegister(DEFAULT_FY_END), log: [] };
}

function initialUi(): UiState {
  return { screen: FIRST_STEP, userName: '', inspectId: '' };
}

/**
 * What was persisted, if anything usable was.
 *
 * A stored blob from an older shape is discarded rather than migrated. There is
 * no version of this tool whose figures are worth silently reinterpreting — a
 * half-understood register is worse than an empty one, because the exceptions
 * would read as cleared when they had merely been lost.
 */
function load(): Persisted {
  const fresh: Persisted = { state: initialState(), ui: initialUi() };
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return fresh;
    const blob = JSON.parse(raw) as Partial<Persisted> & Partial<AppState>;
    if (!blob || typeof blob !== 'object') return fresh;
    const d = (blob.state ?? blob) as Partial<AppState>;
    if (!d.reg || !Array.isArray(d.reg.rows)) return fresh;
    const u = (blob.ui ?? {}) as Partial<UiState>;
    return {
      state: {
        reg: { ...emptyRecalcRegister(DEFAULT_FY_END), ...d.reg },
        log: Array.isArray(d.log) ? d.log : [],
      },
      ui: {
        screen: resolveScreen(typeof u.screen === 'string' ? u.screen : ''),
        userName: typeof u.userName === 'string' ? u.userName : '',
        inspectId: typeof u.inspectId === 'string' ? u.inspectId : '',
      },
    };
  } catch {
    return fresh;
  }
}

export interface Store {
  state: AppState;
  ui: UiState;
  /** Write to the register and record what was done. */
  set: (action: string, next: Partial<RecalcRegister>, detail?: string) => void;
  /** Move around, or say who is signing. Never logged — it changes no figure. */
  setUi: (next: Partial<UiState>) => void;
  /** Empty the register. Asks first, at the call site. */
  reset: () => void;
  /** Restore the three demo obligations. */
  resetToSeed: () => void;
  /** True when the last persist failed — the screen says so rather than lying. */
  storageBlocked: boolean;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [{ state, ui }, setAll] = useState<Persisted>(load);
  const [storageBlocked, setBlocked] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ state, ui }));
      setBlocked(false);
    } catch {
      setBlocked(true);
    }
  }, [state, ui]);

  const set = useCallback((action: string, next: Partial<RecalcRegister>, detail = '') => {
    setAll((s) => ({
      ...s,
      state: {
        ...s.state,
        reg: { ...s.state.reg, ...next },
        log: [{ at: new Date().toISOString(), action, detail }, ...s.state.log],
      },
    }));
  }, []);

  const setUi = useCallback((next: Partial<UiState>) => {
    setAll((s) => ({ ...s, ui: { ...s.ui, ...next } }));
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORE);
    } catch {
      /* nothing persisted to clear */
    }
    setAll((s) => ({
      state: { reg: emptyRecalcRegister(DEFAULT_FY_END), log: [] },
      ui: { ...initialUi(), userName: s.ui.userName },
    }));
  }, []);

  const resetToSeed = useCallback(() => {
    try {
      localStorage.removeItem(STORE);
    } catch {
      /* nothing persisted to clear */
    }
    setAll((s) => ({
      state: {
        reg: seededRecalcRegister(DEFAULT_FY_END),
        log: [{ at: new Date().toISOString(), action: 'Reset to seed', detail: '' }],
      },
      ui: { ...initialUi(), userName: s.ui.userName },
    }));
  }, []);

  const value = useMemo<Store>(
    () => ({ state, ui, set, setUi, reset, resetToSeed, storageBlocked }),
    [state, ui, set, setUi, reset, resetToSeed, storageBlocked],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside a StoreProvider');
  return s;
}

/** The register and a writer for it — what every screen actually wants. */
export function useRegister() {
  const { state, set } = useStore();
  return { reg: state.reg, set };
}

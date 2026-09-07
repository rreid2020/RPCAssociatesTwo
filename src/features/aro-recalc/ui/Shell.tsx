/**
 * The app shell — SCREENS.md, "Layout pattern", with the original calculator's
 * global controls: FY year end, inflation, materiality, flagged count, the
 * seed banner and the portfolio metrics bar.
 */

import React, { useMemo, useState } from 'react';
import { useStore } from './state';
import { PHASES, STEPS, resolveScreen, stepById, stepNumber } from './nav';
import { curveInForce, exceptions, portfolioTotals } from '../core/recalc';
import { money, parseNumber } from '../core/format';
import { AroWordmark } from './Logo';
import { Screen } from './screens';

const RULE = '1px solid color-mix(in srgb,var(--color-bg) 20%,transparent)';

const signed = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return `${r > 0 ? '+' : r < 0 ? '-' : ''}${money(Math.abs(r))}`;
};

export function Shell() {
  const { state, ui, set, setUi, reset, resetToSeed, storageBlocked } = useStore();
  const screen = resolveScreen(ui.screen);
  const step = stepById(screen)!;
  const report = exceptions(state.reg);
  const totals = useMemo(() => portfolioTotals(state.reg), [state.reg]);
  const extractsIncomplete = !(state.reg.rep04 && state.reg.rep06 && state.reg.curve);

  const [draft, setDraft] = useState<Record<string, string>>({});
  const dv = (key: string, committed: string) => draft[key] ?? committed;
  const commit = (key: string) => setDraft((d) => { const n = { ...d }; delete n[key]; return n; });

  const seedLabel = (!state.reg.rep04 && !state.reg.rep06 && !state.reg.curve)
    ? 'Seeded demo data'
    : 'Source data incomplete';
  const curve = curveInForce(state.reg);
  const seedNote = [
    !state.reg.rep04
      ? `REP04 not imported — ${totals.count.toLocaleString('en-US')} seeded obligations (cost estimates and dates), plus any edits saved in this browser.`
      : `REP04: ${state.reg.rep04.summary}.`,
    !state.reg.rep06
      ? `REP06 not imported — reported FV/PV are seeded, and ${totals.covered.toLocaleString('en-US')} of ${totals.count.toLocaleString('en-US')} obligations carry figures to compare against.`
      : `REP06: ${state.reg.rep06.summary}.`,
    !state.reg.curve
      ? `Bond yield curve not imported — discount rates come from the built-in FY26 curve, ${curve.points.length} terms to ${curve.points[curve.points.length - 1]?.term ?? 0} years.`
      : `Curve: ${state.reg.curveSource || curve.asAt}.`,
    `Inflation ${(state.reg.inflation * 100).toFixed(2)}%, FY end ${state.reg.fyEnd}. Figures are illustrative until the real extracts are loaded.`,
  ].join(' ');

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'stretch' }}>
      <nav
        style={{
          width: 244, flex: 'none',
          background: 'var(--color-accent)', color: 'var(--color-bg)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: 'calc(100vh - 120px)', overflowY: 'auto',
        }}
      >
        <div style={{ padding: '16px 18px', borderBottom: RULE }}>
          <AroWordmark />
        </div>

        <div style={{ padding: '12px 10px 4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {PHASES.map((phase) => (
            <React.Fragment key={phase}>
              <div style={{ fontSize: 8.5, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.45, padding: '10px 10px 4px' }}>
                {phase}
              </div>
              {STEPS.filter((s) => s.phase === phase).map((s) => (
                <SideButton
                  key={s.id}
                  active={screen === s.id}
                  label={s.label}
                  title={s.purpose}
                  num={stepNumber(s.id)}
                  badge={s.id === 'recalc-exceptions' && report.blockers ? String(report.blockers) : ''}
                  onClick={() => setUi({ screen: s.id })}
                />
              ))}
            </React.Fragment>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '14px 18px', borderTop: RULE, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65 }}>
            {storageBlocked ? 'Not being saved' : 'Saved on this machine'}
          </div>
          <div style={{ fontSize: 10.5, lineHeight: 1.45, opacity: 0.72, textWrap: 'pretty' }}>
            {storageBlocked
              ? 'Browser storage is full or unavailable, so this register will not survive a reload. Export the workbook before closing the tab.'
              : 'Nothing leaves this browser. The extracts, the register and the conclusion are held in local storage only.'}
          </div>
          <button
            style={{
              background: 'transparent',
              border: '1px solid color-mix(in srgb,var(--color-bg) 40%,transparent)',
              color: 'var(--color-bg)', padding: '5px 8px', fontSize: 11,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
            onClick={resetToSeed}
          >
            Reset to seed
          </button>
          <ResetButton onReset={reset} />
        </div>
      </nav>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap',
            padding: '14px 26px 12px', borderBottom: '2px solid var(--color-divider)',
          }}
        >
          <div style={{ marginRight: 'auto', minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }} className="muted">
              {step.phase}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {step.label}
            </div>
            <div style={{ fontSize: 12, marginTop: 2, textWrap: 'pretty', maxWidth: '78ch' }} className="muted">
              {step.purpose}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div className="field" style={{ width: 146, margin: 0 }}>
              <label>FY year end</label>
              <input
                className="input"
                value={dv('fyEnd', state.reg.fyEnd)}
                onChange={(e) => setDraft((d) => ({ ...d, fyEnd: e.target.value }))}
                onBlur={(e) => {
                  commit('fyEnd');
                  if (e.target.value !== state.reg.fyEnd) set('Set FY year end', { fyEnd: e.target.value });
                }}
                style={{ fontVariantNumeric: 'tabular-nums', minHeight: 30, fontSize: 13 }}
              />
            </div>
            <div className="field" style={{ width: 88, margin: 0 }}>
              <label>Inflation</label>
              <input
                className="input"
                value={dv('infl', (state.reg.inflation * 100).toFixed(2))}
                onChange={(e) => setDraft((d) => ({ ...d, infl: e.target.value }))}
                onBlur={(e) => {
                  commit('infl');
                  set('Set inflation rate', { inflation: parseNumber(e.target.value) / 100 });
                }}
                style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', minHeight: 30, fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, paddingLeft: 16, borderLeft: '1px solid var(--color-divider)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="kicker">Materiality</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15 }}>
                  <span>$</span>
                  <input
                    className="input"
                    value={dv('mu', String(state.reg.materiality.usd))}
                    onChange={(e) => setDraft((d) => ({ ...d, mu: e.target.value }))}
                    onBlur={(e) => {
                      commit('mu');
                      set('Set absolute materiality', { materiality: { ...state.reg.materiality, usd: Math.abs(parseNumber(e.target.value)) } });
                    }}
                    title="Absolute materiality — 0 flags any variance at all"
                    style={{ width: 74, minHeight: 26, padding: '1px 5px', fontSize: 13.5, textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                  />
                  <span className="muted">/</span>
                  <input
                    className="input"
                    value={dv('mp', String(state.reg.materiality.pct))}
                    onChange={(e) => setDraft((d) => ({ ...d, mp: e.target.value }))}
                    onBlur={(e) => {
                      commit('mp');
                      set('Set relative materiality', { materiality: { ...state.reg.materiality, pct: Math.abs(parseNumber(e.target.value)) } });
                    }}
                    title="Relative materiality, % of the reported balance"
                    style={{ width: 54, minHeight: 26, padding: '1px 5px', fontSize: 13.5, textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                  />
                  <span>%</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="kicker">Flagged</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
                  {totals.flagged} of {totals.covered}
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setUi({ screen: 'recalc-import' })}>
                Import extracts
              </button>
            </div>
          </div>
        </header>

        {extractsIncomplete && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              padding: '10px 26px', borderBottom: '2px solid var(--color-divider)',
              background: 'var(--color-accent)', color: 'var(--color-bg)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', flex: 'none' }}>
              {seedLabel}
            </span>
            <span style={{ fontSize: 12.5, lineHeight: 1.45, flex: 1, minWidth: 240 }}>{seedNote}</span>
            <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
              <button className="btn btn-sm" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: 0 }} onClick={() => setUi({ screen: 'recalc-import' })}>
                Import extracts →
              </button>
              <button
                className="btn btn-sm"
                style={{ background: 'transparent', color: 'var(--color-bg)', border: '2px solid var(--color-bg)' }}
                onClick={resetToSeed}
              >
                Reset to seed
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'stretch', gap: 2, padding: '10px 26px 12px', borderBottom: '2px solid var(--color-divider)', flexWrap: 'wrap' }}>
          <Metric label="Cost est. at FY end" value={money(totals.cce)} />
          <Metric label="FV at settlement" value={money(totals.fv)} />
          <Metric label="Re-calculated closing PV" value={money(totals.pv)} accent />
          <Metric label={`Source PV · ${totals.covered} covered`} value={money(totals.reportedPv)} />
          <Metric
            label="Net PV variance"
            value={signed(totals.variance)}
            tone={totals.flag === 'VARIANCE' ? 'var(--bad)' : undefined}
          />
        </div>

        <main style={{ flex: 1, minWidth: 0, padding: '22px 26px 60px' }}>
          <Screen screen={screen} />
        </main>
      </div>
    </div>
  );
}

function Metric({
  label, value, accent, tone,
}: {
  label: string; value: string; accent?: boolean; tone?: string;
}) {
  return (
    <div style={{
      flex: '1 1 150px',
      background: accent ? 'var(--color-accent)' : 'var(--color-surface)',
      color: accent ? 'var(--color-bg)' : undefined,
      padding: '9px 12px',
    }}>
      <div style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: accent ? 0.85 : undefined }} className={accent ? undefined : 'muted'}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 17,
        fontVariantNumeric: 'tabular-nums', color: tone,
      }}>{value}</div>
    </div>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  const [arming, setArming] = useState(false);
  const outline: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid color-mix(in srgb,var(--color-bg) 40%,transparent)',
    color: 'var(--color-bg)', padding: '5px 8px', fontSize: 11,
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  };

  if (!arming) {
    return <button style={outline} onClick={() => setArming(true)}>Start a new recalculation</button>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 10.5, lineHeight: 1.45, opacity: 0.85, textWrap: 'pretty' }}>
        This discards the register, the imported extracts, the conclusion and the action log. There is no undo and
        nothing is kept elsewhere.
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ ...outline, borderColor: 'var(--bad)', color: 'var(--bad)' }} onClick={() => { setArming(false); onReset(); }}>
          Discard everything
        </button>
        <button style={outline} onClick={() => setArming(false)}>Keep it</button>
      </div>
    </div>
  );
}

function SideButton({
  active, label, title, num, badge, onClick,
}: {
  active: boolean; label: string; title: string; num: string; badge?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
        background: active ? 'color-mix(in srgb,var(--color-bg) 16%,transparent)' : 'transparent',
        color: 'var(--color-bg)', border: 0, padding: '7px 10px',
        cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12,
      }}
    >
      <span style={{ width: 16, flex: 'none', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 9.5, fontVariantNumeric: 'tabular-nums', opacity: 0.6 }}>
        {num}
      </span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {badge && (
        <span style={{
          flex: 'none', background: 'var(--bad)', color: 'var(--color-bg)',
          fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 9.5,
          padding: '1px 5px', fontVariantNumeric: 'tabular-nums',
        }}>{badge}</span>
      )}
    </button>
  );
}

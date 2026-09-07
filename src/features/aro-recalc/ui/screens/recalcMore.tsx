/**
 * The four original-calculator screens that the slim port omitted:
 * accretion, audit trail, assumptions library, raw dataset.
 */

import { useMemo, useState } from 'react';
import { useRegister, useStore } from '../state';
import {
  assumptionsOf,
  curveInForce,
} from '../../core/recalc';
import { INFLATION_PRESETS } from '../../core/seed';
import { money, parseNumber } from '../../core/format';
import {
  RecalcRow,
  accretionSchedule,
  curveMaxTerm,
  recalculate,
  recalcCurveTerm,
  sourceFigures,
  varianceFlag,
} from '../../engine/recalc';
import { recalcWorkbook } from '../../xlsx/recalcWorkbook';
import { download, downloadText } from '../../xlsx/write';
import { Block, Empty, Field, Stats, SheetTable, num } from '../components';
import { FormulaPanel } from './recalc';

const ratePct = (n: number) => `${(n * 100).toFixed(5)}%`;

function pickRow(rows: RecalcRow[], inspectId: string, selId: string): RecalcRow | undefined {
  return rows.find((r) => r.id === selId) ?? rows.find((r) => r.id === inspectId) ?? rows[0];
}

export function RecalcAccretion() {
  const { reg } = useRegister();
  const { ui, setUi } = useStore();
  const a = assumptionsOf(reg);
  const curve = curveInForce(reg);
  const [selId, setSelId] = useState(ui.inspectId);
  const row = pickRow(reg.rows, ui.inspectId, selId);

  if (!row) {
    return (
      <Empty>
        The register is empty. Import extracts on Source extracts, or reset to seed from the sidebar.
      </Empty>
    );
  }

  const k = recalculate(row, a, curve);
  const schedule = accretionSchedule(row, a, curve);
  const maxAccr = Math.max(...schedule.periods.map((p) => Math.abs(p.accretion)), 0.01);

  return (
    <>
      <Block
        kicker="Results & accretion"
        title={`Obligation ${row.id}`}
        note="The discount unwinding from the recalculated PV to the future value being compared. Nothing is posted from this in Mode 1 — it is here so the two figures can be seen to be the same measurement at different dates."
        actions={
          <select
            value={row.id}
            onChange={(e) => { setSelId(e.target.value); setUi({ inspectId: e.target.value }); }}
          >
            {reg.rows.map((r) => <option key={r.id} value={r.id}>Obligation {r.id}</option>)}
          </select>
        }
      >
        <Stats items={[
          { label: 'Cost estimate at FY end', value: money(k.cce) },
          { label: 'FV at settlement', value: money(k.fv) },
          { label: 'FY closing PV', value: money(k.pv) },
          { label: 'Total accretion to settle', value: money(schedule.total) },
        ]} />
        <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
          {schedule.periods.length} period{schedule.periods.length === 1 ? '' : 's'} · term {k.tD.toFixed(2)} years ·
          discount {ratePct(k.rate)}{k.overridden ? ' (override)' : ''}
        </div>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Period end</th>
                <th className="num">Opening liability</th>
                <th className="num">Accretion expense</th>
                <th className="num">Closing liability</th>
                <th className="num">% of FV</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {schedule.periods.map((p) => (
                <tr key={p.to}>
                  <td>{p.to}</td>
                  <td className="num">{money(p.opening)}</td>
                  <td className="num">{money(p.accretion)}</td>
                  <td className="num">{money(p.closing)}</td>
                  <td className="num muted">{(p.ofFv * 100).toFixed(1)}%</td>
                  <td style={{ width: 120, paddingRight: 0 }}>
                    <div style={{ height: 6, background: 'color-mix(in srgb,var(--color-text) 10%,transparent)' }}>
                      <div style={{ height: 6, width: `${(Math.abs(p.accretion) / maxAccr) * 100}%`, background: 'var(--color-accent)' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>
      <Block kicker="Excel formulas" title={`Obligation ${row.id}`}>
        <FormulaPanel row={row} reg={reg} />
      </Block>
    </>
  );
}

export function RecalcAudit() {
  const { state, ui } = useStore();

  return (
    <Block
      kicker="Audit trail"
      title={state.log.length ? `${num(state.log.length)} recorded action${state.log.length === 1 ? '' : 's'}` : 'Nothing recorded yet'}
      note="Every write to the register is prepended here. An auditor can pull a change and reproduce the calculation as it stood. This is the live log — not a canned demo."
    >
      {!state.log.length ? (
        <Empty>No writes yet this session. Importing an extract, editing a row or signing off will appear here.</Empty>
      ) : (
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Action</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {state.log.map((e, i) => (
                <tr key={`${e.at}-${i}`}>
                  <td style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{e.at.replace('T', ' ').slice(0, 19)}</td>
                  <td>{ui.userName.trim() || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}>{e.action}</td>
                  <td className="muted">{e.detail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Block>
  );
}

export function RecalcAssumptions() {
  const { reg, set } = useRegister();
  const { setUi } = useStore();
  const a = assumptionsOf(reg);
  const curve = curveInForce(reg);
  const maxTerm = curveMaxTerm(curve);
  const beyond = reg.rows.filter((r) => recalcCurveTerm(curve, recalculate(r, a, curve).tD).beyond).length;
  const [draft, setDraft] = useState<Record<string, string>>({});
  const dv = (k: string, v: string) => draft[k] ?? v;
  const commit = (k: string) => setDraft((d) => { const n = { ...d }; delete n[k]; return n; });

  return (
    <>
      <Block
        kicker="Assumptions library"
        title="Rates that apply to every obligation"
        note="Inflation and the FY year end are set here once. The discount rate is not entered — it is looked up on the interest rate curve at each obligation's term from the FY year end to settlement, rounded up to the next whole year."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 18, padding: 16, background: 'var(--color-surface)', marginBottom: 4 }}>
          <Field label="FY year end (valuation date)">
            <input
              className="input"
              value={dv('fyEnd', reg.fyEnd)}
              onChange={(e) => setDraft((d) => ({ ...d, fyEnd: e.target.value }))}
              onBlur={(e) => { commit('fyEnd'); if (e.target.value !== reg.fyEnd) set('Set FY year end', { fyEnd: e.target.value }); }}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            />
          </Field>
          <Field label="Inflation rate — all obligations (%)">
            <input
              className="input"
              value={dv('infl', (reg.inflation * 100).toFixed(2))}
              onChange={(e) => setDraft((d) => ({ ...d, infl: e.target.value }))}
              onBlur={(e) => { commit('infl'); set('Set inflation rate', { inflation: parseNumber(e.target.value) / 100 }); }}
              style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
            />
          </Field>
          <Field label="Curve vintage">
            <div className="input" style={{ background: 'transparent', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>{curve.asAt}</div>
          </Field>
          <Field label="Day count">
            <div className="input" style={{ background: 'transparent', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>DAYS360 · 30/360 US</div>
          </Field>
        </div>
      </Block>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 28 }}>
        <Block
          kicker="Interest rate curve"
          title={curve.asAt}
          note={reg.curveSource || 'Built-in FY26 curve until a client table is imported.'}
          actions={<button className="btn btn-ghost btn-sm" onClick={() => setUi({ screen: 'recalc-import' })}>Import curve .xlsx</button>}
        >
          <div className="scroll-x" style={{ maxHeight: 520 }}>
            <table className="table">
              <thead><tr><th>Term (yrs)</th><th className="num">Interest rate</th><th className="num">Obligations</th></tr></thead>
              <tbody>
                {curve.points.map((p) => {
                  const used = reg.rows.filter((r) => recalculate(r, a, curve).curveTerm === p.term).length;
                  return (
                    <tr key={p.term}>
                      <td>{p.term}</td>
                      <td className="num">{ratePct(p.rate)}</td>
                      <td className="num muted">{used ? num(used) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Block>

        <Block kicker="Inflation policy" title="Applies to every obligation">
          <table className="table">
            <thead><tr><th>Curve</th><th>Basis</th><th className="num">Rate</th><th /></tr></thead>
            <tbody>
              {INFLATION_PRESETS.map((p) => (
                <tr key={p.label}>
                  <td>{p.label}</td>
                  <td>{p.basis}</td>
                  <td className="num">{(p.rate * 100).toFixed(2)}%</td>
                  <td className="num">
                    <button className="btn btn-ghost btn-sm" onClick={() => set('Set inflation rate', { inflation: p.rate })}>Set</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 20, background: 'var(--color-surface)', padding: 14 }}>
            <div className="kicker" style={{ color: 'var(--color-accent)' }}>Day count</div>
            <p style={{ margin: '6px 0 0', fontSize: 12.5 }}>
              Every term is Excel <strong>DAYS360 (US 30/360)</strong> divided by 360 — escalation from the cost estimate
              date to the FY year end, escalation from the modified cost estimate date to settlement, and discounting
              from the FY year end back. Where the cost estimate date falls in a <strong>leap year</strong>, the
              modified cost estimate date is the day after the FY year end.
            </p>
          </div>
          <div style={{ marginTop: 14, background: 'var(--color-surface)', padding: 14 }}>
            <div className="kicker" style={{ color: 'var(--color-accent)' }}>Beyond the curve</div>
            <p style={{ margin: '6px 0 0', fontSize: 12.5 }}>
              {beyond} obligation{beyond === 1 ? '' : 's'} beyond the end of the loaded curve (term {maxTerm}), so the
              term-{maxTerm} rate is applied to them — confirm the convention past that point.
            </p>
          </div>
          <div style={{ marginTop: 14, background: 'var(--color-surface)', padding: 14 }}>
            <div className="kicker" style={{ color: 'var(--color-accent)' }}>Materiality policy</div>
            <p style={{ margin: '6px 0 0', fontSize: 12.5 }}>
              A variance is flagged above {money(reg.materiality.usd)} / {reg.materiality.pct}% against the reported
              balance. Both thresholds are set in the header and stamped onto every export — set them to <strong>0 / 0</strong> and
              nothing but an exact match passes.
            </p>
          </div>
        </Block>
      </div>
    </>
  );
}

export function RecalcRaw() {
  const { reg } = useRegister();
  const { resetToSeed } = useStore();
  const a = assumptionsOf(reg);
  const curve = curveInForce(reg);
  const [q, setQ] = useState('');
  const [only, setOnly] = useState<'all' | 'variance' | 'pass' | 'nosap'>('all');

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return reg.rows.filter((r) => {
      if (needle && !r.id.toLowerCase().includes(needle)) return false;
      const s = sourceFigures(r);
      const k = recalculate(r, a, curve);
      const flag = s.has ? varianceFlag(s.pv - k.pv, s.pv, reg.materiality) : 'NOSAP';
      if (only === 'variance') return flag === 'VARIANCE';
      if (only === 'pass') return flag === 'PASS';
      if (only === 'nosap') return !s.has;
      return true;
    });
  }, [reg, q, only, a, curve]);

  const exportBook = () => {
    const at = `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;
    download(`ARO-recalculation-${reg.fyEnd}.xlsx`, recalcWorkbook(reg, at));
  };

  const csvCell = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const exportCsv = () => {
    const head = ['ARO obligation no.', 'Cost estimate (REP04)', 'Cost estimate date (REP04)', 'Settlement date (REP06)', 'Discount rate override', 'FV of obligation (REP06)', 'PV of obligation (REP06)'];
    const lines = [
      head.join(','),
      ...reg.rows.map((r) => [
        r.id, r.cost, r.costEstimateDate, r.settlementDate,
        r.rateOverride ?? '', r.sourceFv ?? '', r.sourcePv ?? '',
      ].map(csvCell).join(',')),
    ];
    downloadText('aro-register.csv', lines.join('\n'), 'text/csv');
  };

  const exportJson = () => {
    downloadText('aro-register.json', JSON.stringify({
      fyEnd: reg.fyEnd,
      inflation: reg.inflation,
      materiality: reg.materiality,
      obligations: reg.rows,
    }, null, 2), 'application/json');
  };

  return (
    <Block
      kicker="Raw dataset"
      title={`${num(reg.rows.length)} obligation${reg.rows.length === 1 ? '' : 's'} as stored`}
      note="There is no server and no database. The register holds what REP04 and REP06 supplied, per obligation; inflation, the FY year end and the curve live in the assumptions library, not on the rows. Every stored field is below, exactly as saved."
      actions={
        <>
          <button className="btn btn-primary btn-sm" onClick={exportBook} disabled={!reg.rows.length}>Download Excel (with formulas)</button>
          <button className="btn btn-secondary btn-sm" onClick={exportCsv} disabled={!reg.rows.length}>Download CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={exportJson} disabled={!reg.rows.length}>Download JSON</button>
          <button className="btn btn-secondary btn-sm" onClick={resetToSeed}>Reset to seeded data</button>
        </>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by obligation no."
          style={{ width: 220, minHeight: 32, fontSize: 12, padding: '4px 8px' }}
        />
        <select className="input" value={only} onChange={(e) => setOnly(e.target.value as typeof only)} style={{ width: 'auto', minHeight: 32, fontSize: 12, padding: '2px 6px' }}>
          <option value="all">All obligations</option>
          <option value="variance">Variances only</option>
          <option value="pass">Passing only</option>
          <option value="nosap">No source data</option>
        </select>
        <span className="muted" style={{ fontSize: 11.5 }}>{num(shown.length)} of {num(reg.rows.length)}</span>
      </div>

      {!reg.rows.length ? (
        <Empty>The register is empty.</Empty>
      ) : (
        <SheetTable
          rows={shown}
          rowKey={(r) => r.id}
          noun="obligations"
          columns={[
            { key: 'id', header: 'Obligation', value: (r) => r.id, cell: (r) => <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}>{r.id}</span> },
            { key: 'cost', header: 'Cost estimate', kind: 'number', thClassName: 'num', tdClassName: 'num', value: (r) => r.cost, cell: (r) => money(r.cost) },
            { key: 'pk', header: 'Cost est. date', kind: 'date', value: (r) => r.costEstimateDate, cell: (r) => r.costEstimateDate || '—' },
            { key: 'st', header: 'Settlement', kind: 'date', value: (r) => r.settlementDate, cell: (r) => r.settlementDate || '—' },
            { key: 'disc', header: 'Rate override', kind: 'number', thClassName: 'num', tdClassName: 'num', value: (r) => r.rateOverride ?? '', cell: (r) => r.rateOverride != null ? ratePct(r.rateOverride) : <span className="muted">curve</span> },
            { key: 'sapFv', header: 'FV (REP06)', kind: 'number', thClassName: 'num', tdClassName: 'num', value: (r) => r.sourceFv ?? '', cell: (r) => r.sourceFv != null ? money(r.sourceFv) : <span className="muted">—</span> },
            { key: 'sapPv', header: 'PV (REP06)', kind: 'number', thClassName: 'num', tdClassName: 'num', value: (r) => r.sourcePv ?? '', cell: (r) => r.sourcePv != null ? money(r.sourcePv) : <span className="muted">—</span> },
            { key: 'cce', header: 'CCE', kind: 'number', thClassName: 'num', tdClassName: 'num', value: (r) => recalculate(r, a, curve).cce, cell: (r) => money(recalculate(r, a, curve).cce) },
            { key: 'fv', header: 'FV', kind: 'number', thClassName: 'num', tdClassName: 'num', value: (r) => recalculate(r, a, curve).fv, cell: (r) => money(recalculate(r, a, curve).fv) },
            { key: 'pv', header: 'PV', kind: 'number', thClassName: 'num', tdClassName: 'num', value: (r) => recalculate(r, a, curve).pv, cell: (r) => <strong>{money(recalculate(r, a, curve).pv)}</strong> },
          ]}
        />
      )}
    </Block>
  );
}

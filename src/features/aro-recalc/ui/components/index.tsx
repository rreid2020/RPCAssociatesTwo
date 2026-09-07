/**
 * Recurring components, carried over from the ARO Suite so the two products
 * look and behave alike — SCREENS.md, "Layout pattern".
 *
 * Trimmed to what this tool uses. The Suite's account picker, cost-estimate
 * builder and convention selects are not here: they belong to the module of
 * record, which measures obligations it owns. This tool only ever reads
 * somebody else's figures back.
 */

import React, { useState } from 'react';

export { SheetTable, SheetTh, SheetStatus, useSheet } from './Sheet';
export type { SheetColumn } from './Sheet';
export { currency, money, money2, num, parseNumber, pct, years } from '../../core/format';

/* ── layout ─────────────────────────────────────────────────────────────── */
export function Block({
  title, kicker, actions, children, note, className,
}: {
  title?: string; kicker?: string; actions?: React.ReactNode;
  children: React.ReactNode; note?: string; className?: string;
}) {
  return (
    <section className={['block', className].filter(Boolean).join(' ')}>
      {(title || actions || kicker) && (
        <header style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ marginRight: 'auto', minWidth: 0 }}>
            {kicker && <div className="kicker">{kicker}</div>}
            {title && <div className="block-title">{title}</div>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
        </header>
      )}
      {note && <div className="note-panel" style={{ marginBottom: 12 }}>{note}</div>}
      {children}
    </section>
  );
}

export function Stats({ items }: { items: { label: string; value: string; tone?: 'ok' | 'warn' | 'bad' }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 14 }}>
      {items.map((s) => (
        <div key={s.label} style={{ background: 'var(--color-surface)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div className="kicker">{s.label}</div>
          <div style={{
            fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18,
            fontVariantNumeric: 'tabular-nums',
            color: s.tone ? `var(--${s.tone})` : undefined,
          }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '20px 0', fontSize: 12.5, lineHeight: 1.55, textWrap: 'pretty' }} className="muted">
      {children}
    </div>
  );
}

/* ── basis tags ─────────────────────────────────────────────────────────── */

/** SCREENS.md — on every monetary figure. */
export function Tag({ kind = 'neutral', children }: { kind?: 'accent' | 'neutral' | 'warn' | 'bad'; children: React.ReactNode }) {
  return <span className={`tag tag-${kind}`}>{children}</span>;
}

export function Field({
  label, help, children, hint,
}: { label: string; help?: string; children: React.ReactNode; hint?: string }) {
  const [pinned, setPinned] = useState(false);
  return (
    <div className="field">
      <label>
        <span>{label}</span>
        {help && (
          <button
            type="button"
            onClick={() => setPinned((p) => !p)}
            title={help}
            aria-label="What is this field?"
            aria-expanded={pinned}
            style={{
              flex: 'none', width: 16, height: 16, padding: 0, lineHeight: 1,
              border: '1px solid var(--color-divider)', background: 'transparent',
              color: 'color-mix(in srgb,var(--color-text) 58%,transparent)',
              fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 10, cursor: 'pointer',
            }}
          >?</button>
        )}
      </label>
      {children}
      {hint && <div style={{ marginTop: 4, fontSize: 11 }} className="muted">{hint}</div>}
      {pinned && help && (
        <div style={{ marginTop: 6, padding: '9px 11px', background: 'var(--color-surface)', fontSize: 11.5, lineHeight: 1.5, textWrap: 'pretty' }}>
          {help}
        </div>
      )}
    </div>
  );
}


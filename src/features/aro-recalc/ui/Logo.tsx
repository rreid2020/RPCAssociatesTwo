/**
 * The mark: a bracket closing on a rule.
 *
 * Inline SVG rather than a file. Modernist has no corner radius and no
 * gradients, so the mark is three rectangles and it inherits `currentColor` —
 * which is what lets the same component sit on the dark sidebar and on paper
 * without a second, inverted asset to keep in step.
 */
export function AroMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <rect x="2" y="2" width="4" height="20" />
      <rect x="8" y="2" width="14" height="4" />
      <rect x="8" y="11" width="9" height="4" />
    </svg>
  )
}

export function AroWordmark({ size = 18 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <AroMark size={size} />
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: size > 20 ? 18 : 13.5,
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}
      >
        ARO
        <br />
        RECALCULATION
      </div>
    </div>
  )
}

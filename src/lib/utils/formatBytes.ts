/**
 * Human-readable file size (binary units).
 */
export function formatBytes (n: number | null | undefined): string {
  if (n == null || n < 0 || !Number.isFinite(n)) return '—'
  if (n < 1024) return `${n} B`
  const u = ['KB', 'MB', 'GB', 'TB'] as const
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024
    i += 1
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${u[i]}`
}

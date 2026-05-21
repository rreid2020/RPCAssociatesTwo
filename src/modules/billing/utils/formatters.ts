export function formatBillingCurrency (amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatUsagePercent (current: number, max: number): string {
  if (!Number.isFinite(max) || max <= 0) return '0%'
  const pct = Math.min(100, Math.max(0, Math.round((current / max) * 100)))
  return `${pct}%`
}

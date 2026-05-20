export function formatCurrency (value: number, currency = 'CAD', locale = 'en-CA'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value)
}


import type { TaxgptUsage } from '../../../lib/taxgptApi'

type UsageIndicatorProps = {
  usage: TaxgptUsage | null
}

export default function UsageIndicator ({ usage }: UsageIndicatorProps) {
  if (!usage) return null
  const ratio = usage.dailyLimit > 0 ? Math.min(100, Math.round((usage.promptCount / usage.dailyLimit) * 100)) : 0
  const warning = usage.remaining <= 5
  return (
    <section className="rounded-lg border border-border bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-light">Free Tier Usage</p>
          <p className={`text-sm ${warning ? 'text-amber-600' : 'text-primary-dark'}`}>
            {usage.promptCount}/{usage.dailyLimit} prompts used today ({usage.remaining} remaining)
          </p>
        </div>
        {usage.limited && (
          <button
            type="button"
            className="rounded-md border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white"
          >
            Upgrade (Coming Soon)
          </button>
        )}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
        <div
          className={`h-full ${warning ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
    </section>
  )
}

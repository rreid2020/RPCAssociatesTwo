import { FC } from 'react'
import type { OpsCountRow, OpsOverview } from '../services'

type MetricCardProps = {
  label: string
  value: string | number
  hint?: string
}

const MetricCard: FC<MetricCardProps> = ({ label, value, hint }) => (
  <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-text-light">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-primary-dark">{value}</p>
    {hint && <p className="mt-1 text-xs text-text-light">{hint}</p>}
  </div>
)

type CountTableProps = {
  title: string
  rows: OpsCountRow[]
}

const CountTable: FC<CountTableProps> = ({ title, rows }) => (
  <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
    <h3 className="text-base font-semibold text-primary-dark mb-3">{title}</h3>
    {rows.length === 0 ? (
      <p className="text-sm text-text-light">No rows available.</p>
    ) : (
      <div className="overflow-x-auto border border-border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-background/70">
            <tr>
              <th className="text-left px-3 py-2">Key</th>
              <th className="text-right px-3 py-2">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-border">
                <td className="px-3 py-2">{row.key}</td>
                <td className="px-3 py-2 text-right">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
)

type Props = {
  overview: OpsOverview
}

const OpsSummaryCards: FC<Props> = ({ overview }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
    <MetricCard label="Corpus sources" value={overview.corpus.sourceCount} hint={`${overview.corpus.ingestedSourceCount} ingested`} />
    <MetricCard label="Pending ingest" value={overview.corpus.pendingSourceCount} hint={`${overview.corpus.failedSourceCount} failed`} />
    <MetricCard label="Taxes hub sources" value={overview.taxesHub.total} hint={`${overview.taxesHub.content} ready for ingest`} />
    <MetricCard label="Forms registry" value={overview.formRegistry.total} hint={`${overview.formRegistry.active} active`} />
    <MetricCard
      label="TaxGPT feedback"
      value={overview.feedback?.total ?? 0}
      hint={overview.feedback ? `${overview.feedback.submitted} submitted` : 'No feedback yet'}
    />
  </div>
)

export { MetricCard, CountTable, OpsSummaryCards }

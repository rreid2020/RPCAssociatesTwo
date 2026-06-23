import { FC } from 'react'
import { Link } from 'react-router-dom'
import type { SectionSlipEntry } from './interviewArtifactSections'
import { TaxWorksheetSectionHeader } from './TaxWorksheet'
import { getTaxBasePath } from './path'

const FORM_TITLES: Record<string, string> = {
  T2125: 'Statement of Business or Professional Activities',
  T2042: 'Statement of Farming Activities',
  T2121: 'Statement of Fishing Activities',
  T1163: 'Statement A — AgriStability and AgriInvest Programs Information',
  T1164: 'Statement B — AgriStability and AgriInvest Programs Information',
  'SCHEDULE 13': 'Schedule 13 — Employment Insurance Premiums on Self-Employment and Other Eligible Earnings'
}

function resolveFormTitle (formCode: string, fallbackLabel: string): string {
  const normalized = String(formCode || '').trim().toUpperCase()
  return FORM_TITLES[normalized] || fallbackLabel || normalized
}

export const ScheduleFormWorksheet: FC<{
  entry: SectionSlipEntry
  returnId?: string
}> = ({ entry, returnId }) => {
  const basePath = getTaxBasePath()
  const formCode = entry.slipCode
  const title = resolveFormTitle(formCode, entry.label)
  const formsHref = returnId
    ? `${basePath}/forms-schedules?returnId=${encodeURIComponent(returnId)}`
    : `${basePath}/forms-schedules`

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <TaxWorksheetSectionHeader
        title={`${formCode} — ${title}`}
        description={entry.description}
      />
      <div className="space-y-3 px-4 py-4 text-sm text-text">
        <p>
          Complete this CRA schedule to report income and expenses for your selected interview topic.
        </p>
        <p className="text-xs text-text-light">
          Schedule worksheets are entered here in Return Builder. Use the Forms &amp; Schedules workspace
          to review required forms, line totals, and filing package completeness.
        </p>
        <Link
          className="inline-flex text-sm font-medium text-accent hover:underline"
          to={formsHref}
        >
          Open Forms &amp; Schedules
        </Link>
      </div>
    </div>
  )
}

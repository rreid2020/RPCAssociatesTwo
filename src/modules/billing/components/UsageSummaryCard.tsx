import { FC } from 'react'
import type { WorkspaceUsageSnapshot, WorkspaceEntitlements } from '../types'
import { formatUsagePercent } from '../utils/formatters'

type Props = {
  usage: WorkspaceUsageSnapshot
  entitlements: WorkspaceEntitlements
}

const UsageSummaryCard: FC<Props> = ({ usage, entitlements }) => {
  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-primary-dark">Usage</h3>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-text">
        <div>
          <p className="font-medium">Storage</p>
          <p>{usage.storageMbUsed} MB / {entitlements.maxStorageMb} MB ({formatUsagePercent(usage.storageMbUsed, entitlements.maxStorageMb)})</p>
        </div>
        <div>
          <p className="font-medium">Users</p>
          <p>{usage.activeUsers} / {entitlements.maxUsers} ({formatUsagePercent(usage.activeUsers, entitlements.maxUsers)})</p>
        </div>
        <div>
          <p className="font-medium">AI credits</p>
          <p>{usage.aiCreditsUsedThisMonth} / {entitlements.aiMonthlyCredits} ({formatUsagePercent(usage.aiCreditsUsedThisMonth, entitlements.aiMonthlyCredits)})</p>
        </div>
      </div>
    </section>
  )
}

export default UsageSummaryCard

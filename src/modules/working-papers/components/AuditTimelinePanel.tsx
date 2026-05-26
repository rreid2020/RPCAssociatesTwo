import type { FC } from 'react'

type AuditTimelinePanelProps = {
  events: any[]
}

const AuditTimelinePanel: FC<AuditTimelinePanelProps> = ({ events }) => {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-primary-dark">Audit Timeline</h3>
        <p className="text-xs text-text-light">Immutable workflow and execution event history.</p>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <p className="text-sm text-text-light">No audit events yet.</p>
        ) : events.map((event) => (
          <div key={event.id} className="rounded border border-border/70 p-2">
            <p className="text-sm text-primary-dark">{event.event_type || event.action}</p>
            <p className="text-[11px] text-text-light">
              {event.entity_type || 'entity'} {event.entity_id || ''} | actor: {event.actor_id || event.clerk_user_id || 'system'}
            </p>
            <p className="text-[11px] text-text-light">
              {new Date(event.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AuditTimelinePanel

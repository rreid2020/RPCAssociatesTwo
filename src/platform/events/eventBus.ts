export type PlatformEvent<TPayload = Record<string, unknown>> = {
  id: string
  type: string
  workspaceId?: string
  source: string
  payload: TPayload
  occurredAt: string
}

export type PlatformEventHandler<TPayload = Record<string, unknown>> = (event: PlatformEvent<TPayload>) => void | Promise<void>

const handlers = new Map<string, PlatformEventHandler[]>()

export function subscribeToPlatformEvent (type: string, handler: PlatformEventHandler): () => void {
  const current = handlers.get(type) || []
  handlers.set(type, [...current, handler])
  return () => {
    const next = (handlers.get(type) || []).filter((candidate) => candidate !== handler)
    handlers.set(type, next)
  }
}

export async function publishPlatformEvent (event: PlatformEvent): Promise<void> {
  const current = handlers.get(event.type) || []
  for (const handler of current) {
    await handler(event)
  }
}

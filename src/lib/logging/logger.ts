export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  requestId?: string
  workspaceId?: string
  engagementId?: string
  userId?: string
  [key: string]: unknown
}

export function logMessage (level: LogLevel, message: string, context: LogContext = {}): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context
  }
  if (level === 'error') {
    console.error(payload)
    return
  }
  if (level === 'warn') {
    console.warn(payload)
    return
  }
  console.log(payload)
}


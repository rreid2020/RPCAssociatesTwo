export interface PlatformLogger {
  info: (message: string, metadata?: Record<string, unknown>) => void
  warn: (message: string, metadata?: Record<string, unknown>) => void
  error: (message: string, metadata?: Record<string, unknown>) => void
}

export const platformLogger: PlatformLogger = {
  info: (message, metadata) => {
    console.info(`[platform] ${message}`, metadata || {})
  },
  warn: (message, metadata) => {
    console.warn(`[platform] ${message}`, metadata || {})
  },
  error: (message, metadata) => {
    console.error(`[platform] ${message}`, metadata || {})
  }
}

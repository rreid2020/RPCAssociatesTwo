import { ComponentType, lazy } from 'react'

type ModuleDefault<T> = { default: T }

export function lazyWithRetry<T extends ComponentType<any>> (
  importer: () => Promise<ModuleDefault<T>>,
  options?: { retries?: number; delayMs?: number }
) {
  const retries = options?.retries ?? 3
  const baseDelayMs = options?.delayMs ?? 500

  return lazy(async () => {
    let lastError: unknown
    for (let attempt = 0; attempt < retries; attempt += 1) {
      try {
        return await importer()
      } catch (error) {
        lastError = error
        if (attempt < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (attempt + 1)))
        }
      }
    }
    throw lastError
  })
}

export function preloadModule (importer: () => Promise<unknown>): void {
  void importer().catch(() => {})
}

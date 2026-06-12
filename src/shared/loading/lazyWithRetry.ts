import { ComponentType, lazy } from 'react'

type ModuleDefault<T> = { default: T }

const CHUNK_RELOAD_KEY = 'axiom:chunk-reload'

function isStaleChunkError (error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '')
  return (
    message.includes('does not provide an export named') ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed')
  )
}

function reloadOnceForStaleChunk (): void {
  if (typeof window === 'undefined') return
  if (window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return
  window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  window.location.reload()
}

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
        if (isStaleChunkError(error)) {
          reloadOnceForStaleChunk()
        }
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

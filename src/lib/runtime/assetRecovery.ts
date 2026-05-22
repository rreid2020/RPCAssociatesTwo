const RECOVERY_FLAG_KEY = 'portal:asset-recovery:attempted'

function hasAttemptedRecovery (): boolean {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(RECOVERY_FLAG_KEY) === '1'
}

function markRecoveryAttempted (): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(RECOVERY_FLAG_KEY, '1')
}

export function clearAssetRecoveryAttempt (): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(RECOVERY_FLAG_KEY)
}

function forceHardReload (): void {
  if (typeof window === 'undefined') return
  markRecoveryAttempted()
  const nextUrl = new URL(window.location.href)
  nextUrl.searchParams.set('asset_recover', String(Date.now()))
  window.location.replace(nextUrl.toString())
}

function shouldRecoverFromErrorMessage (message: string): boolean {
  const normalized = String(message || '').toLowerCase()
  return normalized.includes('failed to fetch dynamically imported module') ||
    normalized.includes('chunkloaderror') ||
    normalized.includes('loading chunk') ||
    normalized.includes('strict mime type checking is enforced for module scripts')
}

function handleStylesheetErrorEvent (event: Event): void {
  if (hasAttemptedRecovery()) return
  const target = event.target
  if (!(target instanceof HTMLLinkElement)) return
  if (target.rel !== 'stylesheet') return
  if (!target.href || !target.href.includes('/assets/')) return
  forceHardReload()
}

function handleWindowErrorEvent (event: ErrorEvent): void {
  if (hasAttemptedRecovery()) return
  const message = event?.message || event?.error?.message || ''
  if (shouldRecoverFromErrorMessage(message)) {
    forceHardReload()
  }
}

function handleUnhandledRejectionEvent (event: PromiseRejectionEvent): void {
  if (hasAttemptedRecovery()) return
  const reasonMessage = String(event?.reason?.message || event?.reason || '')
  if (shouldRecoverFromErrorMessage(reasonMessage)) {
    forceHardReload()
  }
}

export function installAssetRecoveryHandlers (): void {
  if (typeof window === 'undefined') return
  window.addEventListener('error', handleWindowErrorEvent)
  window.addEventListener('error', handleStylesheetErrorEvent, true)
  window.addEventListener('unhandledrejection', handleUnhandledRejectionEvent)
}

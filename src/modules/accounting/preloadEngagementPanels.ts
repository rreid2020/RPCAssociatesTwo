import { preloadModule } from '../../shared/loading/lazyWithRetry'

export function preloadEngagementWorkspacePanels (): void {
  const run = () => {
    preloadModule(() => import('../working-papers/components/grid/AgGridTable'))
    preloadModule(() => import('../working-papers/components/TrialBalanceGridPanel'))
    preloadModule(() => import('../working-papers/components/TrialBalanceImportPanel'))
    preloadModule(() => import('./components/EngagementOperationsPanel'))
  }

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2500 })
  } else {
    globalThis.setTimeout(run, 1000)
  }
}

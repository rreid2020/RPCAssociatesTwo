import { StoreProvider } from './ui/state'
import { Shell } from './ui/Shell'
import './ui/theme.css'

/**
 * Standalone ARO Recalculation tool, scoped under .aro-recalc-root
 * so its Modernist theme does not affect the marketing site chrome.
 */
export function AroRecalcApp() {
  return (
    <div className="aro-recalc-root">
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </div>
  )
}

export default AroRecalcApp

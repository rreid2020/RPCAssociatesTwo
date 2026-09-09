import { FC, useLayoutEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ScrollToTop from './components/ScrollToTop'
import CanonicalRedirect from './components/CanonicalRedirect'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import AppRoutes from './router'
import { clearStaleChunkReloadFlag } from './shared/loading/lazyWithRetry'

declare global {
  interface Window {
    __axiomAppMounted?: boolean
  }
}

const App: FC = () => {
  useLayoutEffect(() => {
    window.__axiomAppMounted = true
    clearStaleChunkReloadFlag()
    try {
      window.sessionStorage.removeItem('axiom:entry-reload')
      // Drop one-time boot recovery query if present.
      const url = new URL(window.location.href)
      if (url.searchParams.has('_boot')) {
        url.searchParams.delete('_boot')
        const clean = `${url.pathname}${url.search}${url.hash}`
        window.history.replaceState({}, '', clean)
      }
    } catch (_) {
      // Ignore storage / URL cleanup failures.
    }
  }, [])

  return (
    <HelmetProvider>
      <RouteErrorBoundary>
        <Router>
          <ScrollToTop />
          <CanonicalRedirect />
          <AppRoutes />
        </Router>
      </RouteErrorBoundary>
    </HelmetProvider>
  )
}

export default App

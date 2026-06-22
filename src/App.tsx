import { FC, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ScrollToTop from './components/ScrollToTop'
import CanonicalRedirect from './components/CanonicalRedirect'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import AppRoutes from './router'
import { clearStaleChunkReloadFlag } from './shared/loading/lazyWithRetry'

const App: FC = () => {
  useEffect(() => {
    clearStaleChunkReloadFlag()
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('axiom:entry-reload')
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

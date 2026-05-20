import { FC } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ScrollToTop from './components/ScrollToTop'
import CanonicalRedirect from './components/CanonicalRedirect'
import AppRoutes from './router'

const App: FC = () => {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <CanonicalRedirect />
        <AppRoutes />
      </Router>
    </HelmetProvider>
  )
}

export default App

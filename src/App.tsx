import { FC } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Resources from './pages/Resources'
import Articles from './pages/Articles'
import ArticleCategory from './pages/ArticleCategory'
import ArticleDetail from './pages/ArticleDetail'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Sitemap from './pages/Sitemap'
import ComingSoon from './pages/ComingSoon'
import TaxCalculator from './pages/TaxCalculator'
import BookConsultation from './pages/BookConsultation'
import ServiceDetail from './pages/ServiceDetail'
import ScrollToTop from './components/ScrollToTop'
import CanonicalRedirect from './components/CanonicalRedirect'
import CashFlowCalculator from './pages/CashFlowCalculator'
import CashFlowStatementDirectMethod from './pages/CashFlowStatementDirectMethod'
import ResourceCategory from './pages/ResourceCategory'
import ResourceDetail from './pages/ResourceDetail'
import Services from './pages/Services'

const App: FC = () => {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <CanonicalRedirect />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/resources" element={<Resources />} />
          {/* Specific resource detail routes - must come before category routes */}
          <Route path="/resources/canadian-personal-income-tax-calculator" element={<TaxCalculator />} />
          <Route path="/resources/cash-flow-calculator" element={<CashFlowCalculator />} />
          <Route path="/resources/cash-flow-statement-direct-method" element={<CashFlowStatementDirectMethod />} />
          <Route path="/resources/cash-flow-statement-template" element={<ResourceDetail />} />
          <Route path="/resources/cfi-financial-ratios-guide" element={<ResourceDetail />} />
          {/* Resource category routes */}
          <Route path="/resources/category/:slug" element={<ResourceCategory />} />
          {/* Generic resource detail route - must come last */}
          <Route path="/resources/:slug" element={<ResourceDetail />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/category/:categorySlug" element={<ArticleCategory />} />
          <Route path="/articles/:slug" element={<ArticleDetail />} />
          <Route path="/book-consultation" element={<BookConsultation />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/client-portal" element={<ComingSoon />} />
        </Routes>
        <Footer />
      </Router>
    </HelmetProvider>
  )
}

export default App

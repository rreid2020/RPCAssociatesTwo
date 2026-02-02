import { FC } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Home from './pages/Home'
import Resources from './pages/Resources'
import Articles from './pages/Articles'
import ArticleCategory from './pages/ArticleCategory'
import ArticleDetail from './pages/ArticleDetail'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Sitemap from './pages/Sitemap'
import ClientPortal from './pages/ClientPortal'
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
import Dashboard from './pages/portal/Dashboard'
import TaxGPT from './pages/portal/TaxGPT'
import FileRepository from './pages/portal/FileRepository'
import WorkingPapers from './pages/portal/WorkingPapers'
import Integrations from './pages/portal/Integrations'
import MarketingLayout from './components/MarketingLayout'

const App: FC = () => {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <CanonicalRedirect />
        <Routes>
          {/* Portal routes - no header/footer (handled by ClientPortalShell) */}
          <Route path="/portal/dashboard" element={<Dashboard />} />
          <Route path="/portal/taxgpt" element={<TaxGPT />} />
          <Route path="/portal/files" element={<FileRepository />} />
          <Route path="/portal/working-papers" element={<WorkingPapers />} />
          <Route path="/portal/integrations" element={<Integrations />} />
          <Route path="/portal" element={<Dashboard />} />
          
          {/* Marketing site routes - with header/footer */}
          <Route path="/" element={<MarketingLayout><Home /></MarketingLayout>} />
          <Route path="/services" element={<MarketingLayout><Services /></MarketingLayout>} />
          <Route path="/services/:slug" element={<MarketingLayout><ServiceDetail /></MarketingLayout>} />
          <Route path="/resources" element={<MarketingLayout><Resources /></MarketingLayout>} />
          <Route path="/resources/canadian-personal-income-tax-calculator" element={<MarketingLayout><TaxCalculator /></MarketingLayout>} />
          <Route path="/resources/cash-flow-calculator" element={<MarketingLayout><CashFlowCalculator /></MarketingLayout>} />
          <Route path="/resources/cash-flow-statement-direct-method" element={<MarketingLayout><CashFlowStatementDirectMethod /></MarketingLayout>} />
          <Route path="/resources/cash-flow-statement-template" element={<MarketingLayout><ResourceDetail /></MarketingLayout>} />
          <Route path="/resources/cfi-financial-ratios-guide" element={<MarketingLayout><ResourceDetail /></MarketingLayout>} />
          <Route path="/resources/category/:slug" element={<MarketingLayout><ResourceCategory /></MarketingLayout>} />
          <Route path="/resources/:slug" element={<MarketingLayout><ResourceDetail /></MarketingLayout>} />
          <Route path="/articles" element={<MarketingLayout><Articles /></MarketingLayout>} />
          <Route path="/articles/category/:categorySlug" element={<MarketingLayout><ArticleCategory /></MarketingLayout>} />
          <Route path="/articles/:slug" element={<MarketingLayout><ArticleDetail /></MarketingLayout>} />
          <Route path="/book-consultation" element={<MarketingLayout><BookConsultation /></MarketingLayout>} />
          <Route path="/privacy" element={<MarketingLayout><Privacy /></MarketingLayout>} />
          <Route path="/terms" element={<MarketingLayout><Terms /></MarketingLayout>} />
          <Route path="/sitemap" element={<MarketingLayout><Sitemap /></MarketingLayout>} />
          <Route path="/client-portal" element={<MarketingLayout><ClientPortal /></MarketingLayout>} />
        </Routes>
      </Router>
    </HelmetProvider>
  )
}

export default App

import { FC } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
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
import SignIn from './pages/portal/SignIn'
import SignUp from './pages/portal/SignUp'

const App: FC = () => {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <CanonicalRedirect />
        <Routes>
          {/* Portal authentication routes - public */}
          <Route
            path="/portal/sign-in"
            element={
              <SignedOut>
                <SignIn />
              </SignedOut>
            }
          />
          <Route
            path="/portal/sign-up"
            element={
              <SignedOut>
                <SignUp />
              </SignedOut>
            }
          />
          
          {/* Portal routes - protected, no header/footer (handled by ClientPortalShell) */}
          <Route
            path="/portal/dashboard"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <Dashboard />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/portal/taxgpt"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <TaxGPT />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/portal/files"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <FileRepository />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/portal/working-papers"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <WorkingPapers />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/portal/integrations"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <Integrations />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/portal"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <Navigate to="/portal/dashboard" replace />
                </SignedIn>
              </>
            }
          />
          
          {/* Marketing site routes - with header/footer */}
          <Route path="/*" element={
            <>
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
                <Route path="/client-portal" element={<ClientPortal />} />
              </Routes>
              <Footer />
            </>
          } />
        </Routes>
      </Router>
    </HelmetProvider>
  )
}

export default App

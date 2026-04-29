import { FC } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthenticateWithRedirectCallback, SignedIn, SignedOut } from '@clerk/clerk-react'
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
import DonationOptimizerPage from './pages/DonationOptimizerPage'
import TaxEngineCalculatorPage from './pages/TaxEngineCalculatorPage'
import ResourceCategory from './pages/ResourceCategory'
import ResourceDetail from './pages/ResourceDetail'
import Services from './pages/Services'
import Dashboard from './pages/portal/Dashboard'
import TaxGPT from './pages/portal/TaxGPT'
import FileRepository from './pages/portal/FileRepository'
import WorkingPapers from './pages/portal/WorkingPapers'
import Integrations from './pages/portal/Integrations'
import Subscription from './pages/portal/Subscription'
import SignIn from './pages/portal/SignIn'
import SignUp from './pages/portal/SignUp'
import TaxReturns from './pages/portal/tax-intelligence/TaxReturns'
import ReturnBuilder from './pages/portal/tax-intelligence/ReturnBuilder'
import DocumentProcessing from './pages/portal/tax-intelligence/DocumentProcessing'
import Optimization from './pages/portal/tax-intelligence/Optimization'
import Scenarios from './pages/portal/tax-intelligence/Scenarios'
import AuditRisk from './pages/portal/tax-intelligence/AuditRisk'
import FormsSchedules from './pages/portal/tax-intelligence/FormsSchedules'

const App: FC = () => {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <CanonicalRedirect />
        <Routes>
          {/*
            OAuth (GitHub / Google) round-trip: Clerk must run handleRedirectCallback on
            a dedicated route. Without this, users return signed-out and see sign-in again.
          */}
          <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
          {/* Portal authentication routes - public */}
          <Route
            path="/portal/sign-in"
            element={
              <>
                <SignedOut>
                  <SignIn />
                </SignedOut>
                <SignedIn>
                  <Navigate to="/portal/dashboard" replace />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/portal/sign-up"
            element={
              <>
                <SignedOut>
                  <SignUp />
                </SignedOut>
                <SignedIn>
                  <Navigate to="/portal/dashboard" replace />
                </SignedIn>
              </>
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
            path="/portal/subscription"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <Subscription />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/app/tax-intelligence"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <Navigate to="/app/tax-intelligence/returns" replace />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/app/tax-intelligence/returns"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <TaxReturns />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/app/tax-intelligence/returns/:id"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <ReturnBuilder />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/app/tax-intelligence/documents"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <DocumentProcessing />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/app/tax-intelligence/optimization"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <Optimization />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/app/tax-intelligence/scenarios"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <Scenarios />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/app/tax-intelligence/risk"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <AuditRisk />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/app/tax-intelligence/forms-schedules"
            element={
              <>
                <SignedOut>
                  <Navigate to="/portal/sign-in" replace />
                </SignedOut>
                <SignedIn>
                  <FormsSchedules />
                </SignedIn>
              </>
            }
          />

          {/* Compatibility aliases under /portal/tax-intelligence */}
          <Route
            path="/portal/tax-intelligence"
            element={
              <>
                <SignedOut><Navigate to="/portal/sign-in" replace /></SignedOut>
                <SignedIn><Navigate to="/app/tax-intelligence/returns" replace /></SignedIn>
              </>
            }
          />
          <Route
            path="/portal/tax-intelligence/returns"
            element={
              <>
                <SignedOut><Navigate to="/portal/sign-in" replace /></SignedOut>
                <SignedIn><Navigate to="/app/tax-intelligence/returns" replace /></SignedIn>
              </>
            }
          />
          <Route
            path="/portal/tax-intelligence/returns/:id"
            element={
              <>
                <SignedOut><Navigate to="/portal/sign-in" replace /></SignedOut>
                <SignedIn><ReturnBuilder /></SignedIn>
              </>
            }
          />
          <Route
            path="/portal/tax-intelligence/documents"
            element={
              <>
                <SignedOut><Navigate to="/portal/sign-in" replace /></SignedOut>
                <SignedIn><Navigate to="/app/tax-intelligence/documents" replace /></SignedIn>
              </>
            }
          />
          <Route
            path="/portal/tax-intelligence/optimization"
            element={
              <>
                <SignedOut><Navigate to="/portal/sign-in" replace /></SignedOut>
                <SignedIn><Navigate to="/app/tax-intelligence/optimization" replace /></SignedIn>
              </>
            }
          />
          <Route
            path="/portal/tax-intelligence/scenarios"
            element={
              <>
                <SignedOut><Navigate to="/portal/sign-in" replace /></SignedOut>
                <SignedIn><Navigate to="/app/tax-intelligence/scenarios" replace /></SignedIn>
              </>
            }
          />
          <Route
            path="/portal/tax-intelligence/risk"
            element={
              <>
                <SignedOut><Navigate to="/portal/sign-in" replace /></SignedOut>
                <SignedIn><Navigate to="/app/tax-intelligence/risk" replace /></SignedIn>
              </>
            }
          />
          <Route
            path="/portal/tax-intelligence/forms-schedules"
            element={
              <>
                <SignedOut><Navigate to="/portal/sign-in" replace /></SignedOut>
                <SignedIn><Navigate to="/app/tax-intelligence/forms-schedules" replace /></SignedIn>
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
                <Route path="/resources/donation-credit-optimizer" element={<DonationOptimizerPage />} />
                <Route path="/resources/ccpc-salary-dividend-calculator" element={<TaxEngineCalculatorPage />} />
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

import { Fragment } from 'react'
import { Route, Routes } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Home from '../pages/Home'
import Services from '../pages/Services'
import ServiceDetail from '../pages/ServiceDetail'
import Articles from '../pages/Articles'
import ArticleCategory from '../pages/ArticleCategory'
import ArticleDetail from '../pages/ArticleDetail'
import BookConsultation from '../pages/BookConsultation'
import ContactPage from '../pages/ContactPage'
import Privacy from '../pages/Privacy'
import Terms from '../pages/Terms'
import Sitemap from '../pages/Sitemap'
import ClientPortal from '../pages/ClientPortal'
import RogerReidCv from '../pages/RogerReidCv'
import { getResourceRoutes } from './resource.routes'

export function getMarketingRoutes () {
  return (
    <Fragment>
      <Route
        path="*"
        element={(
          <>
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:slug" element={<ServiceDetail />} />
              {getResourceRoutes()}
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/category/:categorySlug" element={<ArticleCategory />} />
              <Route path="/articles/:slug" element={<ArticleDetail />} />
              <Route path="/book-consultation" element={<BookConsultation />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/sitemap" element={<Sitemap />} />
              <Route path="/client-portal" element={<ClientPortal />} />
              {/* Unlisted: not in nav/sitemap; share URL only */}
              <Route path="/roger-reid-cv" element={<RogerReidCv />} />
            </Routes>
            <Footer />
          </>
        )}
      />
    </Fragment>
  )
}


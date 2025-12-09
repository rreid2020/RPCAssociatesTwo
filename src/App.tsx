import { FC } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Resources from './pages/Resources'
import Articles from './pages/Articles'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Sitemap from './pages/Sitemap'
import ComingSoon from './pages/ComingSoon'
import Login from './pages/Login'

const App: FC = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/client-portal"
              element={
                <ProtectedRoute>
                  <ComingSoon />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Footer />
        </Router>
      </AuthProvider>
    </HelmetProvider>
  )
}

export default App

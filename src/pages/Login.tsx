import { FC, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SEO from '../components/SEO'

const Login: FC = () => {
  const { authenticated, loading, login, keycloak } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (authenticated && !loading) {
      navigate('/client-portal', { replace: true })
    }
  }, [authenticated, loading, navigate])

  const handleSignIn = () => {
    if (keycloak) {
      // Keycloak is configured, trigger login
      login()
    } else {
      // Keycloak not configured, show message
      alert('Authentication is not yet configured. Please contact support at roger.reid@rpcassociates.co or 613-884-0208 to request access.')
    }
  }

  const handleRegister = () => {
    if (keycloak) {
      // Keycloak is configured, trigger registration
      keycloak.register()
    } else {
      // Keycloak not configured, show message
      alert('Registration is not yet available. Please contact support at roger.reid@rpcassociates.co or 613-884-0208 to request an account.')
    }
  }

  if (loading) {
    return (
      <>
        <SEO title="Login" description="Login to access your RPC Associates client portal" canonical="/login" />
        <main className="page-content">
          <div className="container">
            <div className="login-container">
              <div className="loading-spinner">Loading...</div>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <SEO title="Login" description="Login to access your RPC Associates client portal" canonical="/login" />
      <main className="page-content">
        <div className="container">
          <div className="login-container">
            <div className="login-card">
              <h1>Client Portal Login</h1>
              <p className="login-description">
                Sign in to access your secure client portal for document sharing, communication, and account management.
              </p>
              <div className="login-buttons">
                <button onClick={handleSignIn} className="btn btn--primary btn--large">
                  Sign In
                </button>
                <button onClick={handleRegister} className="btn btn--secondary btn--large">
                  Create Account
                </button>
              </div>
              {!keycloak && (
                <p className="login-notice">
                  <strong>Note:</strong> Authentication is currently being set up. If you need immediate access, please contact us.
                </p>
              )}
              <p className="login-help">
                Need help? Contact us at{' '}
                <a href="mailto:roger.reid@rpcassociates.co">roger.reid@rpcassociates.co</a> or{' '}
                <a href="tel:6138840208">613-884-0208</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Login


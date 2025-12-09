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
    } else if (!loading && keycloak && !authenticated) {
      // If Keycloak is configured but user is not authenticated, trigger login
      login()
    }
  }, [authenticated, loading, navigate, keycloak, login])

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
              <button onClick={login} className="btn btn--primary btn--large">
                Sign In
              </button>
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


import { FC, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { authenticated, loading, keycloak } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  // If Keycloak is not configured, allow access (for development/testing)
  if (!keycloak) {
    return <>{children}</>
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  // Check for required role if specified
  if (requiredRole && keycloak) {
    const hasRole = keycloak.hasRealmRole(requiredRole) || keycloak.hasResourceRole(requiredRole)
    if (!hasRole) {
      return (
        <div className="page-content">
          <div className="container">
            <div className="error-message">
              <h1>Access Denied</h1>
              <p>You do not have the required permissions to access this page.</p>
            </div>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

export default ProtectedRoute


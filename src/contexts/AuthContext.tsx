import { FC, createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Keycloak from 'keycloak-js'
import { keycloakConfig, keycloakInitOptions } from '../config/keycloak'

interface AuthContextType {
  keycloak: Keycloak | null
  authenticated: boolean
  loading: boolean
  user: KeycloakTokenParsed | null
  login: () => void
  logout: () => void
  register: () => void
}

interface KeycloakTokenParsed {
  sub?: string
  email?: string
  name?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  [key: string]: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<KeycloakTokenParsed | null>(null)

  useEffect(() => {
    const initKeycloak = async () => {
      // Only initialize Keycloak if URL is configured (not default placeholder)
      const isConfigured = keycloakConfig.url && 
                          !keycloakConfig.url.includes('yourdomain.com') &&
                          keycloakConfig.url !== 'https://keycloak.yourdomain.com'
      
      if (!isConfigured) {
        console.log('Keycloak not configured, skipping initialization')
        setLoading(false)
        return
      }

      try {
        const kc = new Keycloak({
          url: keycloakConfig.url,
          realm: keycloakConfig.realm,
          clientId: keycloakConfig.clientId,
        })

        const authenticated = await kc.init(keycloakInitOptions)

        setKeycloak(kc)
        setAuthenticated(authenticated)

        if (authenticated) {
          const tokenParsed = kc.tokenParsed as KeycloakTokenParsed
          setUser(tokenParsed)
        }

        // Listen for token refresh
        kc.onTokenExpired = () => {
          kc.updateToken(30).catch(() => {
            console.error('Failed to refresh token')
          })
        }

        // Listen for authentication state changes
        kc.onAuthSuccess = () => {
          setAuthenticated(true)
          const tokenParsed = kc.tokenParsed as KeycloakTokenParsed
          setUser(tokenParsed)
        }

        kc.onAuthLogout = () => {
          setAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error('Failed to initialize Keycloak', error)
        // Don't block the app if Keycloak fails
      } finally {
        setLoading(false)
      }
    }

    initKeycloak()
  }, [])

  const login = () => {
    if (keycloak) {
      keycloak.login()
    } else {
      // If Keycloak not configured, redirect to login page
      window.location.href = '/login'
    }
  }

  const logout = () => {
    if (keycloak) {
      keycloak.logout()
    } else {
      // If Keycloak not configured, just clear local state
      setAuthenticated(false)
      setUser(null)
    }
  }

  const register = () => {
    if (keycloak) {
      keycloak.register()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        keycloak,
        authenticated,
        loading,
        user,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


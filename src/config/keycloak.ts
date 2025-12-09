// Keycloak Configuration
// Update these values with your Keycloak server details

export const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'https://keycloak.yourdomain.com',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'rpc-associates',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'rpc-associates-web',
}

// Keycloak initialization options
export const keycloakInitOptions = {
  onLoad: 'check-sso' as const, // 'login-required' or 'check-sso'
  checkLoginIframe: false,
  pkceMethod: 'S256' as const,
  enableLogging: false,
}


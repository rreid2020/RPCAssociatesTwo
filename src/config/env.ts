interface FrontendEnvConfig {
  clerkPublishableKey: string
  apiBaseUrl: string
  siteUrl: string
}

function readEnv (key: string): string {
  return String(import.meta.env[key] || '').trim()
}

export function getFrontendEnvConfig (): FrontendEnvConfig {
  return {
    clerkPublishableKey: readEnv('VITE_CLERK_PUBLISHABLE_KEY'),
    apiBaseUrl: readEnv('VITE_API_BASE_URL'),
    siteUrl: readEnv('VITE_SITE_URL') || 'https://axiomft.ca'
  }
}


import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './styles/global.css'
import { getFrontendEnvConfig } from './config/env'
import ObservabilityProvider from './providers/ObservabilityProvider'
import AccountContextProvider from './platform/account/AccountContextProvider'
import { AccountAuthorizationProvider } from './platform/permissions/AccountAuthorizationProvider'

const env = getFrontendEnvConfig()
const clerkPubKey = env.clerkPublishableKey

if (!clerkPubKey) {
  console.warn('⚠️ VITE_CLERK_PUBLISHABLE_KEY is not set. Portal authentication will not work.')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {clerkPubKey ? (
      <ClerkProvider publishableKey={clerkPubKey}>
        <ObservabilityProvider>
          <AccountContextProvider>
            <AccountAuthorizationProvider>
              <App />
            </AccountAuthorizationProvider>
          </AccountContextProvider>
        </ObservabilityProvider>
      </ClerkProvider>
    ) : (
      <ObservabilityProvider>
        <AccountContextProvider>
          <AccountAuthorizationProvider>
            <App />
          </AccountAuthorizationProvider>
        </AccountContextProvider>
      </ObservabilityProvider>
    )}
  </React.StrictMode>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './styles/global.css'
import { getFrontendEnvConfig } from './config/env'
import ObservabilityProvider from './providers/ObservabilityProvider'
import { WorkspaceContextProvider } from './domains/Workspace'
import { WorkspaceAuthorizationProvider } from './platform/permissions/WorkspaceAuthorizationProvider'
import { queryClient } from './platform/query/queryClient'

const env = getFrontendEnvConfig()
const clerkPubKey = env.clerkPublishableKey

if (!clerkPubKey) {
  console.warn('⚠️ VITE_CLERK_PUBLISHABLE_KEY is not set. Portal authentication will not work.')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ObservabilityProvider>
        <WorkspaceContextProvider>
          {clerkPubKey ? (
            <ClerkProvider publishableKey={clerkPubKey}>
              <WorkspaceAuthorizationProvider>
                <App />
              </WorkspaceAuthorizationProvider>
            </ClerkProvider>
          ) : (
            <App />
          )}
        </WorkspaceContextProvider>
      </ObservabilityProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)


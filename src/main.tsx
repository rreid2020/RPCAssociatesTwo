import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './styles/global.css'
import { getFrontendEnvConfig } from './config/env'
import ObservabilityProvider from './providers/ObservabilityProvider'
import { WorkspaceContextProvider } from './domains/Workspace'
import { WorkspaceAuthorizationProvider } from './platform/permissions/WorkspaceAuthorizationProvider'
import { installAssetRecoveryHandlers } from './lib/runtime/assetRecovery'

const env = getFrontendEnvConfig()
const clerkPubKey = env.clerkPublishableKey

if (!clerkPubKey) {
  console.warn('⚠️ VITE_CLERK_PUBLISHABLE_KEY is not set. Portal authentication will not work.')
}

installAssetRecoveryHandlers()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {clerkPubKey ? (
      <ClerkProvider publishableKey={clerkPubKey}>
        <ObservabilityProvider>
          <WorkspaceContextProvider>
            <WorkspaceAuthorizationProvider>
              <App />
            </WorkspaceAuthorizationProvider>
          </WorkspaceContextProvider>
        </ObservabilityProvider>
      </ClerkProvider>
    ) : (
      <ObservabilityProvider>
        <WorkspaceContextProvider>
          <WorkspaceAuthorizationProvider>
            <App />
          </WorkspaceAuthorizationProvider>
        </WorkspaceContextProvider>
      </ObservabilityProvider>
    )}
  </React.StrictMode>,
)


import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './styles/global.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

if (!clerkPubKey) {
  console.warn('⚠️ VITE_CLERK_PUBLISHABLE_KEY is not set. Portal authentication will not work.')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {clerkPubKey ? (
      <ClerkProvider publishableKey={clerkPubKey}>
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>,
)


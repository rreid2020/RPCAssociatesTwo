import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const queryClient = new QueryClient();
// Get Clerk key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

// Debug logging - always show in dev
console.log('🔍 Environment Debug:', {
  hasKey: !!clerkPubKey,
  keyLength: clerkPubKey.length,
  keyPreview: clerkPubKey ? clerkPubKey.substring(0, 20) + '...' : 'EMPTY',
  allViteVars: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')),
  mode: import.meta.env.MODE,
  rawValue: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
});

if (!clerkPubKey) {
  console.error('❌ VITE_CLERK_PUBLISHABLE_KEY is required');
  console.error('Current env value:', import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  console.error('All VITE_ env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
  console.error('Make sure apps/web/.env exists and restart the dev server!');
  
  // Show a user-friendly error in the UI
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: sans-serif;">
      <h1 style="color: #dc2626; margin-bottom: 1rem;">Configuration Error</h1>
      <p style="color: #666; margin-bottom: 0.5rem;">VITE_CLERK_PUBLISHABLE_KEY is missing.</p>
      <p style="color: #666; font-size: 0.9rem;">Check the console for details.</p>
    </div>
  `;
}

// Only render if we have a valid Clerk key
if (!clerkPubKey) {
  console.error('Cannot render app without Clerk key');
} else {
  console.log('✅ Rendering app with Clerk key');
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={clerkPubKey}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </ClerkProvider>
    </React.StrictMode>
  );
}


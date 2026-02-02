import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manually load .env file from root directory
let clerkKey = '';
try {
  // Try root .env first, then apps/web/.env
  const rootEnvPath = resolve(__dirname, '../../.env');
  const localEnvPath = resolve(__dirname, '.env');
  
  let envPath = rootEnvPath;
  if (!existsSync(rootEnvPath) && existsSync(localEnvPath)) {
    envPath = localEnvPath;
  }
  
  console.log('Loading .env from:', envPath);
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/VITE_CLERK_PUBLISHABLE_KEY=(.+)/);
  if (match) {
    clerkKey = match[1].trim();
    console.log('Loaded Clerk key:', clerkKey.substring(0, 20) + '...');
  } else {
    console.warn('VITE_CLERK_PUBLISHABLE_KEY not found in .env');
  }
} catch (error) {
  console.error('Could not load .env file:', error);
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  // Explicitly define the env variable
  define: {
    'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkKey),
  },
});


import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  // Ensure built asset URLs are root-absolute (/assets/...) so routes like /portal/*
  // never try to load CSS/JS from /portal/index-*.css.
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      // Express API (forms, portal, health) — run `npm start` in api/server
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep a stable entry filename so auth-route refresh fallback can
        // recover even if a stale HTML shell is served by an upstream cache.
        entryFileNames: 'assets/main.js',
      },
    },
  },
})


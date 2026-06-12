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
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@router': path.resolve(__dirname, 'src/router'),
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@types': path.resolve(__dirname, 'src/types'),
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
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // Content hashes keep lazy chunks (e.g. AgGridTable) in sync with the entry
        // bundle. Fixed names like main.js + AgGridTable.js break across deploys when
        // only one file is refreshed from cache/CDN.
        manualChunks (id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('ag-grid')) return 'ag-grid-vendor'
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('react-router') ||
            id.includes('scheduler')
          ) {
            return 'react-vendor'
          }
          return undefined
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = String(assetInfo.name || '')
          if (name.endsWith('.css')) return 'assets/index-[hash].css'
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})


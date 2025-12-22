import { createClient } from '@sanity/client'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01'
const useCdn = import.meta.env.VITE_SANITY_USE_CDN === 'true'

// Create client only if projectId exists, otherwise create a dummy client that will fail gracefully
export const client = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn,
      // No token needed for read-only access to published content
    })
  : createClient({
      projectId: 'dummy',
      dataset: 'production',
      apiVersion: '2024-01-01',
      useCdn: false,
    })

// Helper to check if Sanity is configured
export const isSanityConfigured = () => !!projectId


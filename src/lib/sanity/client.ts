import { createClient } from '@sanity/client'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01'
const useCdn = import.meta.env.VITE_SANITY_USE_CDN === 'true'

if (!projectId) {
  throw new Error('Missing VITE_SANITY_PROJECT_ID environment variable')
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn,
  // No token needed for read-only access to published content
})


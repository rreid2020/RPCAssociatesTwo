/**
 * Public form APIs (leads, contact) always use root-relative paths so that:
 * - Production: the browser posts to the same host the user is on (www or apex) and
 *   the platform routes /api to the API service.
 * - Development: Vite proxies /api → http://localhost:3000 (see vite.config.ts).
 *
 * Do not set VITE_API_BASE_URL for these routes; it caused cross-origin requests
 * to a fixed host (e.g. only apex) and broken submissions.
 */
export const API_ENDPOINTS = {
  leads: '/api/leads',
  contact: '/api/contact',
} as const

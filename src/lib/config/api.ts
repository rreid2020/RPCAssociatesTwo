/**
 * API Configuration
 * 
 * Combined Server Setup:
 * - Frontend and API are served from the same Express server
 * - API routes are at /api/* on the same domain
 * - No need for separate API base URL (uses same origin)
 * 
 * For Development:
 * - API runs on http://localhost:3000
 * - Set VITE_API_BASE_URL=http://localhost:3000 in .env (optional)
 * 
 * For Production:
 * - Don't set VITE_API_BASE_URL (leave it unset)
 * - API endpoints will use relative URLs (/api/leads, /api/contact)
 * - This avoids CORS issues since everything is same-origin
 */

// If VITE_API_BASE_URL is not set, use relative URLs (same origin)
// This works because frontend and API are on the same server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000')

export const API_ENDPOINTS = {
  // Always use absolute paths from root (starting with /) for same-origin requests
  // If API_BASE_URL is set, use full URL; otherwise use absolute path from root
  leads: API_BASE_URL && API_BASE_URL.trim() !== '' 
    ? `${API_BASE_URL.replace(/\/$/, '')}/api/leads` 
    : '/api/leads',
  contact: API_BASE_URL && API_BASE_URL.trim() !== '' 
    ? `${API_BASE_URL.replace(/\/$/, '')}/api/contact` 
    : '/api/contact',
} as const

export default API_BASE_URL

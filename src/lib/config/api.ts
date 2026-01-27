/**
 * API Configuration
 * 
 * Base URL for the backend API
 * In production, this should be your API server URL
 * In development, this should be http://localhost:3000
 * 
 * For production, set VITE_API_BASE_URL environment variable to your API server URL
 * Example: https://api.rpcassociates.co
 * 
 * If VITE_API_BASE_URL is not set in production, the form will show an error
 * but the page will still load and display content.
 */

// In production, if VITE_API_BASE_URL is not set, use empty string to avoid CORS errors
// The form will show a user-friendly error message
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

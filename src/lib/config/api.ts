/**
 * API Configuration
 * 
 * Base URL for the backend API
 * In production, this should be your API server URL
 * In development, this should be http://localhost:3000
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const API_ENDPOINTS = {
  leads: `${API_BASE_URL}/api/leads`,
  contact: `${API_BASE_URL}/api/contact`,
} as const

export default API_BASE_URL

import { FC, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Component to handle canonical URL redirects and query parameter cleanup
 * This helps with SEO by ensuring clean URLs without query parameters
 */
const CanonicalRedirect: FC = () => {
  const location = useLocation()

  useEffect(() => {
    // If there are query parameters, redirect to clean URL
    if (location.search) {
      const cleanUrl = location.pathname
      // Only redirect if we're not on the homepage with tracking parameters
      // Allow certain query parameters that might be needed
      const allowedParams = ['utm_source', 'utm_medium', 'utm_campaign']
      const params = new URLSearchParams(location.search)
      const hasOnlyAllowedParams = Array.from(params.keys()).every(key => 
        allowedParams.includes(key)
      )
      
      // If there are non-allowed query parameters, redirect to clean URL
      if (!hasOnlyAllowedParams && params.toString()) {
        window.history.replaceState({}, '', cleanUrl)
      }
    }

    // Ensure we're using non-www canonical URL
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (hostname.startsWith('www.')) {
        const newHostname = hostname.replace(/^www\./, '')
        const newUrl = `${window.location.protocol}//${newHostname}${window.location.pathname}${window.location.search}`
        window.location.replace(newUrl)
      }
    }
  }, [location])

  return null
}

export default CanonicalRedirect

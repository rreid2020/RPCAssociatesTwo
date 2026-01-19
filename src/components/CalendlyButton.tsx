import { FC, useEffect, useState } from 'react'
import { CALENDLY_URL } from '../config/calendly'

interface CalendlyButtonProps {
  text?: string
  className?: string
  prefill?: {
    name?: string
    email?: string
  }
}

const CalendlyButton: FC<CalendlyButtonProps> = ({ 
  text = 'Book a Consultation',
  className = 'btn btn--primary',
  prefill
}) => {
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    // Check if Calendly is already available
    if (window.Calendly) {
      setScriptLoaded(true)
      return
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[src*="calendly.com"]')
    if (existingScript) {
      // Script exists, wait for it to load
      const checkCalendly = setInterval(() => {
        if (window.Calendly) {
          setScriptLoaded(true)
          clearInterval(checkCalendly)
        }
      }, 100)
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkCalendly)
      }, 5000)
      
      return () => clearInterval(checkCalendly)
    }

    // Load Calendly widget script
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    
    script.onload = () => {
      setScriptLoaded(true)
    }
    
    script.onerror = () => {
      console.error('Failed to load Calendly script')
    }
    
    document.body.appendChild(script)

    return () => {
      // Cleanup if component unmounts
    }
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // If Calendly is available, use popup widget
    if (window.Calendly) {
      openCalendly()
      return
    }

    // If script is still loading, wait a moment and try again
    if (!scriptLoaded) {
      console.log('Calendly script loading, please wait...')
      let attempts = 0
      const maxAttempts = 30 // 3 seconds max
      
      const retryInterval = setInterval(() => {
        attempts++
        if (window.Calendly) {
          clearInterval(retryInterval)
          openCalendly()
        } else if (attempts >= maxAttempts) {
          clearInterval(retryInterval)
          console.warn('Calendly script failed to load, opening direct link')
          window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer')
        }
      }, 100)
      
      return
    }

    // Fallback: open in new window
    window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer')
  }

  const openCalendly = () => {
    if (!window.Calendly) {
      console.error('Calendly is not available')
      // Fallback: open in new window
      window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer')
      return
    }

    let calendlyUrl = CALENDLY_URL
    
    // Add prefill parameters if provided
    if (prefill?.name || prefill?.email) {
      const url = new URL(calendlyUrl)
      if (prefill.name) {
        url.searchParams.set('name', prefill.name)
      }
      if (prefill.email) {
        url.searchParams.set('email', prefill.email)
      }
      calendlyUrl = url.toString()
    }

    try {
      window.Calendly.initPopupWidget({
        url: calendlyUrl
      })
    } catch (error) {
      console.error('Error opening Calendly:', error)
      // Fallback: open in new window
      window.open(calendlyUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <button 
      type="button"
      className={className}
      onClick={handleClick}
    >
      {text}
    </button>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void
    }
  }
}

export default CalendlyButton

import { FC, useEffect } from 'react'
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
  useEffect(() => {
    // Load Calendly widget script
    if (!document.querySelector('script[src*="calendly.com"]')) {
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  const handleClick = () => {
    if (!window.Calendly) {
      // If script hasn't loaded yet, wait a bit and try again
      setTimeout(handleClick, 100)
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

    window.Calendly.initPopupWidget({
      url: calendlyUrl
    })
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

import { FC, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { CALENDLY_URL } from '../config/calendly'

const BookConsultation: FC = () => {
  const calendlyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if Calendly is already available
    if (window.Calendly && calendlyRef.current) {
      window.Calendly.initInlineWidget({
        url: CALENDLY_URL,
        parentElement: calendlyRef.current,
        prefill: {},
        utm: {}
      })
      return
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[src*="calendly.com"]')
    
    // Initialize Calendly inline widget
    const initCalendly = () => {
      if (window.Calendly && calendlyRef.current) {
        window.Calendly.initInlineWidget({
          url: CALENDLY_URL,
          parentElement: calendlyRef.current,
          prefill: {},
          utm: {}
        })
      }
    }

    if (existingScript) {
      // Script exists, wait for it to load
      const checkCalendly = setInterval(() => {
        if (window.Calendly) {
          clearInterval(checkCalendly)
          initCalendly()
        }
      }, 100)
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkCalendly)
      }, 5000)
      
      return () => clearInterval(checkCalendly)
    }

    // Load Calendly inline widget script
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    
    script.onload = () => {
      initCalendly()
    }
    
    script.onerror = () => {
      console.error('Failed to load Calendly script')
    }
    
    document.body.appendChild(script)

    // Fallback: wait for Calendly to be available
    const checkCalendly = setInterval(() => {
      if (window.Calendly) {
        clearInterval(checkCalendly)
        initCalendly()
      }
    }, 100)

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkCalendly)
    }, 5000)

    return () => {
      clearInterval(checkCalendly)
    }
  }, [])

  return (
    <>
      <SEO 
        title="Book a Consultation - RPC Associates" 
        description="Schedule a free consultation with RPC Associates. Book your appointment online."
        canonical="/book-consultation"
        keywords={['book consultation', 'schedule appointment', 'tax consultation', 'accounting consultation', 'Ottawa']}
      />
      <main>
        <section className="py-xxl bg-background">
          <div className="max-w-[1400px] mx-auto px-md">
            <div className="text-center mb-xl">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
                Book a Free Consultation
              </h1>
              <p className="text-lg text-text-light leading-relaxed max-w-2xl mx-auto">
                Schedule a free discovery call with our team. We'll discuss your tax and accounting needs and how we can help.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-lg lg:p-xl">
              <div 
                ref={calendlyRef}
                className="calendly-inline-widget min-h-[700px]"
                style={{ minHeight: '700px', width: '100%' }}
              />
            </div>

            <div className="mt-xl text-center">
              <Link 
                to="/" 
                className="btn btn--secondary inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string
        parentElement: HTMLElement
        prefill?: Record<string, any>
        utm?: Record<string, any>
      }) => void
    }
  }
}

export default BookConsultation

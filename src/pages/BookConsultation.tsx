import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { CALENDLY_URL } from '../config/calendly'

const BookConsultation: FC = () => {
  // Convert Calendly URL to embed format (iframe-friendly)
  const embedUrl = CALENDLY_URL.replace(/\/$/, '') // Remove trailing slash if present

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
              <iframe
                src={embedUrl}
                width="100%"
                height="700"
                frameBorder="0"
                title="Calendly Scheduling Page"
                className="w-full min-h-[700px] rounded-lg"
                style={{ minHeight: '700px' }}
                allow="camera; microphone; geolocation"
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

export default BookConsultation

import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import MarketingPageHero from '../components/MarketingPageHero'
import { CALENDLY_URL } from '../config/calendly'

const BookConsultation: FC = () => {
  let embedUrl = CALENDLY_URL.replace(/\/$/, '')
  const url = new URL(embedUrl)
  url.searchParams.set('primary_color', '0e7c86')
  url.searchParams.set('text_color', '12202f')
  url.searchParams.set('bg_color', 'ffffff')
  url.searchParams.set('hide_event_type_details', '0')
  url.searchParams.set('hide_landing_page_details', '1')
  embedUrl = url.toString()

  return (
    <>
      <SEO
        title="Book a Free Consultation | Ottawa Accountant"
        description="Schedule a free consultation with Axiom. Talk through accounting, advisory, ARO, or portal needs with a CPA in Ottawa."
        canonical="/book-consultation"
        keywords={['book consultation', 'schedule appointment', 'tax consultation', 'accounting consultation', 'Ottawa']}
      />
      <main>
        <MarketingPageHero
          eyebrow="Book a consultation"
          title="A 30-minute call. Clear next steps."
          lede="Schedule a free discovery call. We'll discuss your accounting and advisory needs, and whether Axiom is the right fit — without a proposal that moves later."
          primary={(
            <a className="btn btn-primary" href="#scheduler">
              Jump to scheduler
            </a>
          )}
          secondary={(
            <Link to="/contact" className="btn btn-ghost">
              Prefer email? Contact us
            </Link>
          )}
          strip={['Free discovery call', 'Ottawa-based CPA', 'No obligation']}
        />

        <div className="svc-landing">
          <section className="alt" id="scheduler">
            <div className="wrap">
              <p className="eyebrow">Pick a time</p>
              <h2>Choose a slot that works</h2>
              <p className="intro" style={{ marginBottom: 28 }}>
                Use the calendar below. If nothing fits, email roger.reid@axiomft.ca or call 613-884-0208.
              </p>
              <div style={{ border: '1px solid var(--rule)', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="700"
                  title="Calendly Scheduling Page"
                  className="w-full min-h-[700px]"
                  style={{ minHeight: 700, border: 'none', display: 'block' }}
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default BookConsultation

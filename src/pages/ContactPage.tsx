import { FC } from 'react'
import SEO from '../components/SEO'
import Contact from '../components/Contact'
import CalendlyButton from '../components/CalendlyButton'

const ContactPage: FC = () => {
  return (
    <>
      <SEO
        title="Contact an Ottawa Accountant"
        description="Contact Axiom Financial & Technology in Ottawa for accounting, advisory, and technology support. Phone 613-884-0208 or send a message."
        canonical="/contact"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ]}
      />
      <main>
        <div className="svc-landing">
          <section className="hero" id="hero">
            <div className="wrap">
              <p className="eyebrow">Contact</p>
              <h1>Tell us what you need. We&apos;ll tell you if we&apos;re the right fit.</h1>
              <p className="lede">
                Send a message about your business and the support you need. We follow up to schedule
                a short introductory call — no proposal theatre.
              </p>
              <div className="cta-row">
                <CalendlyButton text="Book a 30-minute call" className="btn btn-primary" />
                <a className="btn btn-ghost" href="tel:6138840208">
                  Call 613-884-0208
                </a>
              </div>
              <p className="strip">
                <b>Ottawa-based</b>
                {' '}
                &nbsp;&middot;&nbsp;
                {' '}
                <b>Serving clients across Canada</b>
                {' '}
                &nbsp;&middot;&nbsp;
                {' '}
                <b>roger.reid@axiomft.ca</b>
              </p>
            </div>
          </section>
        </div>
        <Contact />
      </main>
    </>
  )
}

export default ContactPage

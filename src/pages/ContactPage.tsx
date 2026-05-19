import { FC } from 'react'
import SEO from '../components/SEO'
import Contact from '../components/Contact'

const ContactPage: FC = () => {
  return (
    <>
      <SEO
        title="Contact | Axiom Financial & Technology"
        description="Get in touch with Axiom for accounting, advisory, and technology support. Send us a message to schedule an introductory call."
        canonical="/contact"
      />
      <main>
        <section className="py-xl bg-background">
          <div className="max-w-[1200px] mx-auto px-md text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-primary-dark mb-sm">Contact</h1>
            <p className="text-lg text-text-light max-w-[760px] mx-auto">
              Tell us about your business and what support you need. We will follow up to schedule a short introductory call.
            </p>
          </div>
        </section>
        <Contact />
      </main>
    </>
  )
}

export default ContactPage

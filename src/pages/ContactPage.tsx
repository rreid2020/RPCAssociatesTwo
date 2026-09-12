import { FC } from 'react'
import SEO from '../components/SEO'
import Contact from '../components/Contact'

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
        <section className="py-xl bg-background">
          <div className="max-w-[1200px] mx-auto px-md text-center">
            <h1 className="text-3xl lg:text-4xl font-semibold text-primary mb-sm">Contact</h1>
            <p className="text-lg text-text-body max-w-[760px] mx-auto">
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

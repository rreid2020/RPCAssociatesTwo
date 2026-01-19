import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const Sitemap: FC = () => {
  return (
    <>
      <SEO
        title="Site Map"
        description="Complete site map of RPC Associates website. Find all pages, sections, and resources for accounting, consulting, and tech solutions."
        canonical="/sitemap"
      />
      <main className="py-xxl min-h-[60vh]">
      <div className="max-w-[900px] mx-auto px-md">
        <div className="leading-relaxed">
          <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-md">Site Map</h1>
          <p className="text-lg text-text-light mb-xl">
            Find all pages and sections of the RPC Associates website below.
          </p>

          <section className="mb-xl">
            <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-md pb-xs border-b-2 border-primary">Main Pages</h2>
            <ul className="list-none p-0 m-0">
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <Link to="/" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">Home</Link>
                <p className="text-sm text-text-light m-0 ml-0">Main landing page with overview of services</p>
              </li>
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <Link to="/resources" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">Resources</Link>
                <p className="text-sm text-text-light m-0 ml-0">Helpful resources, tools, and guides</p>
              </li>
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <Link to="/articles" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">Articles</Link>
                <p className="text-sm text-text-light m-0 ml-0">Insights, tips, and updates on accounting, consulting, and technology</p>
              </li>
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-md pb-xs border-b-2 border-primary">Home Page Sections</h2>
            <ul className="list-none p-0 m-0">
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <a href="/#services" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">Services</a>
                <p className="text-sm text-text-light m-0 ml-0">Our accounting, consulting, and tech solutions</p>
              </li>
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <a href="/#why" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">Why Hire an Accountant</a>
                <p className="text-sm text-text-light m-0 ml-0">Benefits of professional accounting services</p>
              </li>
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <a href="/#about" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">About</a>
                <p className="text-sm text-text-light m-0 ml-0">Learn about RPC Associates</p>
              </li>
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <a href="/#remote" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">Remote Services</a>
                <p className="text-sm text-text-light m-0 ml-0">How we serve clients remotely across Canada</p>
              </li>
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <a href="/#contact" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">Contact</a>
                <p className="text-sm text-text-light m-0 ml-0">Get in touch with our team</p>
              </li>
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-md pb-xs border-b-2 border-primary">Legal & Policies</h2>
            <ul className="list-none p-0 m-0">
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <Link to="/privacy" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">Privacy Policy</Link>
                <p className="text-sm text-text-light m-0 ml-0">How we collect, use, and protect your information</p>
              </li>
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <Link to="/terms" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">Terms of Service</Link>
                <p className="text-sm text-text-light m-0 ml-0">Terms and conditions for using our services</p>
              </li>
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-md pb-xs border-b-2 border-primary">External Links</h2>
            <ul className="list-none p-0 m-0">
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <a href="https://portal.rpcassociates.co" target="_blank" rel="noopener noreferrer" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">
                  Client Portal
                </a>
                <p className="text-sm text-text-light m-0 ml-0">Secure client portal for file sharing and communication</p>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
    </>
  )
}

export default Sitemap


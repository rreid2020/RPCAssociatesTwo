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
      <main className="page-content">
      <div className="container">
        <div className="sitemap">
          <h1>Site Map</h1>
          <p className="sitemap__intro">
            Find all pages and sections of the RPC Associates website below.
          </p>

          <section className="sitemap__section">
            <h2>Main Pages</h2>
            <ul className="sitemap__list">
              <li>
                <Link to="/" className="sitemap__link">Home</Link>
                <p className="sitemap__description">Main landing page with overview of services</p>
              </li>
              <li>
                <Link to="/resources" className="sitemap__link">Resources</Link>
                <p className="sitemap__description">Helpful resources, tools, and guides</p>
              </li>
              <li>
                <Link to="/articles" className="sitemap__link">Articles</Link>
                <p className="sitemap__description">Insights, tips, and updates on accounting, consulting, and technology</p>
              </li>
            </ul>
          </section>

          <section className="sitemap__section">
            <h2>Home Page Sections</h2>
            <ul className="sitemap__list">
              <li>
                <a href="/#services" className="sitemap__link">Services</a>
                <p className="sitemap__description">Our accounting, consulting, and tech solutions</p>
              </li>
              <li>
                <a href="/#why" className="sitemap__link">Why Hire an Accountant</a>
                <p className="sitemap__description">Benefits of professional accounting services</p>
              </li>
              <li>
                <a href="/#about" className="sitemap__link">About</a>
                <p className="sitemap__description">Learn about RPC Associates</p>
              </li>
              <li>
                <a href="/#remote" className="sitemap__link">Remote Services</a>
                <p className="sitemap__description">How we serve clients remotely across Canada</p>
              </li>
              <li>
                <a href="/#contact" className="sitemap__link">Contact</a>
                <p className="sitemap__description">Get in touch with our team</p>
              </li>
            </ul>
          </section>

          <section className="sitemap__section">
            <h2>Legal & Policies</h2>
            <ul className="sitemap__list">
              <li>
                <Link to="/privacy" className="sitemap__link">Privacy Policy</Link>
                <p className="sitemap__description">How we collect, use, and protect your information</p>
              </li>
              <li>
                <Link to="/terms" className="sitemap__link">Terms of Service</Link>
                <p className="sitemap__description">Terms and conditions for using our services</p>
              </li>
            </ul>
          </section>

          <section className="sitemap__section">
            <h2>External Links</h2>
            <ul className="sitemap__list">
              <li>
                <a href="https://portal.rpcassociates.co" target="_blank" rel="noopener noreferrer" className="sitemap__link">
                  Client Portal
                </a>
                <p className="sitemap__description">Secure client portal for file sharing and communication</p>
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


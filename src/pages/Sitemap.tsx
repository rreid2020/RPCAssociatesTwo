import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { services } from '../lib/services/data'
import { products } from '../lib/products/data'
import { resources } from '../lib/resources/resources'
import { resourceCategories } from '../lib/resources/data'

const Sitemap: FC = () => {
  const calculators = resources.filter((resource) => resource.category === 'calculator')

  return (
    <>
      <SEO
        title="Site Map"
        description="Complete site map of Axiom Financial & Technology. Find services, products, resources, articles, and the client portal."
        canonical="/sitemap"
      />
      <main className="py-xxl min-h-[60vh]">
      <div className="max-w-[900px] mx-auto px-md">
        <div className="leading-relaxed">
          <h1 className="text-4xl lg:text-5xl font-semibold text-primary mb-md">Site Map</h1>
          <p className="text-lg text-text-body mb-xl">
            Find all public pages and sections of the Axiom website below.
          </p>

          <section className="mb-xl">
            <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-md pb-xs border-b-2 border-primary">Main Pages</h2>
            <ul className="list-none p-0 m-0">
              {[
                { to: '/', title: 'Home', desc: 'Main landing page with overview of services and the client portal' },
                { to: '/services', title: 'Services', desc: 'Accounting, consulting, and technology services' },
                { to: '/products/aro-suite', title: 'ARO Suite', desc: 'Asset retirement obligation software product page' },
                { to: '/resources', title: 'Resources', desc: 'Calculators, templates, and guides' },
                { to: '/articles', title: 'Articles', desc: 'Insights on Canadian tax, accounting, and technology' },
                { to: '/client-portal', title: 'Client Portal', desc: 'Secure portal for dashboard, TaxGPT, files, and more' },
                { to: '/book-consultation', title: 'Book a Consultation', desc: 'Schedule a consultation with Axiom' },
                { to: '/contact', title: 'Contact', desc: 'Contact form and ways to reach our team' },
              ].map((item) => (
                <li key={item.to} className="mb-lg pb-md border-b border-border last:border-b-0">
                  <Link to={item.to} className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">{item.title}</Link>
                  <p className="text-sm text-text-light m-0">{item.desc}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-md pb-xs border-b-2 border-primary">Services</h2>
            <ul className="list-none p-0 m-0">
              {services.map((service) => (
                <li key={service.slug} className="mb-lg pb-md border-b border-border last:border-b-0">
                  <Link to={`/services/${service.slug}`} className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">
                    {service.title}
                  </Link>
                  <p className="text-sm text-text-light m-0">{service.intro}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-md pb-xs border-b-2 border-primary">Products</h2>
            <ul className="list-none p-0 m-0">
              {products.map((product) => (
                <li key={product.slug} className="mb-lg pb-md border-b border-border last:border-b-0">
                  <Link to={product.href} className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">
                    {product.title}
                  </Link>
                  <p className="text-sm text-text-light m-0">{product.intro}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-md pb-xs border-b-2 border-primary">Resource Categories</h2>
            <ul className="list-none p-0 m-0">
              {resourceCategories.map((category) => (
                <li key={category.slug} className="mb-lg pb-md border-b border-border last:border-b-0">
                  <Link to={`/resources/category/${category.slug}`} className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">
                    {category.title}
                  </Link>
                  <p className="text-sm text-text-light m-0">{category.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-md pb-xs border-b-2 border-primary">Online Calculators &amp; Tools</h2>
            <ul className="list-none p-0 m-0">
              {calculators.map((resource) => (
                <li key={resource.slug} className="mb-lg pb-md border-b border-border last:border-b-0">
                  <Link to={`/resources/${resource.slug}`} className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">
                    {resource.title}
                  </Link>
                  <p className="text-sm text-text-light m-0">{resource.shortDescription}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-md pb-xs border-b-2 border-primary">Article Categories</h2>
            <ul className="list-none p-0 m-0">
              {[
                { slug: 'canadian-tax', title: 'Canadian Tax' },
                { slug: 'accounting', title: 'Accounting' },
                { slug: 'technology', title: 'Technology' },
              ].map((category) => (
                <li key={category.slug} className="mb-lg pb-md border-b border-border last:border-b-0">
                  <Link to={`/articles/category/${category.slug}`} className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">
                    {category.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-xl">
            <h2 className="text-2xl lg:text-3xl font-semibold text-primary mb-md pb-xs border-b-2 border-primary">Legal</h2>
            <ul className="list-none p-0 m-0">
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <Link to="/privacy" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">Privacy Policy</Link>
              </li>
              <li className="mb-lg pb-md border-b border-border last:border-b-0">
                <Link to="/terms" className="text-lg lg:text-xl font-semibold text-primary no-underline mb-xs block transition-all hover:underline">Terms of Service</Link>
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

import { FC, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/rpc-logo.svg'
import CalendlyButton from './CalendlyButton'
import { services } from '../lib/services/data'
import { resourceCategories } from '../lib/resources/data'

// Simple icon components for services
const ServiceIcon = ({ icon }: { icon: string }) => {
  const iconMap: Record<string, JSX.Element> = {
    'core-accounting': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'year-end-reporting': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    'tax-planning': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    'cash-flow-planning': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    'fractional-controller': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    'tech-solutions': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  }
  return iconMap[icon] || (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

// Resource category icons
const ResourceIcon = ({ icon }: { icon: string }) => {
  const iconMap: Record<string, JSX.Element> = {
    'calculator': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    'excel': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'publications': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  }
  return iconMap[icon] || (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

const Header: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
  const [isArticlesOpen, setIsArticlesOpen] = useState(false)
  const [isServicesOpen, setIsServicesOpen] = useState(false)
  const location = useLocation()

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      window.location.href = `/#${id}`
      return
    }
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
    setIsResourcesOpen(false)
    setIsArticlesOpen(false)
    setIsServicesOpen(false)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
    if (isMenuOpen) {
      closeMenu()
    }
  }

  return (
    <>
      {/* Backdrop overlay for mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[998] lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <header className="sticky top-0 bg-white shadow-sm z-[1000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" aria-label="RPC Associates Home" className="flex items-center gap-2 sm:gap-3 no-underline flex-shrink-0">
              <img src={logo} alt="RPC Associates" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-base sm:text-lg md:text-xl font-semibold text-primary leading-tight">RPC Associates</span>
                <span className="text-[10px] sm:text-xs font-normal text-text-light leading-tight">Accounting · Consulting · Tech Solutions</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex lg:items-center lg:gap-6 xl:gap-8">
              <ul className="flex items-center gap-6 xl:gap-8 list-none">
                {/* Services Dropdown */}
                <li 
                  className="relative"
                  onMouseEnter={() => setIsServicesOpen(true)}
                  onMouseLeave={() => setIsServicesOpen(false)}
                >
                  <button
                    className="flex items-center gap-1 text-text font-medium hover:text-primary transition-colors py-2 whitespace-nowrap"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection('services')
                    }}
                  >
                    Services
                    <svg 
                      className={`w-4 h-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Desktop Services Dropdown - Card Style */}
                  {isServicesOpen && (
                    <div 
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] xl:w-[700px] bg-white rounded-lg shadow-xl border border-gray-200 p-6 z-[1001]"
                      onMouseEnter={() => setIsServicesOpen(true)}
                      onMouseLeave={() => setIsServicesOpen(false)}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        {services.map((service) => (
                          <Link
                            key={service.slug}
                            to={`/services/${service.slug}`}
                            className="group flex flex-col gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={closeMenu}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 text-primary">
                                <ServiceIcon icon={service.slug} />
                              </div>
                              <h3 className="text-sm font-semibold text-text group-hover:text-primary transition-colors leading-tight">
                                {service.title}
                              </h3>
                            </div>
                            <p className="text-xs text-text-light leading-relaxed">
                              {service.intro}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>

                {/* Other Navigation Items */}
                <li>
                  <a 
                    href="#about" 
                    className="text-text font-medium hover:text-primary transition-colors py-2 whitespace-nowrap"
                    onClick={(e) => { e.preventDefault(); scrollToSection('about') }}
                  >
                    About
                  </a>
                </li>
                <li>
                  <a 
                    href="#remote" 
                    className="text-text font-medium hover:text-primary transition-colors py-2 whitespace-nowrap"
                    onClick={(e) => { e.preventDefault(); scrollToSection('remote') }}
                  >
                    Remote
                  </a>
                </li>
                <li>
                  <a 
                    href="#contact" 
                    className="text-text font-medium hover:text-primary transition-colors py-2 whitespace-nowrap"
                    onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}
                  >
                    Contact
                  </a>
                </li>

                {/* Resources Dropdown */}
                <li 
                  className="relative"
                  onMouseEnter={() => setIsResourcesOpen(true)}
                  onMouseLeave={() => setIsResourcesOpen(false)}
                >
                  <button
                    className="flex items-center gap-1 text-text font-medium hover:text-primary transition-colors py-2 whitespace-nowrap"
                  >
                    Resources
                    <svg 
                      className={`w-4 h-4 transition-transform ${isResourcesOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Desktop Resources Dropdown - Card Style (matching Services) */}
                  {isResourcesOpen && (
                    <div 
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] xl:w-[700px] bg-white rounded-lg shadow-xl border border-gray-200 p-6 z-[1001]"
                      onMouseEnter={() => setIsResourcesOpen(true)}
                      onMouseLeave={() => setIsResourcesOpen(false)}
                    >
                      <div className="grid grid-cols-3 gap-4">
                        {resourceCategories.map((category) => (
                          <Link
                            key={category.slug}
                            to={`/resources/${category.slug}`}
                            className="group flex flex-col gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={closeMenu}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 text-primary">
                                <ResourceIcon icon={category.icon} />
                              </div>
                              <h3 className="text-sm font-semibold text-text group-hover:text-primary transition-colors leading-tight">
                                {category.title}
                              </h3>
                            </div>
                            <p className="text-xs text-text-light leading-relaxed">
                              {category.description}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>

                {/* Articles Dropdown */}
                <li 
                  className="relative"
                  onMouseEnter={() => setIsArticlesOpen(true)}
                  onMouseLeave={() => setIsArticlesOpen(false)}
                >
                  <Link 
                    to="/articles" 
                    className="flex items-center gap-1 text-text font-medium hover:text-primary transition-colors py-2 whitespace-nowrap"
                  >
                    Articles
                    <svg 
                      className={`w-4 h-4 transition-transform ${isArticlesOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>
                  {isArticlesOpen && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-[1001]"
                      onMouseEnter={() => setIsArticlesOpen(true)}
                      onMouseLeave={() => setIsArticlesOpen(false)}
                    >
                      <Link
                        to="/articles/category/canadian-tax"
                        className="block px-4 py-2 text-sm text-text hover:bg-gray-50 rounded transition-colors"
                        onClick={closeMenu}
                      >
                        Canadian Tax
                      </Link>
                      <Link
                        to="/articles/category/accounting"
                        className="block px-4 py-2 text-sm text-text hover:bg-gray-50 rounded transition-colors"
                        onClick={closeMenu}
                      >
                        Accounting
                      </Link>
                      <Link
                        to="/articles/category/technology"
                        className="block px-4 py-2 text-sm text-text hover:bg-gray-50 rounded transition-colors"
                        onClick={closeMenu}
                      >
                        Technology
                      </Link>
                    </div>
                  )}
                </li>

                <li>
                  <Link 
                    to="/client-portal" 
                    className="btn btn--secondary whitespace-nowrap"
                    onClick={closeMenu}
                  >
                    Client Portal
                  </Link>
                </li>
              </ul>
              <div className="ml-4">
                <CalendlyButton className="btn btn--primary whitespace-nowrap" />
              </div>
            </nav>

            {/* Mobile Hamburger Button */}
            <button 
              className="lg:hidden flex flex-col gap-1.5 bg-transparent border-none cursor-pointer p-2 z-[1001]"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              type="button"
            >
              <span className={`w-6 h-0.5 bg-primary transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-primary transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-primary transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 bg-white z-[999] overflow-y-auto">
            <nav className="px-4 py-6 space-y-4">
              {/* Services Section */}
              <div>
                <button
                  className="flex items-center justify-between w-full text-left text-text font-medium py-2"
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                >
                  <span>Services</span>
                  <svg 
                    className={`w-5 h-5 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isServicesOpen && (
                  <div className="mt-2 pl-4 space-y-3">
                    {services.map((service) => (
                      <Link
                        key={service.slug}
                        to={`/services/${service.slug}`}
                        className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        onClick={closeMenu}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 text-primary mt-0.5">
                            <ServiceIcon icon={service.slug} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-text mb-1">
                              {service.title}
                            </h3>
                            <p className="text-xs text-text-light leading-relaxed">
                              {service.intro}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Navigation Items */}
              <a 
                href="#about" 
                className="block text-text font-medium py-2"
                onClick={(e) => { e.preventDefault(); scrollToSection('about') }}
              >
                About
              </a>
              <a 
                href="#remote" 
                className="block text-text font-medium py-2"
                onClick={(e) => { e.preventDefault(); scrollToSection('remote') }}
              >
                Remote
              </a>
              <a 
                href="#contact" 
                className="block text-text font-medium py-2"
                onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}
              >
                Contact
              </a>

              {/* Resources Section */}
              <div>
                <button
                  className="flex items-center justify-between w-full text-left text-text font-medium py-2"
                  onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                >
                  <span>Resources</span>
                  <svg 
                    className={`w-5 h-5 transition-transform ${isResourcesOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isResourcesOpen && (
                  <div className="mt-2 pl-4 space-y-3">
                    {resourceCategories.map((category) => (
                      <Link
                        key={category.slug}
                        to={`/resources/${category.slug}`}
                        className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        onClick={closeMenu}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 text-primary mt-0.5">
                            <ResourceIcon icon={category.icon} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-text mb-1">
                              {category.title}
                            </h3>
                            <p className="text-xs text-text-light leading-relaxed">
                              {category.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Articles Section */}
              <div>
                <button
                  className="flex items-center justify-between w-full text-left text-text font-medium py-2"
                  onClick={() => setIsArticlesOpen(!isArticlesOpen)}
                >
                  <span>Articles</span>
                  <svg 
                    className={`w-5 h-5 transition-transform ${isArticlesOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isArticlesOpen && (
                  <div className="mt-2 pl-4 space-y-2">
                    <Link
                      to="/articles/category/canadian-tax"
                      className="block py-2 text-sm text-text hover:text-primary transition-colors"
                      onClick={closeMenu}
                    >
                      Canadian Tax
                    </Link>
                    <Link
                      to="/articles/category/accounting"
                      className="block py-2 text-sm text-text hover:text-primary transition-colors"
                      onClick={closeMenu}
                    >
                      Accounting
                    </Link>
                    <Link
                      to="/articles/category/technology"
                      className="block py-2 text-sm text-text hover:text-primary transition-colors"
                      onClick={closeMenu}
                    >
                      Technology
                    </Link>
                  </div>
                )}
              </div>

              <Link 
                to="/client-portal" 
                className="block btn btn--secondary whitespace-nowrap text-center"
                onClick={closeMenu}
              >
                Client Portal
              </Link>

              <div className="pt-4 border-t border-gray-200">
                <CalendlyButton className="btn btn--primary w-full" />
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}

export default Header

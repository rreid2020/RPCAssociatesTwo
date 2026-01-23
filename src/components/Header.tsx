import { FC, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
// Note: Place your logo file at src/assets/rpc-logo.png
// Using SVG placeholder until PNG is added
import logo from '../assets/rpc-logo.svg'
import CalendlyButton from './CalendlyButton'

import { services } from '../lib/services/data'

const Header: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
  const [isArticlesOpen, setIsArticlesOpen] = useState(false)
  const [isServicesOpen, setIsServicesOpen] = useState(false)
  const location = useLocation()

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      // If not on home page, navigate to home first
      window.location.href = `/#${id}`
      return
    }
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  const handleNavClick = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 bg-white shadow-sm z-[1000] py-4">
      <div className="max-w-[1200px] mx-auto px-md flex justify-between items-center gap-md">
        <Link to="/" aria-label="RPC Associates Home" className="flex items-center gap-sm no-underline">
          <img src={logo} alt="RPC Associates" className="h-10 w-10 flex-shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xl font-semibold text-primary whitespace-nowrap leading-tight">RPC Associates</span>
            <span className="text-xs font-normal text-text-light whitespace-nowrap leading-tight">Accounting · Consulting · Tech Solutions</span>
          </div>
        </Link>
        <nav className={`lg:flex lg:items-center lg:gap-lg ${isMenuOpen ? 'absolute top-full left-0 right-0 bg-white shadow-md p-md flex flex-col gap-md lg:static lg:shadow-none lg:p-0' : 'hidden lg:flex'}`}>
          <ul className="flex lg:flex-row flex-col list-none gap-md lg:items-center lg:gap-md">
            <li 
              className="relative"
              onMouseEnter={() => setIsServicesOpen(true)}
              onMouseLeave={() => setIsServicesOpen(false)}
            >
              <a 
                href="#services" 
                className="text-text font-medium py-xs whitespace-nowrap hover:text-primary transition-colors"
                onClick={(e) => {
                  if (window.innerWidth <= 1024) {
                    e.preventDefault()
                    setIsServicesOpen(!isServicesOpen)
                  } else {
                    e.preventDefault()
                    scrollToSection('services')
                  }
                }}
              >
                Services
              </a>
              <ul className={`lg:absolute lg:top-full lg:left-0 bg-white shadow-md rounded-lg list-none p-xs mt-xs min-w-[280px] lg:min-w-[360px] transition-all z-[1000] ${isServicesOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2.5 lg:opacity-0 lg:invisible lg:-translate-y-2.5'} ${isMenuOpen ? 'static opacity-100 visible translate-y-0 shadow-none' : ''}`}>
                {services.map((service) => (
                  <li key={service.slug}>
                    <Link 
                      to={`/services/${service.slug}`}
                      className="block px-md py-sm text-text text-[0.9375rem] cursor-default whitespace-nowrap hover:bg-gray-50 rounded transition-colors"
                      onClick={handleNavClick}
                    >
                      {service.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <a 
                href="#why" 
                className="text-text font-medium py-xs whitespace-nowrap hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); scrollToSection('why') }}
              >
                Why Hire an Accountant
              </a>
            </li>
            <li>
              <a 
                href="#about" 
                className="text-text font-medium py-xs whitespace-nowrap hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); scrollToSection('about') }}
              >
                About
              </a>
            </li>
            <li>
              <a 
                href="#remote" 
                className="text-text font-medium py-xs whitespace-nowrap hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); scrollToSection('remote') }}
              >
                Remote
              </a>
            </li>
            <li>
              <a 
                href="#contact" 
                className="text-text font-medium py-xs whitespace-nowrap hover:text-primary transition-colors"
                onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}
              >
                Contact
              </a>
            </li>
            <li 
              className="relative"
              onMouseEnter={() => setIsResourcesOpen(true)}
              onMouseLeave={() => setIsResourcesOpen(false)}
            >
              <Link 
                to="/resources" 
                className="text-text font-medium py-xs whitespace-nowrap hover:text-primary transition-colors"
                onClick={(e) => {
                  if (window.innerWidth <= 1024) {
                    e.preventDefault()
                    setIsResourcesOpen(!isResourcesOpen)
                  } else {
                    handleNavClick()
                  }
                }}
              >
                Resources
              </Link>
              <ul className={`absolute top-full left-0 bg-white shadow-md rounded-lg list-none p-xs mt-xs min-w-[240px] lg:min-w-[360px] transition-all z-[1000] ${isResourcesOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2.5'}`}>
                <li>
                  <Link 
                    to="/resources/canadian-personal-income-tax-calculator" 
                    className="block px-md py-sm text-text text-[0.9375rem] cursor-default whitespace-nowrap hover:bg-gray-50 rounded transition-colors"
                    onClick={handleNavClick}
                  >
                    Canadian Personal Income Tax Calculator
                  </Link>
                </li>
              </ul>
            </li>
            <li 
              className="relative"
              onMouseEnter={() => setIsArticlesOpen(true)}
              onMouseLeave={() => setIsArticlesOpen(false)}
            >
              <Link 
                to="/articles" 
                className="text-text font-medium py-xs whitespace-nowrap hover:text-primary transition-colors"
                onClick={(e) => {
                  if (window.innerWidth <= 1024) {
                    e.preventDefault()
                    setIsArticlesOpen(!isArticlesOpen)
                  } else {
                    handleNavClick()
                  }
                }}
              >
                Articles
              </Link>
              <ul className={`absolute top-full left-0 bg-white shadow-md rounded-lg list-none p-xs mt-xs min-w-[240px] transition-all z-[1000] ${isArticlesOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2.5'}`}>
                <li>
                  <Link
                    to="/articles/category/canadian-tax"
                    className="block px-md py-sm text-text text-[0.9375rem] cursor-default whitespace-nowrap hover:bg-gray-50 rounded transition-colors"
                    onClick={handleNavClick}
                  >
                    Canadian Tax
                  </Link>
                </li>
                <li>
                  <Link
                    to="/articles/category/accounting"
                    className="block px-md py-sm text-text text-[0.9375rem] cursor-default whitespace-nowrap hover:bg-gray-50 rounded transition-colors"
                    onClick={handleNavClick}
                  >
                    Accounting
                  </Link>
                </li>
                <li>
                  <Link
                    to="/articles/category/technology"
                    className="block px-md py-sm text-text text-[0.9375rem] cursor-default whitespace-nowrap hover:bg-gray-50 rounded transition-colors"
                    onClick={handleNavClick}
                  >
                    Technology
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link 
                to="/client-portal" 
                className="btn btn--secondary whitespace-nowrap"
                onClick={handleNavClick}
              >
                Client Portal
              </Link>
            </li>
          </ul>
          <div className="flex gap-sm items-center ml-xs lg:flex hidden lg:flex">
            <CalendlyButton className="btn btn--primary whitespace-nowrap" />
          </div>
        </nav>
        <button 
          className="lg:hidden flex flex-col gap-1 bg-transparent border-none cursor-pointer p-xs"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span className="w-6 h-0.5 bg-primary transition-all"></span>
          <span className="w-6 h-0.5 bg-primary transition-all"></span>
          <span className="w-6 h-0.5 bg-primary transition-all"></span>
        </button>
      </div>
    </header>
  )
}

export default Header


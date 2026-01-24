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
    setIsResourcesOpen(false)
    setIsArticlesOpen(false)
    setIsServicesOpen(false)
  }

  const toggleMenu = () => {
    const newState = !isMenuOpen
    setIsMenuOpen(newState)
    if (!newState) {
      // Close all dropdowns when closing menu
      setIsResourcesOpen(false)
      setIsArticlesOpen(false)
      setIsServicesOpen(false)
    }
  }

  // Shared menu items component for reuse
  const MenuItems = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <li 
        className="relative"
        onMouseEnter={!isMobile ? () => setIsServicesOpen(true) : undefined}
        onMouseLeave={!isMobile ? () => setIsServicesOpen(false) : undefined}
      >
        <a 
          href="#services" 
          className="text-text font-medium py-xs whitespace-nowrap hover:text-primary transition-colors"
          onClick={(e) => {
            if (isMobile) {
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
        <ul className={`${isMobile ? 'static bg-gray-50 rounded mt-xs ml-md' : 'lg:absolute lg:top-full lg:left-0 bg-white shadow-md rounded-lg'} list-none p-xs mt-xs ${isMobile ? '' : 'min-w-[280px] lg:min-w-[360px]'} transition-all z-[1000] ${isServicesOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2.5 lg:opacity-0 lg:invisible lg:-translate-y-2.5'}`}>
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
        onMouseEnter={!isMobile ? () => setIsResourcesOpen(true) : undefined}
        onMouseLeave={!isMobile ? () => setIsResourcesOpen(false) : undefined}
      >
        <Link 
          to="/resources" 
          className="text-text font-medium py-xs whitespace-nowrap hover:text-primary transition-colors"
          onClick={(e) => {
            if (isMobile) {
              e.preventDefault()
              setIsResourcesOpen(!isResourcesOpen)
            } else {
              handleNavClick()
            }
          }}
        >
          Resources
        </Link>
        <ul className={`${isMobile ? 'static bg-gray-50 rounded mt-xs ml-md' : 'lg:absolute lg:top-full lg:left-0 bg-white shadow-md rounded-lg'} list-none p-xs mt-xs ${isMobile ? '' : 'min-w-[240px] lg:min-w-[360px]'} transition-all z-[1000] ${isResourcesOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2.5'}`}>
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
        onMouseEnter={!isMobile ? () => setIsArticlesOpen(true) : undefined}
        onMouseLeave={!isMobile ? () => setIsArticlesOpen(false) : undefined}
      >
        <Link 
          to="/articles" 
          className="text-text font-medium py-xs whitespace-nowrap hover:text-primary transition-colors"
          onClick={(e) => {
            if (isMobile) {
              e.preventDefault()
              setIsArticlesOpen(!isArticlesOpen)
            } else {
              handleNavClick()
            }
          }}
        >
          Articles
        </Link>
        <ul className={`${isMobile ? 'static bg-gray-50 rounded mt-xs ml-md' : 'lg:absolute lg:top-full lg:left-0 bg-white shadow-md rounded-lg'} list-none p-xs mt-xs ${isMobile ? '' : 'min-w-[240px]'} transition-all z-[1000] ${isArticlesOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2.5'}`}>
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
    </>
  )

  return (
    <>
      {/* Backdrop overlay for mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[998] lg:hidden"
          onClick={toggleMenu}
          aria-hidden="true"
        />
      )}
      <header className="sticky top-0 bg-white shadow-sm z-[1000] py-4">
        <div className="max-w-[1200px] mx-auto px-md flex justify-between items-center gap-md">
          <Link to="/" aria-label="RPC Associates Home" className="flex items-center gap-sm no-underline">
            <img src={logo} alt="RPC Associates" className="h-10 w-10 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-semibold text-primary whitespace-nowrap leading-tight">RPC Associates</span>
              <span className="text-xs font-normal text-text-light whitespace-nowrap leading-tight">Accounting · Consulting · Tech Solutions</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:items-center lg:gap-lg">
            <ul className="flex flex-row list-none gap-md items-center">
              <MenuItems isMobile={false} />
            </ul>
            <div className="flex gap-sm items-center ml-xs">
              <CalendlyButton className="btn btn--primary whitespace-nowrap" />
            </div>
          </nav>

          {/* Mobile Hamburger Button */}
          <button 
            className="lg:hidden flex flex-col gap-1 bg-transparent border-none cursor-pointer p-xs z-[1001] relative"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span className={`w-6 h-0.5 bg-primary transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-primary transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-primary transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {/* Mobile Navigation - Only renders when open */}
        {isMenuOpen && (
          <nav className="fixed top-[73px] left-0 right-0 bg-white shadow-lg p-md flex flex-col gap-md max-h-[calc(100vh-73px)] overflow-y-auto z-[999] lg:hidden">
            <ul className="flex flex-col list-none gap-md w-full">
              <MenuItems isMobile={true} />
            </ul>
            <div className="flex flex-col w-full mt-md pt-md border-t border-border">
              <CalendlyButton className="btn btn--primary whitespace-nowrap w-full" />
            </div>
          </nav>
        )}
      </header>
    </>
  )
}

export default Header

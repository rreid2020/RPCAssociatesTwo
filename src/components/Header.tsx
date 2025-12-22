import { FC, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
// Note: Place your logo file at src/assets/rpc-logo.png
// Using SVG placeholder until PNG is added
import logo from '../assets/rpc-logo.svg'

const Header: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
  const [isArticlesOpen, setIsArticlesOpen] = useState(false)
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

  const handleContactClick = () => {
    scrollToSection('contact')
  }

  const handleNavClick = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="header">
      <div className="header__container">
        <Link to="/" aria-label="RPC Associates Home" className="header__logo-link">
          <img src={logo} alt="RPC Associates" className="header__logo" />
          <div className="header__logo-text-wrapper">
            <span className="header__logo-text">RPC Associates</span>
            <span className="header__logo-tagline">Accounting · Consulting · Tech Solutions</span>
          </div>
        </Link>
        <nav className={`header__nav ${isMenuOpen ? 'header__nav--open' : ''}`}>
          <ul className="header__nav-links">
            <li>
              <a 
                href="#services" 
                className="header__nav-link"
                onClick={(e) => { e.preventDefault(); scrollToSection('services') }}
              >
                Services
              </a>
            </li>
            <li>
              <a 
                href="#why" 
                className="header__nav-link"
                onClick={(e) => { e.preventDefault(); scrollToSection('why') }}
              >
                Why Hire an Accountant
              </a>
            </li>
            <li>
              <a 
                href="#about" 
                className="header__nav-link"
                onClick={(e) => { e.preventDefault(); scrollToSection('about') }}
              >
                About
              </a>
            </li>
            <li>
              <a 
                href="#remote" 
                className="header__nav-link"
                onClick={(e) => { e.preventDefault(); scrollToSection('remote') }}
              >
                Remote
              </a>
            </li>
            <li>
              <a 
                href="#contact" 
                className="header__nav-link"
                onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}
              >
                Contact
              </a>
            </li>
            <li 
              className="header__nav-item--dropdown"
              onMouseEnter={() => setIsResourcesOpen(true)}
              onMouseLeave={() => setIsResourcesOpen(false)}
            >
              <Link 
                to="/resources" 
                className="header__nav-link"
                onClick={(e) => {
                  if (window.innerWidth <= 900) {
                    e.preventDefault()
                    setIsResourcesOpen(!isResourcesOpen)
                  } else {
                    handleNavClick()
                  }
                }}
              >
                Resources
              </Link>
              <ul className={`header__dropdown header__dropdown--resources ${isResourcesOpen ? 'header__dropdown--open' : ''}`}>
                <li>
                  <Link 
                    to="/resources/canadian-personal-income-tax-calculator" 
                    className="header__dropdown-item"
                    onClick={handleNavClick}
                  >
                    Canadian Personal Income Tax Calculator
                  </Link>
                </li>
              </ul>
            </li>
            <li 
              className="header__nav-item--dropdown"
              onMouseEnter={() => setIsArticlesOpen(true)}
              onMouseLeave={() => setIsArticlesOpen(false)}
            >
              <Link 
                to="/articles" 
                className="header__nav-link"
                onClick={(e) => {
                  if (window.innerWidth <= 900) {
                    e.preventDefault()
                    setIsArticlesOpen(!isArticlesOpen)
                  } else {
                    handleNavClick()
                  }
                }}
              >
                Articles
              </Link>
              <ul className={`header__dropdown ${isArticlesOpen ? 'header__dropdown--open' : ''}`}>
                <li>
                  <Link
                    to="/articles/category/canadian-tax"
                    className="header__dropdown-item"
                    onClick={handleNavClick}
                  >
                    Canadian Tax
                  </Link>
                </li>
                <li>
                  <Link
                    to="/articles/category/accounting"
                    className="header__dropdown-item"
                    onClick={handleNavClick}
                  >
                    Accounting
                  </Link>
                </li>
                <li>
                  <Link
                    to="/articles/category/technology"
                    className="header__dropdown-item"
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
                className="header__nav-link header__nav-link--portal"
                onClick={handleNavClick}
              >
                Client Portal
              </Link>
            </li>
          </ul>
          <div className="header__cta-group">
            <button 
              className="btn btn--secondary"
              onClick={handleContactClick}
            >
              Request a Call
            </button>
            <button 
              className="btn btn--primary"
              onClick={handleContactClick}
            >
              Book a Consultation
            </button>
          </div>
        </nav>
        <button 
          className="header__hamburger"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  )
}

export default Header


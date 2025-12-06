import { FC, useState } from 'react'
// Note: Place your logo file at src/assets/rpc-logo.png
// Using SVG placeholder until PNG is added
import logo from '../assets/rpc-logo.svg'

const Header: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  const handleContactClick = () => {
    scrollToSection('contact')
  }

  return (
    <header className="header">
      <div className="header__container">
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} aria-label="RPC Associates Home" className="header__logo-link">
          <img src={logo} alt="RPC Associates" className="header__logo" />
          <div className="header__logo-text-wrapper">
            <span className="header__logo-text">RPC Associates</span>
            <span className="header__logo-tagline">Accounting · Consulting · Tech Solutions</span>
          </div>
        </a>
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


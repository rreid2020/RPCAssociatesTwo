import { FC } from 'react'

const Footer: FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__content">
          <div className="footer__contact">
            <h3 className="footer__title">Contact</h3>
            <div className="footer__contact-info">
              <div className="footer__contact-item">
                <span className="footer__contact-label">Email:</span>
                <a href="mailto:info@rpcassociates.ca" className="footer__contact-link">
                  info@rpcassociates.ca
                </a>
              </div>
              <div className="footer__contact-item">
                <span className="footer__contact-label">Service area:</span>
                <span>Based in Canada · Serving clients remotely</span>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <div className="footer__copyright">
              © {currentYear} RPC Associates. All rights reserved.
            </div>
            <ul className="footer__links">
              <li>
                <a href="#" className="footer__link" onClick={(e) => e.preventDefault()}>
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="footer__link" onClick={(e) => e.preventDefault()}>
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer


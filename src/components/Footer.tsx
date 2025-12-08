import { FC } from 'react'

const Footer: FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__content">
          <div className="footer__bottom">
            <div className="footer__copyright">
              © {currentYear} RPC Associates. All rights reserved.
            </div>
          </div>
          <div className="footer__legal">
            <h3 className="footer__title">Legal</h3>
            <ul className="footer__links">
              <li>
                <a href="/privacy" className="footer__link">
                  Privacy
                </a>
              </li>
              <li>
                <a href="/terms" className="footer__link">
                  Terms
                </a>
              </li>
              <li>
                <a href="/sitemap" className="footer__link">
                  Site Map
                </a>
              </li>
            </ul>
          </div>
          <div className="footer__contact">
            <h3 className="footer__title">Contact</h3>
            <div className="footer__contact-info">
              <div className="footer__contact-item">
                <span>Roger Reid, CPA, CMA, CGAP</span>
              </div>
              <div className="footer__contact-item">
                <span className="footer__contact-label">Phone/Text:</span>
                <a href="tel:6138840208" className="footer__contact-link">
                  613-884-0208
                </a>
              </div>
              <div className="footer__contact-item">
                <span className="footer__contact-label">Email:</span>
                <a href="mailto:roger.reid@rpcassociates.co" className="footer__contact-link">
                  roger.reid@rpcassociates.co
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer


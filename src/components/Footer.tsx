import { FC } from 'react'

const Footer: FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__container">
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
    </footer>
  )
}

export default Footer


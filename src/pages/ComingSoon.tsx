import { FC } from 'react'
import SEO from '../components/SEO'

const ComingSoon: FC = () => {
  return (
    <>
      <SEO
        title="Client Portal - Coming Soon"
        description="RPC Associates Client Portal is coming soon. A secure platform for file sharing, document management, and client communication."
        canonical="/client-portal"
      />
      <main className="page-content">
        <div className="container">
          <div className="coming-soon">
            <div className="coming-soon__content">
              <h1 className="coming-soon__title">Client Portal</h1>
              <p className="coming-soon__subtitle">Coming Soon</p>
              <p className="coming-soon__description">
                We're building a secure client portal to make it easier for you to:
              </p>
              <ul className="coming-soon__features">
                <li>Upload and download documents securely</li>
                <li>Access your financial documents anytime</li>
                <li>Communicate with our team</li>
                <li>Track your project status</li>
                <li>Manage your account information</li>
              </ul>
              <p className="coming-soon__message">
                Our client portal will be available soon. In the meantime, please contact us directly for any document sharing or inquiries.
              </p>
              <div className="coming-soon__contact">
                <a href="mailto:roger.reid@rpcassociates.co" className="btn btn--primary">
                  Contact Us
                </a>
                <a href="tel:6138840208" className="btn btn--secondary">
                  Call: 613-884-0208
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default ComingSoon




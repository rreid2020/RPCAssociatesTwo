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
      <main className="py-xxl min-h-[60vh]">
        <div className="max-w-[800px] mx-auto px-md">
          <div className="text-center">
            <div className="bg-background p-xl rounded-xl shadow-md">
              <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-sm">Client Portal</h1>
              <p className="text-2xl lg:text-3xl text-text-light font-semibold mb-lg">Coming Soon</p>
              <p className="text-lg text-text mb-md">
                We're building a secure client portal to make it easier for you to:
              </p>
              <ul className="list-none p-0 m-0 text-left max-w-[500px] mx-auto mb-lg">
                <li className="py-sm pl-lg relative text-text before:content-['✓'] before:absolute before:left-0 before:text-primary before:font-bold before:text-xl">Upload and download documents securely</li>
                <li className="py-sm pl-lg relative text-text before:content-['✓'] before:absolute before:left-0 before:text-primary before:font-bold before:text-xl">Access your financial documents anytime</li>
                <li className="py-sm pl-lg relative text-text before:content-['✓'] before:absolute before:left-0 before:text-primary before:font-bold before:text-xl">Communicate with our team</li>
                <li className="py-sm pl-lg relative text-text before:content-['✓'] before:absolute before:left-0 before:text-primary before:font-bold before:text-xl">Track your project status</li>
                <li className="py-sm pl-lg relative text-text before:content-['✓'] before:absolute before:left-0 before:text-primary before:font-bold before:text-xl">Manage your account information</li>
              </ul>
              <p className="text-base text-text-light my-xl leading-relaxed">
                Our client portal will be available soon. In the meantime, please contact us directly for any document sharing or inquiries.
              </p>
              <div className="flex gap-md justify-center flex-wrap mt-xl">
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





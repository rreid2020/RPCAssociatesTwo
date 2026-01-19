import { FC } from 'react'
import { Link } from 'react-router-dom'

const Footer: FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary text-white py-xl mt-xxl">
      <div className="max-w-[1200px] mx-auto px-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-xl items-start">
          <div>
            <div className="text-sm opacity-90">
              © {currentYear} RPC Associates. All rights reserved.
            </div>
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl mb-md font-semibold text-white">Legal</h3>
            <ul className="flex flex-col gap-sm list-none m-0 p-0">
              <li>
                <Link to="/privacy" className="text-white opacity-90 text-sm no-underline transition-all hover:opacity-100 hover:underline">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-white opacity-90 text-sm no-underline transition-all hover:opacity-100 hover:underline">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/sitemap" className="text-white opacity-90 text-sm no-underline transition-all hover:opacity-100 hover:underline">
                  Site Map
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-right md:text-right">
            <h3 className="text-xl mb-md font-semibold text-white">Contact</h3>
            <div className="flex flex-col gap-sm items-end md:items-end">
              <div className="text-sm">
                <span>Roger Reid, CPA, CMA, CGAP</span>
              </div>
              <div className="text-sm flex flex-row gap-xs items-baseline md:flex-row">
                <span className="font-semibold opacity-90">Phone/Text:</span>
                <a href="tel:6138840208" className="text-white opacity-90 no-underline transition-all hover:opacity-100 hover:underline">
                  613-884-0208
                </a>
              </div>
              <div className="text-sm flex flex-row gap-xs items-baseline md:flex-row">
                <span className="font-semibold opacity-90">Email:</span>
                <a href="mailto:roger.reid@rpcassociates.co" className="text-white opacity-90 no-underline transition-all hover:opacity-100 hover:underline">
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


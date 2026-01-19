import { FC } from 'react'
import { Link } from 'react-router-dom'
import { SanityRelatedLink } from '../lib/sanity/types'

interface RelatedLinksProps {
  links: SanityRelatedLink[]
}

const RelatedLinks: FC<RelatedLinksProps> = ({ links }) => {
  if (!links || links.length === 0) {
    return null
  }

  return (
    <div className="bg-white p-xl rounded-xl shadow-sm mb-xxl border border-border">
      <h2 className="text-2xl font-semibold text-primary mb-lg">Related Resources</h2>
      <ul className="list-none p-0 m-0 flex flex-col gap-sm">
        {links.map((link) => {
          const isExternal = link.external || link.url.startsWith('http')
          
          if (isExternal) {
            return (
              <li key={link._key} className="m-0">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-sm p-md bg-gray-50 rounded-lg border border-border no-underline text-text transition-all hover:border-primary hover:bg-white hover:shadow-sm flex-col md:flex-row"
                >
                  <span className="font-semibold text-primary flex-1">{link.title} ↗</span>
                  {link.description && (
                    <span className="block text-[0.9375rem] text-text-light mt-xs md:mt-0 leading-relaxed">{link.description}</span>
                  )}
                </a>
              </li>
            )
          }

          return (
            <li key={link._key} className="m-0">
              <Link
                to={link.url}
                className="flex items-start gap-sm p-md bg-gray-50 rounded-lg border border-border no-underline text-text transition-all hover:border-primary hover:bg-white hover:shadow-sm flex-col md:flex-row"
              >
                <span className="font-semibold text-primary flex-1">{link.title}</span>
                {link.description && (
                  <span className="block text-[0.9375rem] text-text-light mt-xs md:mt-0 leading-relaxed">{link.description}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default RelatedLinks



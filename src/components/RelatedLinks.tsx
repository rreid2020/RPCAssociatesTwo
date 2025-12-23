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
    <div className="related-links">
      <h2 className="related-links__title">Related Links</h2>
      <ul className="related-links__list">
        {links.map((link) => {
          const isExternal = link.isExternal || link.url.startsWith('http')
          
          if (isExternal) {
            return (
              <li key={link._key} className="related-links__item">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="related-links__link related-links__link--external"
                >
                  <span className="related-links__link-title">{link.title}</span>
                  {link.description && (
                    <span className="related-links__link-description">{link.description}</span>
                  )}
                  <span className="related-links__link-icon" aria-label="External link">↗</span>
                </a>
              </li>
            )
          }

          return (
            <li key={link._key} className="related-links__item">
              <Link
                to={link.url}
                className="related-links__link related-links__link--internal"
              >
                <span className="related-links__link-title">{link.title}</span>
                {link.description && (
                  <span className="related-links__link-description">{link.description}</span>
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


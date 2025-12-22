import { FC } from 'react'
import { PortableText as PortableTextRenderer, PortableTextComponents } from '@portabletext/react'
import { urlFor } from '../lib/sanity/image'
import { SanityImage } from '../lib/sanity/types'

interface PortableTextProps {
  content: any[]
}

const PortableText: FC<PortableTextProps> = ({ content }) => {
  const components: PortableTextComponents = {
    block: {
      h2: ({ children }) => <h2 className="portable-text__heading portable-text__heading--h2">{children}</h2>,
      h3: ({ children }) => <h3 className="portable-text__heading portable-text__heading--h3">{children}</h3>,
      h4: ({ children }) => <h4 className="portable-text__heading portable-text__heading--h4">{children}</h4>,
      normal: ({ children }) => <p className="portable-text__paragraph">{children}</p>,
    },
    list: {
      bullet: ({ children }) => <ul className="portable-text__list portable-text__list--bullet">{children}</ul>,
      number: ({ children }) => <ol className="portable-text__list portable-text__list--number">{children}</ol>,
    },
    listItem: {
      bullet: ({ children }) => <li className="portable-text__list-item">{children}</li>,
      number: ({ children }) => <li className="portable-text__list-item">{children}</li>,
    },
    marks: {
      link: ({ value, children }) => {
        const target = value?.href?.startsWith('http') ? '_blank' : undefined
        const rel = target === '_blank' ? 'noopener noreferrer' : undefined
        return (
          <a
            href={value?.href}
            target={target}
            rel={rel}
            className="portable-text__link"
          >
            {children}
          </a>
        )
      },
    },
    types: {
      image: ({ value }) => {
        if (!value?.asset) return null
        const imageUrl = urlFor(value as SanityImage)
        if (!imageUrl) return null
        
        return (
          <figure className="portable-text__image">
            <img
              src={imageUrl.width(800).url()}
              alt={value.alt || ''}
              className="portable-text__image-img"
            />
            {value.alt && (
              <figcaption className="portable-text__image-caption">{value.alt}</figcaption>
            )}
          </figure>
        )
      },
    },
  }

  return (
    <div className="portable-text">
      <PortableTextRenderer value={content} components={components} />
    </div>
  )
}

export default PortableText

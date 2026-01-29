import { FC } from 'react'
import { Link } from 'react-router-dom'
import { PortableText as PortableTextRenderer, PortableTextComponents } from '@portabletext/react'
import { urlFor } from '../lib/sanity/image'
import { SanityImage } from '../lib/sanity/types'

interface PortableTextProps {
  content: any[]
}

const PortableText: FC<PortableTextProps> = ({ content }) => {
  const components: PortableTextComponents = {
    block: {
      h2: ({ children }) => <h2 className="font-semibold text-primary mt-xl mb-md text-3xl lg:text-4xl">{children}</h2>,
      h3: ({ children }) => <h3 className="font-semibold text-primary mt-xl mb-md text-2xl lg:text-3xl">{children}</h3>,
      h4: ({ children }) => <h4 className="font-semibold text-primary mt-xl mb-md text-xl lg:text-2xl">{children}</h4>,
      normal: ({ children }) => <p className="mb-md">{children}</p>,
    },
    list: {
      bullet: ({ children }) => <ul className="my-md pl-lg">{children}</ul>,
      number: ({ children }) => <ol className="my-md pl-lg">{children}</ol>,
    },
    listItem: {
      bullet: ({ children }) => <li className="mb-xs leading-relaxed">{children}</li>,
      number: ({ children }) => <li className="mb-xs leading-relaxed">{children}</li>,
    },
    marks: {
      link: ({ value, children }) => {
        const href = value?.href || ''
        
        // Check if it's an internal link (starts with / and doesn't start with http)
        const isInternal = href.startsWith('/') && !href.startsWith('http')
        
        if (isInternal) {
          // Use React Router Link for internal links
          return (
            <Link
              to={href}
              className="text-primary underline border-b border-primary no-underline transition-all hover:border-primary-dark"
            >
              {children}
            </Link>
          )
        }
        
        // External links
        const target = href.startsWith('http') ? '_blank' : undefined
        const rel = target === '_blank' ? 'noopener noreferrer' : undefined
        return (
          <a
            href={href}
            target={target}
            rel={rel}
            className="text-primary underline transition-all hover:opacity-80 after:content-['_↗'] after:text-sm after:opacity-70"
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
          <figure className="my-xl text-center">
            <img
              src={imageUrl.width(800).url()}
              alt={value.alt || ''}
              className="max-w-full h-auto rounded-lg"
            />
            {value.alt && (
              <figcaption className="text-sm text-text-light mt-xs italic">{value.alt}</figcaption>
            )}
          </figure>
        )
      },
      code: ({ value }) => {
        if (!value?.code) return null
        return (
          <pre className="my-lg bg-slate-900 rounded-lg overflow-hidden shadow-md">
            {value.filename && (
              <div className="bg-slate-800 px-4 py-2 text-sm text-gray-400 font-mono border-b border-slate-700">{value.filename}</div>
            )}
            <code className={`block p-md overflow-x-auto font-mono text-sm leading-relaxed text-slate-200 bg-slate-900 language-${value.language || 'text'}`}>
              {value.code}
            </code>
          </pre>
        )
      },
    },
  }

  return (
    <div className="text-lg leading-relaxed text-text">
      <PortableTextRenderer value={content} components={components} />
    </div>
  )
}

export default PortableText

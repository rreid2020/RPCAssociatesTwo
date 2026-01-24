import { FC } from 'react'
import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string | string[]
  canonical?: string
  ogImage?: string
  ogType?: string
  type?: string
  noIndex?: boolean
  noFollow?: boolean
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  schemaType?: string
  schemaAuthor?: string
  schemaPublisher?: string
  schemaPublisherLogo?: string
  publishedDate?: string
  modifiedDate?: string
  schemaService?: {
    name: string
    description: string
    provider: string
    areaServed?: string[]
    serviceType?: string
  }
}

const SEO: FC<SEOProps> = ({
  title = 'RPC Associates | Accounting, Consulting & Tech Solutions',
  description = 'RPC Associates provides accounting, consulting, and tech solutions for growing businesses. Get financial clarity, modern systems, and strategic guidance.',
  keywords = 'accounting, consulting, tech solutions, CPA, CMA, CGAP, tax preparation, financial advisory, business consulting, Canada, Canadian Income Tax, Ottawa accountant, Ottawa accounting services, Ottawa tax services, Ontario accountant',
  canonical = 'https://rpcassociates.co',
  ogImage = 'https://rpcassociates.co/og-image.jpg',
  ogType,
  type = 'website',
  noIndex = false,
  noFollow = false,
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  schemaType,
  schemaAuthor,
  schemaPublisher = 'RPC Associates',
  schemaPublisherLogo,
  publishedDate,
  modifiedDate,
  schemaService
}) => {
  const fullTitle = title.includes('RPC Associates') ? title : `${title} | RPC Associates`
  const fullCanonical = canonical.startsWith('http') ? canonical : `https://rpcassociates.co${canonical}`
  
  // Handle keywords as string or array
  const keywordsString = Array.isArray(keywords) ? keywords.join(', ') : keywords
  
  // Use OG type if provided, otherwise use type prop
  const ogTypeValue = ogType || type
  
  // Twitter values with fallbacks
  const twitterTitleValue = twitterTitle || fullTitle
  const twitterDescriptionValue = twitterDescription || description
  const twitterImageValue = twitterImage || ogImage

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywordsString && <meta name="keywords" content={keywordsString} />}
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogTypeValue} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="RPC Associates" />
      {publishedDate && <meta property="article:published_time" content={publishedDate} />}
      {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}

      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={fullCanonical} />
      <meta property="twitter:title" content={twitterTitleValue} />
      <meta property="twitter:description" content={twitterDescriptionValue} />
      <meta property="twitter:image" content={twitterImageValue} />

      {/* Additional SEO */}
      <meta name="robots" content={noIndex || noFollow ? `${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}` : "index, follow"} />
      <meta name="language" content="English" />
      <meta name="author" content="RPC Associates" />
      <meta name="geo.region" content="CA-ON" />
      <meta name="geo.placename" content="Ottawa, Ontario, Canada" />
      <meta name="geo.position" content="45.4215;-75.6972" />
      <meta name="ICBM" content="45.4215, -75.6972" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(
          schemaService ? {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: schemaService.name,
            description: schemaService.description,
            provider: {
              '@type': 'AccountingService',
              name: schemaService.provider || 'RPC Associates',
              url: 'https://rpcassociates.co',
              logo: 'https://rpcassociates.co/logo.png',
              telephone: '+1-613-884-0208',
              email: 'roger.reid@rpcassociates.co',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Ottawa',
                addressRegion: 'ON',
                addressCountry: 'CA'
              },
              areaServed: schemaService.areaServed || ['CA', 'CA-ON'],
              serviceType: schemaService.serviceType
            },
            serviceType: schemaService.serviceType,
            areaServed: schemaService.areaServed ? schemaService.areaServed.map((area: string) => ({
              '@type': area.includes('CA-ON') ? 'State' : area === 'CA' ? 'Country' : 'City',
              name: area === 'CA' ? 'Canada' : area === 'CA-ON' ? 'Ontario' : area
            })) : [
              { '@type': 'City', name: 'Ottawa' },
              { '@type': 'State', name: 'Ontario' },
              { '@type': 'Country', name: 'Canada' }
            ],
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': fullCanonical
            }
          }
          : schemaType === 'Article' || schemaType === 'BlogPosting' || schemaType === 'NewsArticle' || schemaType === 'TechArticle' 
            ? {
                '@context': 'https://schema.org',
                '@type': schemaType,
                headline: fullTitle,
                description: description,
                image: ogImage,
                datePublished: publishedDate,
                dateModified: modifiedDate || publishedDate,
                author: schemaAuthor ? {
                  '@type': 'Person',
                  name: schemaAuthor
                } : {
                  '@type': 'Organization',
                  name: 'RPC Associates'
                },
                publisher: {
                  '@type': 'Organization',
                  name: schemaPublisher || 'RPC Associates',
                  logo: schemaPublisherLogo ? {
                    '@type': 'ImageObject',
                    url: schemaPublisherLogo
                  } : {
                    '@type': 'ImageObject',
                    url: 'https://rpcassociates.co/logo.png'
                  }
                },
                mainEntityOfPage: {
                  '@type': 'WebPage',
                  '@id': fullCanonical
                }
              }
            : {
                '@context': 'https://schema.org',
                '@type': 'AccountingService',
                name: 'RPC Associates',
                description: description,
                url: 'https://rpcassociates.co',
                logo: 'https://rpcassociates.co/logo.png',
                image: 'https://rpcassociates.co/logo.png',
                telephone: '+1-613-884-0208',
                email: 'roger.reid@rpcassociates.co',
                priceRange: '$$',
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: '+1-613-884-0208',
                  contactType: 'Customer Service',
                  email: 'roger.reid@rpcassociates.co',
                  areaServed: ['CA', 'CA-ON'],
                  availableLanguage: 'English'
                },
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Ottawa',
                  addressRegion: 'ON',
                  addressCountry: 'CA',
                  addressCountryName: 'Canada'
                },
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: 45.4215,
                  longitude: -75.6972
                },
                sameAs: [
                  'https://rpcassociates.co'
                ],
                areaServed: [
                  {
                    '@type': 'City',
                    name: 'Ottawa',
                    containedIn: {
                      '@type': 'State',
                      name: 'Ontario'
                    }
                  },
                  {
                    '@type': 'State',
                    name: 'Ontario'
                  },
                  {
                    '@type': 'Country',
                    name: 'Canada'
                  }
                ],
                serviceArea: {
                  '@type': 'GeoCircle',
                  geoMidpoint: {
                    '@type': 'GeoCoordinates',
                    latitude: 45.4215,
                    longitude: -75.6972
                  },
                  geoRadius: {
                    '@type': 'Distance',
                    name: 'Canada-wide'
                  }
                }
              }
        )}
      </script>
    </Helmet>
  )
}

export default SEO





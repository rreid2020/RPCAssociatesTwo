import { FC } from 'react'
import { Helmet } from 'react-helmet-async'
import { BRAND, siteUrl, contactEmail } from '../lib/brand'

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

const defaultOgImage = `${siteUrl}/og-image.jpg`

const SEO: FC<SEOProps> = ({
  title = `${BRAND.name} | ${BRAND.tagline}`,
  description = BRAND.description,
  keywords = 'accounting, consulting, tax preparation, financial advisory, business consulting, Canada, Canadian Income Tax, Ottawa, CPA, CMA, CGAP, Axiom, automation, intelligence, Roger Reid',
  canonical = siteUrl,
  ogImage = defaultOgImage,
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
  schemaPublisher = BRAND.name,
  schemaPublisherLogo,
  publishedDate,
  modifiedDate,
  schemaService
}) => {
  const fullTitle = title.includes(BRAND.name) ? title : `${title} | ${BRAND.name}`
  // Always use non-www canonical URL, strip query parameters
  const baseUrl = siteUrl.replace(/\/$/, '')
  let fullCanonical: string
  if (canonical.startsWith('http')) {
    fullCanonical = canonical.replace(/^https?:\/\/(www\.)?/, 'https://').split('?')[0]
  } else {
    fullCanonical = `${baseUrl}${canonical.split('?')[0]}`
  }
  
  const keywordsString = Array.isArray(keywords) ? keywords.join(', ') : keywords

  const ogTypeValue = ogType || type

  const twitterTitleValue = twitterTitle || fullTitle
  const twitterDescriptionValue = twitterDescription || description
  const twitterImageValue = twitterImage || ogImage

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywordsString && <meta name="keywords" content={keywordsString} />}
      <link rel="canonical" href={fullCanonical} />

      <meta property="og:type" content={ogTypeValue} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={BRAND.nameFull} />
      {publishedDate && <meta property="article:published_time" content={publishedDate} />}
      {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}

      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={fullCanonical} />
      <meta property="twitter:title" content={twitterTitleValue} />
      <meta property="twitter:description" content={twitterDescriptionValue} />
      <meta property="twitter:image" content={twitterImageValue} />

      <meta name="robots" content={noIndex || noFollow ? `${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}` : "index, follow"} />
      <meta name="language" content="English" />
      <meta name="author" content={BRAND.nameFull} />
      <meta name="geo.region" content="CA-ON" />
      <meta name="geo.placename" content="Ottawa, Ontario, Canada" />
      <meta name="geo.position" content="45.4215;-75.6972" />
      <meta name="ICBM" content="45.4215, -75.6972" />

      <script type="application/ld+json">
        {JSON.stringify(
          schemaService ? {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: schemaService.name,
            description: schemaService.description,
            provider: {
              '@type': 'AccountingService',
              name: schemaService.provider || BRAND.nameFull,
              url: siteUrl,
              logo: `${siteUrl}/og-image.jpg`,
              telephone: '+1-613-884-0208',
              email: contactEmail,
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
                  name: BRAND.nameFull
                },
                publisher: {
                  '@type': 'Organization',
                  name: schemaPublisher || BRAND.nameFull,
                  logo: schemaPublisherLogo ? {
                    '@type': 'ImageObject',
                    url: schemaPublisherLogo
                  } : {
                    '@type': 'ImageObject',
                    url: `${siteUrl}/og-image.jpg`
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
                name: BRAND.nameFull,
                description: description,
                url: siteUrl,
                logo: `${siteUrl}/og-image.jpg`,
                image: `${siteUrl}/og-image.jpg`,
                telephone: '+1-613-884-0208',
                email: contactEmail,
                priceRange: '$$',
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: '+1-613-884-0208',
                  contactType: 'Customer Service',
                  email: contactEmail,
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
                  siteUrl
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

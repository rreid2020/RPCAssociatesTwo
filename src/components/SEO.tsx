import { FC } from 'react'
import { Helmet } from 'react-helmet-async'
import { BRAND, siteUrl, contactEmail } from '../lib/brand'

interface BreadcrumbItem {
  name: string
  path: string
}

interface SchemaSoftware {
  name: string
  description: string
  applicationCategory?: string
  operatingSystem?: string
  offersUrl?: string
  offersPrice?: string
  offersCurrency?: string
}

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
  schemaSoftware?: SchemaSoftware
  breadcrumbs?: BreadcrumbItem[]
}

const defaultOgImage = `${siteUrl}/og-image.jpg`
const OG_IMAGE_WIDTH = '1200'
const OG_IMAGE_HEIGHT = '630'

const isPrivateAppPath = (pathname: string): boolean => {
  if (pathname === '/portal' || pathname.startsWith('/portal/')) return true
  if (pathname === '/app' || pathname.startsWith('/app/')) return true
  return false
}

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
  schemaService,
  schemaSoftware,
  breadcrumbs
}) => {
  const fullTitle = title.includes(BRAND.name) ? title : `${title} | ${BRAND.name}`
  const baseUrl = siteUrl.replace(/\/$/, '')
  const normalizeCanonicalUrl = (url: string): string => {
    try {
      const parsed = new URL(url)
      parsed.protocol = 'https:'
      if (parsed.hostname.startsWith('www.')) {
        parsed.hostname = parsed.hostname.slice(4)
      }
      parsed.search = ''
      parsed.hash = ''
      return parsed.toString()
    } catch {
      return `${baseUrl}/`
    }
  }
  let fullCanonical: string
  if (canonical.startsWith('http')) {
    fullCanonical = normalizeCanonicalUrl(canonical)
  } else {
    const relativePath = canonical.startsWith('/') ? canonical : `/${canonical}`
    fullCanonical = normalizeCanonicalUrl(`${baseUrl}${relativePath}`)
  }

  let canonicalPath = '/'
  try {
    canonicalPath = new URL(fullCanonical).pathname || '/'
  } catch {
    canonicalPath = '/'
  }

  const effectiveNoIndex = noIndex || isPrivateAppPath(canonicalPath)
  const keywordsString = Array.isArray(keywords) ? keywords.join(', ') : keywords
  const ogTypeValue = ogType || type
  const twitterTitleValue = twitterTitle || fullTitle
  const twitterDescriptionValue = twitterDescription || description
  const twitterImageValue = twitterImage || ogImage
  const robotsContent = `${effectiveNoIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`

  const organizationNode = {
    '@type': 'AccountingService',
    name: BRAND.nameFull,
    url: siteUrl,
    logo: defaultOgImage,
    telephone: '+1-613-884-0208',
    email: contactEmail,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ottawa',
      addressRegion: 'ON',
      addressCountry: 'CA'
    }
  }

  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: normalizeCanonicalUrl(
            item.path.startsWith('http') ? item.path : `${baseUrl}${item.path.startsWith('/') ? item.path : `/${item.path}`}`
          )
        }))
      }
    : null

  const primarySchema = schemaSoftware
    ? {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: schemaSoftware.name,
        description: schemaSoftware.description,
        applicationCategory: schemaSoftware.applicationCategory || 'BusinessApplication',
        operatingSystem: schemaSoftware.operatingSystem || 'Web',
        url: fullCanonical,
        image: ogImage,
        provider: organizationNode,
        offers: {
          '@type': 'Offer',
          price: schemaSoftware.offersPrice || '0',
          priceCurrency: schemaSoftware.offersCurrency || 'CAD',
          url: schemaSoftware.offersUrl || fullCanonical
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': fullCanonical
        }
      }
    : schemaService
      ? {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: schemaService.name,
          description: schemaService.description,
          provider: {
            ...organizationNode,
            name: schemaService.provider || BRAND.nameFull,
            serviceType: schemaService.serviceType
          },
          serviceType: schemaService.serviceType,
          areaServed: schemaService.areaServed
            ? schemaService.areaServed.map((area: string) => ({
                '@type': area.includes('CA-ON') ? 'State' : area === 'CA' ? 'Country' : 'City',
                name: area === 'CA' ? 'Canada' : area === 'CA-ON' ? 'Ontario' : area
              }))
            : [
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
            author: schemaAuthor
              ? {
                  '@type': 'Person',
                  name: schemaAuthor
                }
              : {
                  '@type': 'Organization',
                  name: BRAND.nameFull
                },
            publisher: {
              '@type': 'Organization',
              name: schemaPublisher || BRAND.nameFull,
              logo: {
                '@type': 'ImageObject',
                url: schemaPublisherLogo || defaultOgImage
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
            logo: defaultOgImage,
            image: defaultOgImage,
            telephone: '+1-613-884-0208',
            email: contactEmail,
            priceRange: '$$',
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+1-613-884-0208',
              contactType: 'customer service',
              email: contactEmail,
              areaServed: ['CA', 'CA-ON'],
              availableLanguage: ['English']
            },
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Ottawa',
              addressRegion: 'ON',
              addressCountry: 'CA'
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 45.4215,
              longitude: -75.6972
            },
            areaServed: [
              { '@type': 'City', name: 'Ottawa' },
              { '@type': 'State', name: 'Ontario' },
              { '@type': 'Country', name: 'Canada' }
            ]
          }

  const jsonLdBlocks = [primarySchema, breadcrumbSchema].filter(Boolean)

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
      <meta property="og:image:width" content={OG_IMAGE_WIDTH} />
      <meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
      <meta property="og:image:alt" content={`${BRAND.nameFull} - ${BRAND.tagline}`} />
      <meta property="og:site_name" content={BRAND.nameFull} />
      <meta property="og:locale" content="en_CA" />
      {publishedDate && <meta property="article:published_time" content={publishedDate} />}
      {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={twitterTitleValue} />
      <meta name="twitter:description" content={twitterDescriptionValue} />
      <meta name="twitter:image" content={twitterImageValue} />
      <meta name="twitter:image:alt" content={`${BRAND.nameFull} - ${BRAND.tagline}`} />

      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="language" content="English" />
      <meta name="author" content={BRAND.nameFull} />
      <meta name="geo.region" content="CA-ON" />
      <meta name="geo.placename" content="Ottawa, Ontario, Canada" />
      <meta name="geo.position" content="45.4215;-75.6972" />
      <meta name="ICBM" content="45.4215, -75.6972" />

      {jsonLdBlocks.map((block, index) => (
        <script key={`ld-${index}`} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  )
}

export default SEO

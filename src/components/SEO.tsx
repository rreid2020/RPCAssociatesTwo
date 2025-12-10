import { FC } from 'react'
import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  canonical?: string
  ogImage?: string
  type?: string
}

const SEO: FC<SEOProps> = ({
  title = 'RPC Associates | Accounting, Consulting & Tech Solutions',
  description = 'RPC Associates provides accounting, consulting, and tech solutions for growing businesses. Get financial clarity, modern systems, and strategic guidance.',
  keywords = 'accounting, consulting, tech solutions, CPA, CMA, CGAP, tax preparation, financial advisory, business consulting, Canada',
  canonical = 'https://rpcassociates.co',
  ogImage = 'https://rpcassociates.co/og-image.jpg',
  type = 'website'
}) => {
  const fullTitle = title.includes('RPC Associates') ? title : `${title} | RPC Associates`
  const fullCanonical = canonical.startsWith('http') ? canonical : `https://rpcassociates.co${canonical}`

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="RPC Associates" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullCanonical} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="RPC Associates" />
      <meta name="geo.region" content="CA-ON" />
      <meta name="geo.placename" content="Canada" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'AccountingService',
          name: 'RPC Associates',
          description: description,
          url: 'https://rpcassociates.co',
          logo: 'https://rpcassociates.co/logo.png',
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-613-884-0208',
            contactType: 'Customer Service',
            email: 'roger.reid@rpcassociates.co',
            areaServed: 'CA',
            availableLanguage: 'English'
          },
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'CA',
            addressRegion: 'ON'
          },
          sameAs: [
            'https://rpcassociates.co'
          ],
          areaServed: {
            '@type': 'Country',
            name: 'Canada'
          }
        })}
      </script>
    </Helmet>
  )
}

export default SEO




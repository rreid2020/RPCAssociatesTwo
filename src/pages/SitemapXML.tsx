import { FC, useEffect, useState } from 'react'
import { getArticles } from '../lib/sanity/queries'
import { services } from '../lib/services/data'

interface SitemapPage {
  url: string
  priority: string
  changefreq: string
  lastmod?: string
}

const SitemapXML: FC = () => {
  const [xmlContent, setXmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function generateSitemap() {
      try {
        // Fetch all published articles (no limit)
        const articles = await getArticles({ limit: 1000 })
        
        // Always use non-www canonical URL
        const baseUrl = 'https://rpcassociates.co'
        const currentDate = new Date().toISOString().split('T')[0]

        // Static pages
        const staticPages: SitemapPage[] = [
          { url: '/', priority: '1.0', changefreq: 'weekly' },
          { url: '/book-consultation', priority: '0.9', changefreq: 'monthly' },
          { url: '/resources', priority: '0.8', changefreq: 'monthly' },
          { url: '/resources/online-calculators', priority: '0.8', changefreq: 'monthly' },
          { url: '/resources/excel-templates-tools', priority: '0.8', changefreq: 'monthly' },
          { url: '/resources/guides-publications', priority: '0.8', changefreq: 'monthly' },
          { url: '/resources/canadian-personal-income-tax-calculator', priority: '0.8', changefreq: 'monthly' },
          { url: '/resources/cash-flow-statement-template', priority: '0.8', changefreq: 'monthly' },
          { url: '/articles', priority: '0.8', changefreq: 'weekly' },
          { url: '/privacy', priority: '0.5', changefreq: 'yearly' },
          { url: '/terms', priority: '0.5', changefreq: 'yearly' },
          { url: '/sitemap', priority: '0.3', changefreq: 'monthly' }
        ]

        // Service pages
        const servicePages: SitemapPage[] = services.map(service => ({
          url: `/services/${service.slug}`,
          priority: '0.9',
          changefreq: 'monthly'
        }))

        // Article pages
        const articlePages: SitemapPage[] = articles.map(article => {
          const updatedDate = article.updatedAt 
            ? new Date(article.updatedAt).toISOString().split('T')[0]
            : article.publishedAt 
              ? new Date(article.publishedAt).toISOString().split('T')[0]
              : currentDate
          
          return {
            url: `/articles/${article.slug.current}`,
            priority: '0.7',
            changefreq: 'monthly',
            lastmod: updatedDate
          }
        })

        const allPages = [
          ...staticPages,
          ...servicePages,
          ...articlePages
        ]

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

        setXmlContent(sitemap)
      } catch (error) {
        console.error('Error generating sitemap:', error)
        // Fallback to basic sitemap
        const fallbackDate = new Date().toISOString().split('T')[0]
        setXmlContent(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://rpcassociates.co/</loc>
    <lastmod>${fallbackDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`)
      } finally {
        setLoading(false)
      }
    }

    generateSitemap()
  }, [])

  useEffect(() => {
    if (!loading && xmlContent) {
      // Try to set content type via meta tag
      let meta = document.querySelector('meta[http-equiv="Content-Type"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('http-equiv', 'Content-Type')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', 'application/xml; charset=utf-8')
    }
  }, [xmlContent, loading])

  if (loading) {
    return <div>Generating sitemap...</div>
  }

  // Render XML as preformatted text
  return (
    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', padding: '1rem' }}>
      {xmlContent}
    </pre>
  )
}

export default SitemapXML

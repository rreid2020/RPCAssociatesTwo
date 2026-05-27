import { writeFileSync, statSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read environment variables from .env file if it exists
function loadEnv() {
  try {
    const envFile = readFileSync(join(__dirname, '../.env'), 'utf8')
    const envVars = {}
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
      }
    })
    return envVars
  } catch (e) {
    return {}
  }
}

const env = { ...process.env, ...loadEnv() }

function dateFromFile(pathFromRepoRoot) {
  try {
    const absolutePath = join(__dirname, '..', pathFromRepoRoot)
    if (!existsSync(absolutePath)) return null
    return statSync(absolutePath).mtime.toISOString().split('T')[0]
  } catch {
    return null
  }
}

function dateFromFiles(pathsFromRepoRoot = [], fallbackDate) {
  const dates = pathsFromRepoRoot
    .map((p) => dateFromFile(p))
    .filter(Boolean)
    .sort()
  return dates[dates.length - 1] || fallbackDate
}

async function generateSitemap() {
  try {
    const projectId = env.VITE_SANITY_PROJECT_ID
    const dataset = env.VITE_SANITY_DATASET || 'production'
    const apiVersion = env.VITE_SANITY_API_VERSION || '2024-01-01'

    if (!projectId) {
      console.warn('⚠️  VITE_SANITY_PROJECT_ID not found. Generating sitemap without articles.')
    }

    // Services data (inline to avoid TypeScript import issues)
    const services = [
      { slug: 'core-accounting' },
      { slug: 'year-end-reporting' },
      { slug: 'tax-planning' },
      { slug: 'cash-flow-planning' },
      { slug: 'fractional-controller' },
      { slug: 'tech-solutions' },
    ]

    let articles = []
    
    if (projectId) {
      const client = createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: true,
      })

      // Fetch all published articles
      articles = await client.fetch(`
        *[_type == "article" && defined(slug.current)] | order(publishedAt desc) {
          "slug": slug.current,
          publishedAt,
          updatedAt,
          _updatedAt
        }
      `)
    }

    const baseUrl = (env.VITE_SITE_URL || process.env.VITE_SITE_URL || 'https://axiomft.ca').replace(/\/$/, '')
    const currentDate = new Date().toISOString().split('T')[0]

    // Static pages (stable lastmod based on source files)
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'weekly', sourceFiles: ['src/pages/Home.tsx'] },
      { url: '/services', priority: '0.9', changefreq: 'monthly', sourceFiles: ['src/pages/Services.tsx', 'src/lib/services/data.ts'] },
      { url: '/client-portal', priority: '0.8', changefreq: 'monthly', sourceFiles: ['src/pages/ClientPortal.tsx'] },
      { url: '/book-consultation', priority: '0.9', changefreq: 'monthly', sourceFiles: ['src/pages/BookConsultation.tsx'] },
      { url: '/contact', priority: '0.9', changefreq: 'monthly', sourceFiles: ['src/pages/ContactPage.tsx'] },
      { url: '/resources', priority: '0.8', changefreq: 'monthly', sourceFiles: ['src/pages/Resources.tsx'] },
      { url: '/resources/category/online-calculators', priority: '0.8', changefreq: 'monthly', sourceFiles: ['src/pages/ResourceCategory.tsx'] },
      { url: '/resources/category/excel-templates', priority: '0.8', changefreq: 'monthly', sourceFiles: ['src/pages/ResourceCategory.tsx'] },
      { url: '/resources/category/publications', priority: '0.8', changefreq: 'monthly', sourceFiles: ['src/pages/ResourceCategory.tsx'] },
      { url: '/resources/canadian-personal-income-tax-calculator', priority: '0.8', changefreq: 'monthly', sourceFiles: ['src/pages/TaxCalculator.tsx'] },
      { url: '/resources/cash-flow-calculator', priority: '0.8', changefreq: 'monthly', sourceFiles: ['src/pages/CashFlowCalculator.tsx'] },
      { url: '/resources/cash-flow-statement-direct-method', priority: '0.8', changefreq: 'monthly', sourceFiles: ['src/pages/CashFlowStatementDirectMethod.tsx'] },
      { url: '/resources/donation-credit-optimizer', priority: '0.8', changefreq: 'monthly', sourceFiles: ['src/pages/DonationOptimizerPage.tsx'] },
      { url: '/resources/ccpc-salary-dividend-calculator', priority: '0.8', changefreq: 'monthly', sourceFiles: ['src/pages/TaxEngineCalculatorPage.tsx'] },
      { url: '/resources/cash-flow-statement-template', priority: '0.8', changefreq: 'monthly', sourceFiles: ['src/pages/CashFlowTemplate.tsx', 'src/pages/ResourceDetail.tsx'] },
      { url: '/resources/cfi-financial-ratios-guide', priority: '0.8', changefreq: 'monthly', sourceFiles: ['src/pages/ResourceDetail.tsx'] },
      { url: '/articles', priority: '0.8', changefreq: 'weekly', sourceFiles: ['src/pages/Articles.tsx'] },
      { url: '/privacy', priority: '0.5', changefreq: 'yearly', sourceFiles: ['src/pages/Privacy.tsx'] },
      { url: '/terms', priority: '0.5', changefreq: 'yearly', sourceFiles: ['src/pages/Terms.tsx'] },
      { url: '/sitemap', priority: '0.3', changefreq: 'monthly', sourceFiles: ['src/pages/Sitemap.tsx'] },
    ]

    // Service pages
    const servicePages = services.map(service => ({
      url: `/services/${service.slug}`,
      priority: '0.9',
      changefreq: 'monthly',
      sourceFiles: ['src/pages/ServiceDetail.tsx', 'src/lib/services/data.ts']
    }))

    // Article pages
    const articlePages = articles.map(article => {
      const updatedDate = article.updatedAt 
        ? new Date(article.updatedAt).toISOString().split('T')[0]
        : article.publishedAt 
          ? new Date(article.publishedAt).toISOString().split('T')[0]
          : article._updatedAt
            ? new Date(article._updatedAt).toISOString().split('T')[0]
            : currentDate
      
      return {
        url: `/articles/${article.slug}`,
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: updatedDate
      }
    })

    // Article category pages
    const categoryPages = [
      { url: '/articles/category/canadian-tax', priority: '0.7', changefreq: 'weekly', sourceFiles: ['src/pages/ArticleCategory.tsx'] },
      { url: '/articles/category/accounting', priority: '0.7', changefreq: 'weekly', sourceFiles: ['src/pages/ArticleCategory.tsx'] },
      { url: '/articles/category/technology', priority: '0.7', changefreq: 'weekly', sourceFiles: ['src/pages/ArticleCategory.tsx'] },
    ]

    const allPages = [
      ...staticPages,
      ...servicePages,
      ...articlePages,
      ...categoryPages
    ]

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || dateFromFiles(page.sourceFiles || [], currentDate)}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    // Write to public folder (will be copied to dist during build)
    const outputPath = join(__dirname, '../public/sitemap.xml')
    writeFileSync(outputPath, sitemap, 'utf8')
    
    console.log(`✅ Sitemap generated successfully with ${allPages.length} URLs`)
    console.log(`   Output: ${outputPath}`)
    console.log(`   Articles: ${articles.length}`)
    console.log(`   Services: ${servicePages.length}`)
    console.log(`   Static pages: ${staticPages.length}`)
  } catch (error) {
    console.error('❌ Error generating sitemap:', error)
    
    // Fallback to basic sitemap
    const fallbackDate = new Date().toISOString().split('T')[0]
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${(env.VITE_SITE_URL || process.env.VITE_SITE_URL || 'https://axiomft.ca').replace(/\/$/, '')}/</loc>
    <lastmod>${fallbackDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
    
    const outputPath = join(__dirname, '../public/sitemap.xml')
    writeFileSync(outputPath, fallbackSitemap, 'utf8')
    console.log('⚠️  Generated fallback sitemap')
    // Don't exit with error - allow build to continue
  }
}

generateSitemap()

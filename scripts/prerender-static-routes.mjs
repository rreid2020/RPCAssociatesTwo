import { createServer } from 'node:http'
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import puppeteer from 'puppeteer'

const DIST_DIR = resolve(process.cwd(), 'dist')
const HOST = '127.0.0.1'
const PORT = 4173
const STRICT_PRERENDER = process.env.PRERENDER_STRICT === '1'

const ROUTES = [
  '/',
  '/services',
  '/services/core-accounting',
  '/services/year-end-reporting',
  '/services/tax-planning',
  '/services/cash-flow-planning',
  '/services/fractional-controller',
  '/services/tech-solutions',
  '/book-consultation',
  '/contact',
  '/resources',
  '/resources/category/online-calculators',
  '/resources/category/excel-templates',
  '/resources/category/publications',
  '/resources/canadian-personal-income-tax-calculator',
  '/resources/cash-flow-calculator',
  '/resources/cash-flow-statement-direct-method',
  '/resources/donation-credit-optimizer',
  '/resources/ccpc-salary-dividend-calculator',
  '/resources/cash-flow-statement-template',
  '/resources/cfi-financial-ratios-guide',
  '/articles',
  '/articles/category/canadian-tax',
  '/articles/category/accounting',
  '/articles/category/technology',
  '/privacy',
  '/terms'
]

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8'
}

function getContentType(filePath) {
  return CONTENT_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream'
}

function normalizePathname(urlPath = '/') {
  const clean = String(urlPath).split('?')[0].split('#')[0]
  if (!clean || clean === '/') return '/'
  return clean.startsWith('/') ? clean : `/${clean}`
}

async function serveFile(filePath, response) {
  const body = await readFile(filePath)
  response.writeHead(200, { 'Content-Type': getContentType(filePath) })
  response.end(body)
}

async function resolvePublicFile(pathname) {
  const directPath = join(DIST_DIR, pathname)
  if (existsSync(directPath)) {
    const directStat = await stat(directPath)
    if (directStat.isFile()) return directPath
  }

  const indexPath = join(DIST_DIR, pathname, 'index.html')
  if (existsSync(indexPath)) return indexPath

  return null
}

function startSpaServer() {
  return new Promise((resolveServer, rejectServer) => {
    const server = createServer(async (request, response) => {
      try {
        const pathname = normalizePathname(request.url || '/')
        const publicFile = await resolvePublicFile(pathname)

        if (publicFile) {
          await serveFile(publicFile, response)
          return
        }

        await serveFile(join(DIST_DIR, 'index.html'), response)
      } catch (error) {
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        response.end('Prerender server error')
        console.error(`Prerender server request failed: ${String(error?.message || error)}`)
      }
    })

    server.once('error', rejectServer)
    server.listen(PORT, HOST, () => resolveServer(server))
  })
}

async function writePrerenderedHtml(route, html) {
  if (route === '/') {
    await writeFile(join(DIST_DIR, 'index.html'), html, 'utf8')
    return
  }

  const outputDir = join(DIST_DIR, route.replace(/^\//, ''))
  await mkdir(outputDir, { recursive: true })
  await writeFile(join(outputDir, 'index.html'), html, 'utf8')
}

async function prerenderRoutes() {
  if (!existsSync(DIST_DIR)) {
    throw new Error('dist directory was not found. Run vite build before prerendering.')
  }

  let server = null
  let browser = null

  try {
    server = await startSpaServer()
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    } catch (error) {
      const launchError = String(error?.message || error || '')
      const isBrowserDependencyError =
        launchError.includes('Failed to launch the browser process') ||
        launchError.includes('error while loading shared libraries')

      if (!STRICT_PRERENDER && isBrowserDependencyError) {
        console.warn('Skipping prerender: browser dependencies are unavailable in this build environment.')
        console.warn(launchError)
        return { skipped: true }
      }
      throw error
    }

    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(90000)

    for (const route of ROUTES) {
      const url = `http://${HOST}:${PORT}${route}`
      await page.goto(url, { waitUntil: 'networkidle2' })
      const html = await page.content()
      await writePrerenderedHtml(route, html)
      console.log(`Prerendered ${route}`)
    }

    return { skipped: false }
  } finally {
    if (browser) {
      await browser.close()
    }
    if (server) {
      await new Promise((resolveClose, rejectClose) => {
        server.close((error) => (error ? rejectClose(error) : resolveClose()))
      })
    }
  }
}

prerenderRoutes()
  .then((result) => {
    if (result?.skipped) {
      console.log('Prerender step completed in fallback mode.')
      return
    }
    console.log(`Prerender complete for ${ROUTES.length} routes`)
  })
  .catch((error) => {
    console.error('Prerender failed:', error)
    process.exit(1)
  })

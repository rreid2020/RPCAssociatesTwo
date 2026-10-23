/**
 * Per-article title and description for first-byte SEO. Articles live in
 * Sanity, so the static route table only knows a generic "Article" entry;
 * this looks the real one up (public CDN, no token) and caches it briefly.
 */
const PROJECT_ID = process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || 't3zpylpm'
const DATASET = process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || 'production'
const CACHE_MS = 10 * 60 * 1000
const TIMEOUT_MS = 2500

const QUERY = `*[(_type == "article" || _type == "post") && defined(publishedAt) && slug.current == $slug][0]{
  title, excerpt, "metaTitle": seo.metaTitle, "metaDescription": seo.metaDescription, "noIndex": seo.noIndex
}`

const cache = new Map()

export function articleSlugFromPath (pathname) {
  const match = /^\/articles\/([^/]+)$/.exec(pathname)
  return match && match[1] !== 'category' ? decodeURIComponent(match[1]) : null
}

function toMeta (doc) {
  if (!doc) {
    return {
      notFound: true,
      noIndex: true,
      title: 'Page Not Found | Axiom',
      description: 'The page you were looking for could not be found on axiomft.ca.',
      h1: 'Page not found',
    }
  }
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim()
  const title = clean(doc.metaTitle || doc.title)
  return {
    title: /\|\s*Axiom$/.test(title) ? title : `${title} | Axiom`,
    description: clean(doc.metaDescription || doc.excerpt) || 'Insights on Canadian tax, accounting, and technology from Axiom Financial & Technology.',
    h1: clean(doc.title),
    noIndex: doc.noIndex === true,
  }
}

/**
 * Resolves to { title, description, h1, noIndex } for a published article,
 * { notFound: true } when Sanity has no such article, or null when Sanity
 * could not be reached (callers then keep the generic article meta).
 */
export async function fetchArticleMeta (slug) {
  const hit = cache.get(slug)
  if (hit && hit.expires > Date.now()) return hit.meta

  const url = `https://${PROJECT_ID}.apicdn.sanity.io/v2024-01-01/data/query/${DATASET}` +
    `?query=${encodeURIComponent(QUERY)}&%24slug=${encodeURIComponent(JSON.stringify(slug))}`
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!response.ok) return null
    const { result } = await response.json()
    const meta = toMeta(result)
    cache.set(slug, { meta, expires: Date.now() + CACHE_MS })
    return meta
  } catch {
    return null
  }
}

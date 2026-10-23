import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain JS module from the Express server
import { resolveRouteMeta } from '../../api/server/seo/routeMeta.js'
// @ts-expect-error plain JS module from the Express server
import { applyRouteSeo } from '../../api/server/seo/injectHtmlMeta.js'

const shell = readFileSync('index.html', 'utf8')
const count = (html: string, pattern: RegExp) => (html.match(pattern) || []).length

describe('first-byte SEO for marketing routes', () => {
  it('treats unknown paths as not found and noindex', () => {
    expect(resolveRouteMeta('/no-such-page')).toMatchObject({ notFound: true, noIndex: true })
    expect(resolveRouteMeta('/products/portfolio-analyst/').notFound).toBeUndefined()
    expect(resolveRouteMeta('/articles/any-article').notFound).toBeUndefined()
    expect(resolveRouteMeta('/portal/files')).toMatchObject({ noIndex: true })
    expect(resolveRouteMeta('/roger-reid-cv')).toMatchObject({ noIndex: true })
  })

  it('rewrites the shell tags in place instead of adding second copies', () => {
    const html = applyRouteSeo(shell, '/products/aro-suite')
    expect(count(html, /rel="canonical"/g)).toBe(1)
    expect(html).toContain('<link rel="canonical" href="https://axiomft.ca/products/aro-suite" data-rh="true" />')
    expect(count(html, /name="description"/g)).toBe(1)
    expect(count(html, /name="robots"/g)).toBe(1)
    expect(count(html, /property="og:url"/g)).toBe(1)
  })

  it('marks a missing page noindex', () => {
    expect(applyRouteSeo(shell, '/no-such-page')).toContain('name="robots" content="noindex, nofollow"')
  })
})

describe('per-article first-byte SEO', () => {
  it('reads the article slug from the path, ignoring category pages', async () => {
    // @ts-expect-error plain JS module from the Express server
    const { articleSlugFromPath } = await import('../../api/server/seo/articleMeta.js')
    expect(articleSlugFromPath('/articles/tfsa-vs-rrsp-which-is-better-for-canadians')).toBe('tfsa-vs-rrsp-which-is-better-for-canadians')
    expect(articleSlugFromPath('/articles/category')).toBeNull()
    expect(articleSlugFromPath('/articles/category/accounting')).toBeNull()
    expect(articleSlugFromPath('/articles')).toBeNull()
  })

  it('uses the override for title and canonical stays on the article path', () => {
    const html = applyRouteSeo(shell, '/articles/some-article', undefined, { title: 'Real Title | Axiom', description: 'Real description', h1: 'Real Title' })
    expect(html).toContain('<title>Real Title | Axiom</title>')
    expect(html).toContain('href="https://axiomft.ca/articles/some-article"')
    expect(count(html, /name="description"/g)).toBe(1)
  })
})

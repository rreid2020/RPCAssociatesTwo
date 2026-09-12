import { SITE_ORIGIN, resolveRouteMeta } from './routeMeta.js'

function escapeHtml (value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function replaceMetaByName (html, name, content) {
  const pattern = new RegExp(`(<meta\\s+name="${name}"\\s+content=")[^"]*("\\s*/?>)`, 'i')
  if (pattern.test(html)) {
    return html.replace(pattern, `$1${content}$2`)
  }
  return html.replace('</head>', `    <meta name="${name}" content="${content}" />\n  </head>`)
}

function replaceMetaByProperty (html, property, content) {
  const pattern = new RegExp(`(<meta\\s+property="${property}"\\s+content=")[^"]*("\\s*/?>)`, 'i')
  if (pattern.test(html)) {
    return html.replace(pattern, `$1${content}$2`)
  }
  return html.replace('</head>', `    <meta property="${property}" content="${content}" />\n  </head>`)
}

function replaceLinkRel (html, rel, href) {
  const pattern = new RegExp(`(<link\\s+rel="${rel}"\\s+href=")[^"]*("\\s*/?>)`, 'i')
  if (pattern.test(html)) {
    return html.replace(pattern, `$1${href}$2`)
  }
  return html.replace('</head>', `    <link rel="${rel}" href="${href}" />\n  </head>`)
}

/**
 * Rewrite the SPA shell so crawlers receive the requested URL's title,
 * description, and canonical — not the homepage defaults.
 */
export function applyRouteSeo (html, rawPath, origin = SITE_ORIGIN) {
  const meta = resolveRouteMeta(rawPath)
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const h1 = escapeHtml(meta.h1)
  const canonical = `${origin.replace(/\/$/, '')}${meta.path === '/' ? '/' : meta.path}`
  const robots = meta.noIndex ? 'noindex, nofollow' : 'index, follow'

  let next = String(html || '')
  next = next.replace(/<html\s+lang="[^"]*"/i, '<html lang="en-CA"')
  next = next.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`)
  next = replaceMetaByName(next, 'title', title)
  next = replaceMetaByName(next, 'description', description)
  next = replaceMetaByName(next, 'robots', robots)
  next = replaceMetaByName(next, 'twitter:url', canonical)
  next = replaceMetaByName(next, 'twitter:title', title)
  next = replaceMetaByName(next, 'twitter:description', description)
  next = replaceMetaByProperty(next, 'og:url', canonical)
  next = replaceMetaByProperty(next, 'og:title', title)
  next = replaceMetaByProperty(next, 'og:description', description)
  next = replaceLinkRel(next, 'canonical', canonical)

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: meta.title,
    description: meta.description,
    url: canonical,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Axiom Financial & Technology',
      url: origin,
    },
    inLanguage: 'en-CA',
  }

  next = next.replace(
    '</head>',
    `    <script type="application/ld+json">${JSON.stringify(webPageLd)}</script>\n  </head>`
  )

  const noscript = `<noscript><main><h1>${h1}</h1><p>${description}</p><p><a href="${canonical}">${canonical}</a></p></main></noscript>`
  if (!next.includes('<noscript>')) {
    next = next.replace('</body>', `    ${noscript}\n  </body>`)
  }

  return next
}

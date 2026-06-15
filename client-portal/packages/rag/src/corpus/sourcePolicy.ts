const ARCHIVED_CANCELLED_PATTERN =
  /\b(archived|cancelled|canceled|annul[ée]|annul[e]e|archiv[ée]|archivee)\b/i

export function isArchivedOrCancelledTitle (title?: string | null): boolean {
  if (!title) return false
  return ARCHIVED_CANCELLED_PATTERN.test(title)
}

export function shouldDiscoverSource (title: string): boolean {
  return !isArchivedOrCancelledTitle(title)
}

export type CorpusSourceDisposition = 'index' | 'skip_archived' | 'skip_directory'

export function classifyCorpusDisposition (input: {
  title: string
  pageKind?: string | null
}): CorpusSourceDisposition {
  if (isArchivedOrCancelledTitle(input.title)) {
    return 'skip_archived'
  }
  if (input.pageKind === 'directory') {
    return 'skip_directory'
  }
  return 'index'
}

/** Step-2 CRA landing page: publications/p-106.html (not publications/17-10/tax-discounters.html). */
export function isCatalogPublicationLandingUrl (url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const match = pathname.match(
      /\/(?:forms-publications|formulaires-publications)\/publications\/([^/]+)\.html$/
    )
    if (!match) return false
    const filename = match[1]
    // Content siblings from the landing page often use an -e suffix (e.g. 17-10-e.html).
    if (/-e$/i.test(filename)) return false
    return true
  } catch {
    return false
  }
}

/** Catalog landing still awaiting link expansion (not yet promoted to direct content). */
export function isPublicationLandingPendingExpand (input: {
  url: string
  pageKind?: string | null
  metadata?: Record<string, unknown> | null
}): boolean {
  if (!isCatalogPublicationLandingUrl(input.url)) return false
  if (input.pageKind === 'content') return false
  const metadata = input.metadata || {}
  if (metadata.publicationExpanded === true) return false
  return true
}

/** Catalog landing promoted to ingest after expand found no new child URLs. */
export function isPublicationLandingReadyForIngest (input: {
  url: string
  pageKind?: string | null
}): boolean {
  return isCatalogPublicationLandingUrl(input.url) && input.pageKind === 'content'
}

/** French CRA paths are language toggles — deprioritize for English-first ingest. */
export function isFrenchCraPublicationUrl (url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    return pathname.includes('/fr/agence-revenu/')
  } catch {
    return false
  }
}

/** Income tax folio chapter URLs under CRA technical information. */
export function isIncomeTaxFolioContentUrl (url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    return /income-tax-folio-[sS]\d+-[fF]\d+(-[cC]\d+)?/.test(pathname) ||
      /\/income-tax-folios-index\/.+\/income-tax-folio-/.test(pathname)
  } catch {
    return false
  }
}

/** Folio index / series pages used only for discovery, not direct ingest. */
export function isIncomeTaxFolioDiscoveryUrl (url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    return pathname.includes('/technical-information/') &&
      (pathname.includes('/income-tax-folios-index') || pathname.endsWith('/income-tax.html'))
  } catch {
    return false
  }
}

/** Prefer ingesting deeper content URLs before shallow catalog landings. */
export function publicationUrlDepth (url: string): number {
  try {
    const pathname = new URL(url).pathname
    if (isIncomeTaxFolioContentUrl(url)) {
      return pathname.split('/').filter(Boolean).length + 4
    }
    const after = pathname.split('/forms-publications/publications/')[1] || pathname
    return after.split('/').filter(Boolean).length
  } catch {
    return 0
  }
}

/**
 * Step-3 CRA publication content (not a catalog landing).
 * Ingest directly — do not re-run landing-page link discovery.
 */
export function isPublicationIngestContentUrl (url: string): boolean {
  if (publicationUrlDepth(url) >= 2) return true
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const match = pathname.match(
      /\/(?:forms-publications|formulaires-publications)\/publications\/([^/]+)\.html$/
    )
    return !!match && /-e$/i.test(match[1])
  } catch {
    return false
  }
}

export const CANADA_TAXES_HUB_URL =
  'https://www.canada.ca/en/services/taxes.html'

/** English Canada.ca tax hub and CRA tax HTML trees reachable from the hub. */
export function isTaxesHubInScopeUrl (url: string): boolean {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    if (host !== 'www.canada.ca' && host !== 'canada.ca') return false

    const pathname = parsed.pathname.toLowerCase()
    if (!pathname.startsWith('/en/')) return false

    return (
      pathname.startsWith('/en/services/taxes') ||
      pathname.startsWith('/en/services/benefits') ||
      pathname.startsWith('/en/revenue-agency/services/tax') ||
      pathname.startsWith('/en/revenue-agency/services/charities') ||
      pathname.startsWith('/en/revenue-agency/services/payment') ||
      pathname.startsWith('/en/revenue-agency/services/forms-publications/tax-packages-years') ||
      pathname.startsWith('/en/revenue-agency/services/child-care') ||
      pathname.startsWith('/en/revenue-agency/programs')
    )
  } catch {
    return false
  }
}

/** URLs that should not be discovered from the taxes hub crawl. */
export function shouldSkipTaxesHubDiscoveryUrl (url: string): boolean {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname.toLowerCase()
    const search = parsed.search.toLowerCase()

    if (pathname.endsWith('.pdf')) return true
    if (pathname.endsWith('.xml') || pathname.endsWith('.json')) return true
    if (search.includes('redirect=') || search.includes('logout')) return true
    if (/\/(sign-in|login|my-account|e-services\/)/.test(pathname)) return true
    if (/\/(social-media|terms|privacy|about)/.test(pathname)) return true
    if (pathname.endsWith('/publications.html') || pathname.endsWith('/forms.html')) return true
    if (pathname === '/en/services/taxes.html') return true
    if (isFrenchCraPublicationUrl(url)) return true
    return false
  } catch {
    return true
  }
}

export function classifyTaxesHubFamily (url: string): string {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    if (pathname.includes('/gsthst') || pathname.includes('/gst/') || pathname.includes('/hst')) {
      return 'gst_hst'
    }
    if (pathname.includes('/payroll')) return 'payroll'
    if (pathname.includes('/individuals') || pathname.includes('/personal-income')) {
      return 'personal'
    }
    if (pathname.includes('/businesses') || pathname.includes('/business/') || pathname.includes('/corporations')) {
      return 'business'
    }
    if (pathname.includes('/charit')) return 'charity'
    if (pathname.includes('/trusts')) return 'trust'
    if (pathname.includes('/benefit') || pathname.includes('/credit')) return 'benefits'
    if (pathname.includes('/savings') || pathname.includes('/rrsp') || pathname.includes('/tfsa') || pathname.includes('/pension')) {
      return 'savings_plans'
    }
    if (pathname.includes('/compliance') || pathname.includes('/audit') || pathname.includes('/penalt')) {
      return 'compliance'
    }
    if (pathname.startsWith('/en/services/taxes')) return 'taxes_hub'
    return 'other'
  } catch {
    return 'other'
  }
}

export function isTaxesHubDirectoryCandidate (row: {
  pageKind?: string | null
  metadata?: Record<string, unknown> | null
  sourceType?: string | null
}) {
  const metadata = (row.metadata || {}) as Record<string, unknown>
  if (metadata.corpusRole !== 'taxes_hub') return false
  if (row.sourceType === 'taxes_hub_directory') return true
  return row.pageKind === 'directory' || row.pageKind === 'unknown'
}

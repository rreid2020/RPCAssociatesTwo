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

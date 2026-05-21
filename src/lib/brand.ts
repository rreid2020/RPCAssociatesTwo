/**
 * Central brand constants. Override with VITE_* env when the new domain and contact are live.
 */
export const BRAND = {
  name: 'Axiom',
  nameFull: 'Axiom Financial & Technology',
  tagline: 'Accounting, Advisory, Automation & Intelligence',
  description:
    'Axiom Financial & Technology provides accounting, advisory, automation, and intelligence for growing businesses—financial clarity, modern systems, and strategic guidance.',
  defaultTitle: 'Axiom | Financial & Technology',
} as const

/** Public site origin (no trailing slash). Update when DNS moves. */
function normalizePublicSiteUrl (rawUrl: string): string {
  const fallback = 'https://axiomft.ca'
  const value = String(rawUrl || '').trim() || fallback
  try {
    const parsed = new URL(value.startsWith('http') ? value : `https://${value}`)
    parsed.protocol = 'https:'
    if (parsed.hostname.startsWith('www.')) {
      parsed.hostname = parsed.hostname.slice(4)
    }
    return parsed.origin
  } catch {
    return fallback
  }
}

export const siteUrl = normalizePublicSiteUrl(
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) || 'https://axiomft.ca'
)

export const contactEmail =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONTACT_EMAIL) || 'roger.reid@axiomft.ca'

export const infoEmail =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INFO_EMAIL) || 'info@axiomft.ca'

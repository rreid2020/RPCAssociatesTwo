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
export const siteUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) || 'https://axiomfinancial.tech'

export const contactEmail =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONTACT_EMAIL) || 'roger.reid@axiomfinancial.tech'

export const infoEmail =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INFO_EMAIL) || 'info@axiomfinancial.tech'

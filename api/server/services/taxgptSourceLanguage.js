/**
 * @typedef {'en' | 'fr'} TaxgptSourceLanguage
 */

/**
 * @param {unknown} value
 * @returns {TaxgptSourceLanguage}
 */
export function normalizeTaxgptLanguage (value) {
  return String(value || '').trim().toLowerCase() === 'fr' ? 'fr' : 'en'
}

/**
 * @param {string} url
 * @returns {TaxgptSourceLanguage}
 */
export function resolveSourceLanguage (url) {
  const lower = String(url || '').toLowerCase()
  if (!lower) return 'en'

  if (/\/fr(?:\/|$)/i.test(lower)) return 'fr'
  if (/\/en(?:\/|$)/i.test(lower)) return 'en'

  const filename = lower.split('/').pop() || ''
  if (/-f\.(?:html?|pdf)$/i.test(filename)) return 'fr'
  if (/-e\.(?:html?|pdf)$/i.test(filename)) return 'en'

  if (/(impot|revenu|cotisations|archives\/fra)/i.test(lower)) return 'fr'

  return 'en'
}

/**
 * @param {string} url
 * @param {TaxgptSourceLanguage} language
 */
export function matchesSourceLanguage (url, language) {
  return resolveSourceLanguage(url) === normalizeTaxgptLanguage(language)
}

/**
 * @param {TaxgptSourceLanguage} language
 */
export function taxgptLanguageLabel (language) {
  return normalizeTaxgptLanguage(language) === 'fr' ? 'French' : 'English'
}

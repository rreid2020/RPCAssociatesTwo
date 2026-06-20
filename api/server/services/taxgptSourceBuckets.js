/** @typedef {'cra' | 'legislation' | 'case_law'} TaxgptSourceBucket */

export const TAXGPT_SOURCE_BUCKETS = /** @type {const} */ (['cra', 'legislation', 'case_law'])

const LEGISLATION_CATEGORY_HINTS = new Set(['legislation', 'statute', 'regulation', 'act'])
const CASE_LAW_CATEGORY_HINTS = new Set(['case_law', 'caselaw', 'decision', 'ruling'])

/**
 * Classify a retrieved source into CRA / legislation / case law buckets.
 * Current corpus is CRA-heavy; legislation and case law activate when those corpora are indexed.
 *
 * @param {{
 *   category?: string | null
 *   metadata?: Record<string, unknown> | null
 *   url?: string | null
 *   title?: string | null
 * }} source
 * @returns {TaxgptSourceBucket}
 */
export function resolveSourceBucket (source = {}) {
  const category = String(source.category || '').toLowerCase()
  const metadata = source.metadata || {}
  const family = String(metadata.corpusFamily || metadata.sourceFamily || '').toLowerCase()
  const url = String(source.url || '').toLowerCase()
  const title = String(source.title || '').toLowerCase()

  if (
    family === 'legislation' ||
    family === 'statute' ||
    LEGISLATION_CATEGORY_HINTS.has(category)
  ) {
    return 'legislation'
  }

  if (
    family === 'case_law' ||
    family === 'caselaw' ||
    CASE_LAW_CATEGORY_HINTS.has(category)
  ) {
    return 'case_law'
  }

  if (/canlii\.(org|ca)\/[^?#]*\/(laws|regu|stat|regulations)\b/i.test(url)) {
    return 'legislation'
  }

  if (/laws-lois\.justice\.gc\.ca|\/statute|\/acts\//i.test(url)) {
    return 'legislation'
  }

  if (
    /e-laws\.gov\.on\.ca|legisquebec\.gouv\.qc\.ca|bclaws\.gov\.bc\.ca|qp\.alberta\.ca|publications\.saskatchewan\.ca|laws_regs\.gov\.sk\.ca|nslegislature\.ca|laws\.gnb\.ca|assembly\.nl\.ca|assembly\.pe\.ca|legislation\.yukon\.ca|justice\.gov\.nt\.ca/i.test(url)
  ) {
    return 'legislation'
  }

  if (
    /canlii\.(org|ca)|taxcourt|scc-csc\.lexum|fct-cf\.gc\.ca|decisions\.|ontariocourts\.ca|bccourts\.ca|albertacourts\.ca|tribunaux\.qc\.ca/i.test(url) ||
    /\bv\.\s|re:\s/i.test(title)
  ) {
    return 'case_law'
  }

  if (
    /\b(regulation|rules|statute)\b/i.test(title) &&
    /canlii\.(org|ca)|justice\.gc\.ca|gov\.(on|bc|ab|mb|sk|nl|ns|nb|pe|yk|nt|nu)\.ca/i.test(url)
  ) {
    return 'legislation'
  }

  return 'cra'
}

/** @param {TaxgptSourceBucket} bucket */
export function sourceBucketLabel (bucket) {
  switch (bucket) {
    case 'legislation':
      return 'Legislation'
    case 'case_law':
      return 'Case law'
    default:
      return 'CRA guidance'
  }
}

/** @param {TaxgptSourceBucket} bucket */
export function emptyBucketMessage (bucket) {
  switch (bucket) {
    case 'legislation':
      return 'No legislation or regulation sources were retrieved for this question.'
    case 'case_law':
      return 'No case law sources were retrieved for this question.'
    default:
      return 'No CRA guidance sources were retrieved for this question.'
  }
}

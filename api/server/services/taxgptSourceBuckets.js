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
    CASE_LAW_CATEGORY_HINTS.has(category) ||
    /canlii\.ca|taxcourt|scc-csc\.lexum|fct-cf\.gc\.ca|decisions\//i.test(url) ||
    /\bv\.\s|re:\s/i.test(title)
  ) {
    return 'case_law'
  }

  if (/laws-lois\.justice\.gc\.ca|\/statute|\/acts\//i.test(url)) {
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
      return 'No legislation sources were retrieved for this question. This corpus will be added in a future release.'
    case 'case_law':
      return 'No case law sources were retrieved for this question. This corpus will be added in a future release.'
    default:
      return 'No CRA guidance sources were retrieved for this question.'
  }
}

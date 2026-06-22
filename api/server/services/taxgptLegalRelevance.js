/**
 * Topic inference and relevance filtering for TaxGPT legislation / case-law web retrieval.
 */

const TAX_SIGNAL_TERMS = [
  'income tax',
  'tax act',
  'ita',
  'deduct',
  'deduction',
  'deductible',
  'reassessment',
  'minister of national revenue',
  'cra',
  'canada revenue',
  'tax court',
  'taxable',
  'business income',
  'business expense',
  'capital cost',
  'gst',
  'hst',
  'withholding',
  'withhold',
  'impôt',
  'déduction',
  'revenu canada'
]

const TAX_CASE_LAW_SIGNAL_TERMS = [
  ...TAX_SIGNAL_TERMS,
  'federal court of appeal',
  'federal court of canada',
  'cour canadienne',
  'v. the queen',
  'v. canada',
  'v. mnr',
  'v. minister',
  're:',
  ' tcc ',
  ' fca ',
  ' fct ',
  ' scc '
]

const IRRELEVANT_CASE_LAW_PATTERNS = [
  /family\s+focused\s+protocol/i,
  /family\s+court/i,
  /divorce/i,
  /custody/i,
  /matrimonial/i,
  /child\s+support/i,
  /spousal\s+support/i,
  /criminal\s+code/i,
  /bail\s+hearing/i,
  /sentencing/i,
  /personal\s+injury/i,
  /workers['’]?\s+compensation/i,
  /labour\s+relations/i,
  /human\s+rights\s+complaint/i
]

/** CanLII court codes for federal tax appellate/judicial bodies */
const FEDERAL_TAX_CANLII_COURTS = new Set(['tcc', 'fca', 'fct', 'scc', 'citt'])

/** Topic hints → ITA / search terms for legislation */
const LEGISLATION_TOPIC_HINTS = [
  {
    patterns: [/\b(business\s+expense|deduct\w*|self[- ]?employed|sole\s+proprietor)\b/i],
    en: {
      legislation: 'Income Tax Act section 18 paragraph 1 business expense deductibility self-employed',
      caseLaw: 'Tax Court Canada business expense deduction self-employed'
    },
    fr: {
      legislation: 'Loi de l\'impôt sur le revenu article 18 dépenses d\'entreprise déductibles travailleur autonome',
      caseLaw: 'Cour canadienne de l\'impôt dépenses d\'entreprise travailleur autonome'
    }
  },
  {
    patterns: [/\b(capital\s+cost|cca|depreciation|class\s+\d+)\b/i],
    en: {
      legislation: 'Income Tax Act section 20 capital cost allowance depreciation',
      caseLaw: 'Tax Court capital cost allowance deduction'
    },
    fr: {
      legislation: 'Loi de l\'impôt sur le revenu article 20 déduction pour amortissement',
      caseLaw: 'Cour canadienne de l\'impôt déduction pour amortissement'
    }
  },
  {
    patterns: [/\b(home\s+office|work\s+from\s+home|business[- ]use[- ]of[- ]home)\b/i],
    en: {
      legislation: 'Income Tax Act section 18 home office business use of home expense',
      caseLaw: 'Tax Court home office expense deduction'
    },
    fr: {
      legislation: 'Loi de l\'impôt sur le revenu bureau à domicile dépenses',
      caseLaw: 'Cour canadienne de l\'impôt bureau à domicile'
    }
  },
  {
    patterns: [/\b(capital\s+gain|adjusted\s+cost\s+base|acb)\b/i],
    en: {
      legislation: 'Income Tax Act section 38 40 capital gain adjusted cost base',
      caseLaw: 'Tax Court capital gain adjusted cost base'
    },
    fr: {
      legislation: 'Loi de l\'impôt sur le revenu gain en capital coût rajusté',
      caseLaw: 'Cour canadienne de l\'impôt gain en capital'
    }
  },
  {
    patterns: [/\b(rrsp|tfsa|fhsa|registered\s+account)\b/i],
    en: {
      legislation: 'Income Tax Act registered retirement savings plan tax-free savings account',
      caseLaw: 'Tax Court registered plan contribution'
    },
    fr: {
      legislation: 'Loi de l\'impôt sur le revenu REER CELI compte enregistré',
      caseLaw: 'Cour canadienne de l\'impôt régime enregistré'
    }
  },
  {
    patterns: [/\b(gaar|anti[- ]avoidance|tax\s+avoidance)\b/i],
    en: {
      legislation: 'Income Tax Act section 245 general anti-avoidance rule',
      caseLaw: 'Tax Court general anti-avoidance rule GAAR'
    },
    fr: {
      legislation: 'Loi de l\'impôt sur le revenu article 245 évasion fiscale',
      caseLaw: 'Cour canadienne de l\'impôt règle générale anti-évitement'
    }
  }
]

function normalizeWhitespace (text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function combinedText (parts) {
  return normalizeWhitespace(parts.filter(Boolean).join(' ')).toLowerCase()
}

function hasTaxSignal (text, terms = TAX_SIGNAL_TERMS) {
  const lower = combinedText([text])
  return terms.some((term) => lower.includes(term))
}

function isTrustedFederalTaxCaseLawUrl (url, title = '') {
  return isFederalTaxCaseLawUrl(url, title)
}

/**
 * @param {string} message
 * @param {'en' | 'fr'} language
 */
export function inferLegalSearchContext (message, language = 'en') {
  const text = String(message || '')
  const lang = language === 'fr' ? 'fr' : 'en'

  for (const hint of LEGISLATION_TOPIC_HINTS) {
    if (hint.patterns.some((pattern) => pattern.test(text))) {
      return {
        legislationQuery: hint[lang].legislation,
        caseLawQuery: hint[lang].caseLaw,
        matchedTopic: true
      }
    }
  }

  const topic = text.slice(0, 180)
  if (lang === 'fr') {
    return {
      legislationQuery: `Loi de l'impôt sur le revenu Canada disposition ${topic}`,
      caseLawQuery: `Cour canadienne de l'impôt décision impôt ${topic}`,
      matchedTopic: false
    }
  }

  return {
    legislationQuery: `Canada Income Tax Act provision ${topic}`,
    caseLawQuery: `Canada Tax Court of Canada income tax decision ${topic}`,
    matchedTopic: false
  }
}

/**
 * Federal tax case law URLs only — excludes provincial family/civil court documents.
 * @param {string} url
 * @param {string} [title]
 */
export function isFederalTaxCaseLawUrl (url, title = '') {
  const value = String(url || '')
  const normalizedTitle = String(title || '')

  if (/decisions\.(fct-cf|fca-caf)\.gc\.ca/i.test(value)) return true
  if (/taxcourt\.gc\.ca/i.test(value)) return true
  if (/scc-csc\.lexum\.com/i.test(value)) return true

  if (/canlii\.(org|ca)\/(?:en|fr)\/(?:ca\/)?(tcc|fca|fct|scc|citt)\/(?:doc|dec)\//i.test(value)) {
    return true
  }

  if (/canlii\.(org|ca).*\b(20\d{2})(tcc|fca|fct)\d+/i.test(value)) {
    return true
  }

  if (/canlii\.(org|ca)\/t\/\d+/i.test(value)) {
    return true
  }

  if (
    /canlii\.(org|ca)/i.test(value) &&
    /\bv\.\s*(the\s+)?(queen|crown|canada|m\.?n\.?r\.?|minister)/i.test(normalizedTitle)
  ) {
    return true
  }

  const canliiCourtMatch = value.match(
    /canlii\.(org|ca)\/(?:en|fr)\/(?:ca\/)?(tcc|fca|fct|scc|citt)\b/i
  )
  if (canliiCourtMatch) {
    return FEDERAL_TAX_CANLII_COURTS.has(canliiCourtMatch[2].toLowerCase())
  }

  return false
}

/**
 * @param {{
 *   url?: string
 *   title?: string
 *   excerpt?: string
 *   snippet?: string
 *   bucket?: 'legislation' | 'case_law'
 * }} input
 */
export function isRelevantTaxLegalSource (input = {}) {
  const url = String(input.url || '')
  const title = String(input.title || '')
  const excerpt = String(input.excerpt || '')
  const snippet = String(input.snippet || '')
  const bucket = input.bucket || 'legislation'
  const blob = combinedText([title, excerpt, snippet, url])

  if (bucket === 'case_law') {
    if (IRRELEVANT_CASE_LAW_PATTERNS.some((pattern) => pattern.test(blob))) {
      return false
    }
    if (!isTrustedFederalTaxCaseLawUrl(url, title)) {
      return false
    }
    return true
  }

  if (bucket === 'legislation') {
    if (IRRELEVANT_CASE_LAW_PATTERNS.some((pattern) => pattern.test(title))) {
      return false
    }
    if (/\.pdf$/i.test(url) && !hasTaxSignal(blob)) {
      return false
    }
    return hasTaxSignal(blob) || /income\s+tax\s+act|loi.*impôt|laws-lois\.justice/i.test(blob)
  }

  return false
}

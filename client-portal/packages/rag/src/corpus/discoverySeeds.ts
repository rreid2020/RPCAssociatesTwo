import type { SourceCategory, SourceType } from '@shared/types'
import type { PageKind } from '@shared/types'

export const CRA_PUBLICATIONS_CATALOG_URL =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications.html'

export type CorpusDiscoverySeed = {
  key: string
  url: string
  title: string
  sourceType: SourceType
  category: SourceCategory
  pageKind: PageKind
  priority: 'high' | 'medium' | 'low'
}

/** Single authoritative CRA corpus seed: the numbered publications catalogue. */
export const CRA_PUBLICATIONS_CATALOG_SEED: CorpusDiscoverySeed = {
  key: 'publications_catalog',
  url: CRA_PUBLICATIONS_CATALOG_URL,
  title: 'CRA Publications by Number',
  sourceType: 'html',
  category: 'publication',
  pageKind: 'directory',
  priority: 'high'
}

export const CRA_TECHNICAL_INFORMATION_URL =
  'https://www.canada.ca/en/revenue-agency/services/tax/technical-information.html'

export const CRA_INCOME_TAX_TECHNICAL_URL =
  'https://www.canada.ca/en/revenue-agency/services/tax/technical-information/income-tax.html'

export const CRA_INCOME_TAX_FOLIOS_INDEX_URL =
  'https://www.canada.ca/en/revenue-agency/services/tax/technical-information/income-tax/income-tax-folios-index.html'

/**
 * Income Tax Folio chapters (S#-F#-C#) are not listed in publications.html.
 * They live under CRA technical information and must be discovered from these seeds.
 */
export const CRA_FOLIO_DISCOVERY_SEEDS: CorpusDiscoverySeed[] = [
  {
    key: 'income_tax_folios_index',
    url: CRA_INCOME_TAX_FOLIOS_INDEX_URL,
    title: 'CRA Income Tax Folios Index',
    sourceType: 'cra_folio_directory',
    category: 'folio',
    pageKind: 'directory',
    priority: 'high'
  },
  {
    key: 'technical_information_income_tax',
    url: CRA_INCOME_TAX_TECHNICAL_URL,
    title: 'CRA Technical Information — Income Tax',
    sourceType: 'cra_folio_directory',
    category: 'folio',
    pageKind: 'directory',
    priority: 'high'
  },
  {
    key: 'technical_information_hub',
    url: CRA_TECHNICAL_INFORMATION_URL,
    title: 'CRA Technical Tax Information',
    sourceType: 'cra_folio_directory',
    category: 'folio',
    pageKind: 'directory',
    priority: 'medium'
  }
]

export const CANLII_TAX_COURT_URL = 'https://www.canlii.org/en/ca/tcc/'

/** CanLII Tax Court seed — API metadata discovery only; ingest indexes metadata, not full text. */
export const CANLII_TAX_COURT_SEED: CorpusDiscoverySeed = {
  key: 'canlii_tax_court',
  url: CANLII_TAX_COURT_URL,
  title: 'CanLII — Tax Court of Canada (2010–present)',
  sourceType: 'canlii_decision',
  category: 'case_law',
  pageKind: 'directory',
  priority: 'high'
}

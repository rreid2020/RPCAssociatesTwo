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

export const CANLII_TAX_COURT_URL = 'https://www.canlii.org/en/ca/tcc/'

/** CanLII Tax Court of Canada seed (2010–present via API discovery). */
export const CANLII_TAX_COURT_SEED: CorpusDiscoverySeed = {
  key: 'canlii_tax_court',
  url: CANLII_TAX_COURT_URL,
  title: 'CanLII — Tax Court of Canada (2010–present)',
  sourceType: 'canlii_decision',
  category: 'case_law',
  pageKind: 'directory',
  priority: 'high'
}

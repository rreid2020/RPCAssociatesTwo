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

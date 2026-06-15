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

export const CRA_FORMS_CATALOG_URL =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/forms.html'

/** Authoritative CRA forms catalogue — metadata lands in taxgpt.form_registry, not per-form RAG sources. */
export const CRA_FORMS_CATALOG_SEED: CorpusDiscoverySeed = {
  key: 'forms_catalog',
  url: CRA_FORMS_CATALOG_URL,
  title: 'CRA Forms by Number',
  sourceType: 'html',
  category: 'form',
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

/** Authoritative CRA pages for federal/provincial bracket tables and indexation amounts. */
export const CRA_CANADIAN_INCOME_TAX_RATES_URL =
  'https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html'

export const CRA_INDEXATION_ADJUSTMENT_URL =
  'https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/adjustment-personal-income-tax-benefit-amounts.html'

/** T1 General Income Tax and Benefit Package — authoritative for filing deadlines and return completion. */
export const CRA_T1_GENERAL_PACKAGE_URL =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/5000-g.html'

/** Index of all personal income tax packages by year (links to current and prior T1 packages). */
export const CRA_TAX_PACKAGES_YEARS_URL =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years.html'

export const CRA_TAX_REFERENCE_CONTENT_SEEDS: CorpusDiscoverySeed[] = [
  {
    key: 'canadian_income_tax_rates',
    url: CRA_CANADIAN_INCOME_TAX_RATES_URL,
    title: 'Canadian income tax rates for individuals - current and previous years',
    sourceType: 'html',
    category: 'guide',
    pageKind: 'content',
    priority: 'high'
  },
  {
    key: 'indexation_adjustment_amounts',
    url: CRA_INDEXATION_ADJUSTMENT_URL,
    title: 'Indexation adjustment for personal income tax and benefit amounts',
    sourceType: 'html',
    category: 'guide',
    pageKind: 'content',
    priority: 'high'
  },
  {
    key: 't1_general_income_tax_package',
    url: CRA_T1_GENERAL_PACKAGE_URL,
    title: 'Federal Income Tax and Benefit Information - General Income Tax and Benefit Package (5000-G)',
    sourceType: 'html',
    category: 'guide',
    pageKind: 'content',
    priority: 'high'
  },
  {
    key: 'tax_packages_years_index',
    url: CRA_TAX_PACKAGES_YEARS_URL,
    title: 'All personal income tax packages',
    sourceType: 'html',
    category: 'guide',
    pageKind: 'content',
    priority: 'high'
  }
]

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

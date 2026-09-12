/**
 * First-byte SEO for the marketing SPA.
 * Google and social scrapers receive the homepage shell unless Express
 * rewrites title/canonical/description for the requested path.
 */
export const SITE_ORIGIN = 'https://axiomft.ca'

const HOME_TITLE = 'Ottawa Accountant | Accounting, Advisory & Client Portal | Axiom'
const HOME_DESCRIPTION =
  'CPA-led accounting, bookkeeping, tax planning, and fractional controller services in Ottawa. Secure client portal and practical systems for Canadian businesses.'

export const ROUTE_META = {
  '/': {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    h1: 'Ottawa accounting, advisory, and systems for growing Canadian businesses.',
  },
  '/services': {
    title: 'Our Services | Accounting, Consulting & Tech Solutions | Axiom',
    description:
      'Accounting, bookkeeping, tax planning, cash flow forecasting, fractional controller, and systems work for Canadian businesses. CPA-led services from Ottawa.',
    h1: 'Accounting, consulting, and technology services',
  },
  '/services/core-accounting': {
    title: 'Core Accounting & Cloud Bookkeeping | Ottawa | Axiom',
    description:
      'Cloud bookkeeping, bank reconciliations, monthly statements, and HST/GST support for Ottawa and Canadian businesses.',
    h1: 'Core Accounting & Cloud Bookkeeping',
  },
  '/services/year-end-reporting': {
    title: 'Year-End Financials & Reporting | Ottawa | Axiom',
    description:
      'Year-end adjustments, working papers, and management-ready financial reports for Canadian businesses, prepared in Ottawa.',
    h1: 'Year-End Financials & Reporting',
  },
  '/services/tax-planning': {
    title: 'Tax Planning & Compliance Support | Ottawa | Axiom',
    description:
      'Tax planning for self-employed owners and corporations, filing support, and coordination with your tax preparer.',
    h1: 'Tax Planning & Compliance Support',
  },
  '/services/cash-flow-planning': {
    title: 'Cash Flow Planning & Forecasting | Ottawa | Axiom',
    description:
      'Cash flow analysis, 13-week style forecasting, and planning for tax payments and growth decisions.',
    h1: 'Cash Flow Planning & Forecasting',
  },
  '/services/fractional-controller': {
    title: 'Fractional Controller | Fixed Scope, Published Price | Axiom',
    description:
      'Fixed-fee, fixed-scope fractional controller engagements starting with a Finance Function Review. Ottawa-based, CPA-led.',
    h1: 'Fractional Controller & Business Advisory',
  },
  '/services/tech-solutions': {
    title: 'Accounting Systems & Tech Solutions | Ottawa | Axiom',
    description:
      'Cloud accounting setup, workflow design, and automation that reduces manual close work for Canadian businesses.',
    h1: 'Accounting Systems & Tech Solutions',
  },
  '/services/icfm-icfr': {
    title: 'ICFM / ICFR Internal Controls | Ottawa | Axiom',
    description:
      'Design, document, test, and remediate internal controls over financial management and reporting, through SOX 404 readiness.',
    h1: 'Internal Controls over Financial Management & Reporting',
  },
  '/products/aro-suite': {
    title: 'ARO Suite | Asset Retirement Obligation Software | Axiom',
    description:
      'End-to-end ARO software for PS 3280, ASPE 3110, IFRS/IFRIC 1, and ASC 410-20 — measurement, close, roll-forward, disclosure, and audit evidence.',
    h1: 'Own the ARO process, end to end.',
  },
  '/client-portal': {
    title: 'Client Portal | Dashboard, TaxGPT & Secure Files | Axiom',
    description:
      'One secure workspace for dashboard status, TaxGPT research, document sharing, and accounting collaboration with Axiom.',
    h1: 'One secure workspace for everything we do together.',
  },
  '/book-consultation': {
    title: 'Book a Free Consultation | Ottawa Accountant | Axiom',
    description:
      'Schedule a free consultation with Axiom. Talk through accounting, advisory, ARO, or portal needs with a CPA in Ottawa.',
    h1: 'Book a consultation',
  },
  '/contact': {
    title: 'Contact an Ottawa Accountant | Axiom',
    description:
      'Contact Axiom Financial & Technology in Ottawa for accounting, advisory, and technology support. Phone 613-884-0208 or send a message.',
    h1: 'Contact',
  },
  '/resources': {
    title: 'Free Accounting Calculators, Templates & Guides | Axiom',
    description:
      'Free Canadian tax calculators, cash-flow tools, Excel templates, and ARO resources from Axiom in Ottawa.',
    h1: 'Resources',
  },
  '/resources/category/online-calculators': {
    title: 'Online Calculators | Canadian Tax & Finance Tools | Axiom',
    description:
      'Free online calculators for Canadian personal tax, cash flow, CCPC salary vs dividends, donations, and PS 3280 ARO recalculation.',
    h1: 'Online Calculators',
  },
  '/resources/category/excel-templates': {
    title: 'Excel Templates for Accounting & Cash Flow | Axiom',
    description:
      'Download Excel templates for cash-flow statements, ICFM/ICFR work, and financial reporting from Axiom.',
    h1: 'Excel Templates & Tools',
  },
  '/resources/category/publications': {
    title: 'Accounting & Tax Publications | Axiom',
    description:
      'Guides and publications on Canadian accounting, tax, and financial ratios from Axiom.',
    h1: 'Publications',
  },
  '/resources/canadian-personal-income-tax-calculator': {
    title: 'Canadian Personal Income Tax Calculator 2025 | Axiom',
    description:
      'Estimate 2025 Canadian personal income tax with federal and provincial breakdowns. Free calculator from Axiom.',
    h1: 'Canadian Personal Income Tax Calculator',
  },
  '/resources/cash-flow-calculator': {
    title: 'Cash Flow Calculator | Axiom',
    description:
      'Model cash inflows and outflows and see how timing affects liquidity. Free cash-flow calculator from Axiom.',
    h1: 'Cash Flow Calculator',
  },
  '/resources/cash-flow-statement-direct-method': {
    title: 'Cash Flow Statement Direct Method | Axiom',
    description:
      'Build a direct-method cash flow statement online. Free tool for Canadian businesses from Axiom.',
    h1: 'Cash Flow Statement — Direct Method',
  },
  '/resources/donation-credit-optimizer': {
    title: 'Donation Credit Optimizer | Canadian Tax | Axiom',
    description:
      'Optimize charitable donation tax credits for Canadian personal tax. Free calculator from Axiom.',
    h1: 'Donation Credit Optimizer',
  },
  '/resources/ccpc-salary-dividend-calculator': {
    title: 'CCPC Salary vs Dividend Planner | Axiom',
    description:
      'Compare salary, dividends, and retained earnings for a Canadian CCPC owner-manager. Free tax planner from Axiom.',
    h1: 'CCPC Salary & Dividend Planner',
  },
  '/resources/aro-recalculation': {
    title: 'ARO Recalculation Tool | Independent PS 3280 Check | Axiom',
    description:
      'Free independent recalculation of PS 3280 asset retirement obligation balances, compared line by line against your own records.',
    h1: 'ARO Recalculation Tool',
  },
  '/resources/cash-flow-statement-template': {
    title: 'Cash Flow Statement Excel Template | Axiom',
    description:
      'Download a cash-flow statement Excel template to track liquidity and plan major expenditures.',
    h1: 'Cash Flow Statement Template',
  },
  '/resources/icfm-icfr-templates': {
    title: 'ICFM / ICFR Process Templates | Axiom',
    description:
      'Download ICFM and ICFR process templates for risk and control documentation from Axiom.',
    h1: 'ICFM / ICFR Templates',
  },
  '/resources/cfi-financial-ratios-guide': {
    title: 'Financial Ratios Guide | Axiom',
    description:
      'A practical guide to financial ratios for Canadian businesses, published by Axiom.',
    h1: 'Financial Ratios Guide',
  },
  '/articles': {
    title: 'Articles on Canadian Tax, Accounting & Technology | Axiom',
    description:
      'Insights on Canadian tax, accounting, and technology from Axiom Financial & Technology in Ottawa.',
    h1: 'Articles',
  },
  '/articles/category/canadian-tax': {
    title: 'Canadian Tax Articles | Axiom',
    description: 'Canadian tax articles and practical guidance from Axiom.',
    h1: 'Canadian Tax',
  },
  '/articles/category/accounting': {
    title: 'Accounting Articles | Axiom',
    description: 'Accounting articles and practice notes from Axiom.',
    h1: 'Accounting',
  },
  '/articles/category/technology': {
    title: 'Technology Articles | Axiom',
    description: 'Technology and automation articles for finance teams from Axiom.',
    h1: 'Technology',
  },
  '/privacy': {
    title: 'Privacy Policy | Axiom',
    description: 'Privacy policy for Axiom Financial & Technology and axiomft.ca.',
    h1: 'Privacy Policy',
  },
  '/terms': {
    title: 'Terms of Use | Axiom',
    description: 'Terms of use for the Axiom website and client portal.',
    h1: 'Terms of Use',
  },
  '/sitemap': {
    title: 'Site Map | Axiom',
    description: 'Complete site map of Axiom Financial & Technology public pages.',
    h1: 'Site Map',
  },
}

const PREFIX_RULES = [
  {
    test: (pathname) => pathname === '/portal' || pathname.startsWith('/portal/') || pathname === '/app' || pathname.startsWith('/app/'),
    meta: {
      title: 'Client Portal | Axiom',
      description: 'Secure Axiom client portal. Sign in to access your workspace.',
      h1: 'Client Portal',
      noIndex: true,
    },
  },
  {
    test: (pathname) => pathname.startsWith('/articles/'),
    meta: {
      title: 'Article | Canadian Tax, Accounting & Technology | Axiom',
      description: 'Insights on Canadian tax, accounting, and technology from Axiom Financial & Technology.',
      h1: 'Article',
    },
  },
  {
    test: (pathname) => pathname.startsWith('/resources/'),
    meta: {
      title: 'Resources | Axiom',
      description: 'Free calculators, templates, and guides from Axiom Financial & Technology.',
      h1: 'Resource',
    },
  },
  {
    test: (pathname) => pathname.startsWith('/services/'),
    meta: {
      title: 'Services | Ottawa Accounting | Axiom',
      description: 'CPA-led accounting and advisory services from Axiom in Ottawa.',
      h1: 'Services',
    },
  },
]

export function normalizePathname (rawPath = '/') {
  const pathOnly = String(rawPath || '/').split('?')[0].split('#')[0]
  if (!pathOnly || pathOnly === '/') return '/'
  const withSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`
  return withSlash.replace(/\/+$/, '') || '/'
}

export function resolveRouteMeta (rawPath = '/') {
  const pathname = normalizePathname(rawPath)
  const exact = ROUTE_META[pathname]
  if (exact) {
    return { path: pathname, noIndex: false, ...exact }
  }
  for (const rule of PREFIX_RULES) {
    if (rule.test(pathname)) {
      return { path: pathname, noIndex: false, ...rule.meta }
    }
  }
  return {
    path: pathname,
    noIndex: false,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    h1: 'Axiom Financial & Technology',
  }
}

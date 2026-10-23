export type ProductSummary = {
  slug: string
  title: string
  intro: string
  href: string
  icon: 'aro-suite' | 'portfolio-analyst' | 'projectcost'
}

export const products: ProductSummary[] = [
  {
    slug: 'aro-suite',
    title: 'ARO Suite',
    intro:
      'End-to-end asset retirement obligation measurement, close, roll-forward, and disclosure across four reporting frameworks.',
    href: '/products/aro-suite',
    icon: 'aro-suite',
  },
  {
    slug: 'portfolio-analyst',
    title: 'Portfolio Analyst',
    intro:
      'Every TFSA, RRSP and non-registered account in one dashboard, with a rebalancer and an AI analyst.',
    href: '/products/portfolio-analyst',
    icon: 'portfolio-analyst',
  },
  {
    slug: 'projectcost',
    title: 'ProjectCost',
    intro:
      'Job costing, WIP schedules and month-end entries on top of QuickBooks, Sage, Xero or spreadsheets.',
    href: '/products/projectcost',
    icon: 'projectcost',
  },
]

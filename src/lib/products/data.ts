export type ProductSummary = {
  slug: string
  title: string
  intro: string
  href: string
  icon: 'aro-suite'
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
]

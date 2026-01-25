export interface ResourceCategory {
  slug: string
  title: string
  description: string
  icon: string
  metaDescription: string
}

export const resourceCategories: ResourceCategory[] = [
  {
    slug: 'online-calculators',
    title: 'Online Calculators',
    description: 'Interactive tools to help you calculate taxes, plan finances, and make informed decisions.',
    icon: 'calculator',
    metaDescription: 'Free online calculators for Canadian income tax, financial planning, and business calculations. Accurate, easy-to-use tools from RPC Associates.'
  },
  {
    slug: 'excel-templates',
    title: 'Excel Templates & Tools',
    description: 'Professional Excel templates and tools to streamline your financial tracking and reporting.',
    icon: 'excel',
    metaDescription: 'Download free Excel templates for cash flow statements, financial planning, and business reporting. Professional-grade tools from RPC Associates.'
  },
  {
    slug: 'publications',
    title: 'Publications',
    description: 'Guides, articles, and resources to help you understand accounting, tax, and business topics.',
    icon: 'publications',
    metaDescription: 'Access guides, publications, and resources on Canadian accounting, tax planning, and business consulting from RPC Associates.'
  }
]

export const getResourceCategoryBySlug = (slug: string): ResourceCategory | undefined => {
  return resourceCategories.find(category => category.slug === slug)
}

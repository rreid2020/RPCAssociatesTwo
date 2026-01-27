import { SPACES_FILES } from '../config/spaces'

export interface ResourceDetail {
  slug: string
  title: string
  shortDescription: string
  longDescription: string
  category: 'calculator' | 'excel-template' | 'publication'
  categoryLabel: string
  downloadUrl?: string
  fileName?: string
  fileSize?: string
  requiresLeadCapture: boolean
  benefits?: string[]
  features?: string[]
  metaDescription: string
  keywords: string[]
}

export const resources: ResourceDetail[] = [
  {
    slug: 'canadian-personal-income-tax-calculator',
    title: 'Canadian Personal Income Tax Calculator',
    shortDescription: 'Calculate your estimated Canadian income tax for 2025. Get a detailed breakdown including federal and provincial taxes, credits, and deductions.',
    longDescription: 'Our comprehensive Canadian Personal Income Tax Calculator helps you estimate your tax liability for the 2025 tax year. Get detailed breakdowns of federal and provincial taxes, understand how credits and deductions affect your bottom line, and plan ahead for tax season. This free tool provides accurate calculations based on current Canadian tax rates and regulations.',
    category: 'calculator',
    categoryLabel: 'Calculator',
    requiresLeadCapture: false,
    benefits: [
      'Accurate calculations based on 2025 Canadian tax rates',
      'Detailed breakdown of federal and provincial taxes',
      'Understand how credits and deductions impact your taxes',
      'Plan ahead for tax season',
      'Free to use with no registration required'
    ],
    metaDescription: 'Free Canadian Personal Income Tax Calculator for 2025. Calculate your estimated taxes with detailed breakdowns of federal and provincial taxes, credits, and deductions.',
    keywords: ['tax calculator', 'Canadian tax', 'income tax calculator', 'tax planning', 'Ottawa']
  },
  {
    slug: 'cash-flow-calculator',
    title: 'Cash Flow Calculator',
    shortDescription: 'Calculate your business cash flow by tracking operating, investing, and financing activities. Understand your cash position and liquidity.',
    longDescription: 'Track your business cash flow with our comprehensive calculator. Monitor operating activities, investing activities, and financing activities to understand your cash position and liquidity. This tool helps you identify cash flow trends, plan for major expenditures, and make informed financial decisions for your business.',
    category: 'calculator',
    categoryLabel: 'Calculator',
    requiresLeadCapture: false,
    benefits: [
      'Track operating, investing, and financing activities',
      'Understand your cash position and liquidity',
      'Identify cash flow trends',
      'Plan for major expenditures',
      'Make informed financial decisions'
    ],
    metaDescription: 'Free business cash flow calculator. Track operating, investing, and financing activities to understand your cash position and liquidity.',
    keywords: ['cash flow calculator', 'business cash flow', 'financial planning', 'liquidity', 'Ottawa']
  },
  {
    slug: 'cash-flow-statement-template',
    title: 'Cash Flow Statement Template',
    shortDescription: 'Track cash inflows and outflows with this comprehensive Excel template. Monitor liquidity, plan for major expenditures, and make informed financial decisions.',
    longDescription: 'Our professional Cash Flow Statement Template helps you track cash inflows and outflows for your business. Monitor liquidity, plan for major expenditures, and make informed financial decisions. This comprehensive Excel template is designed for small and owner-managed businesses, emphasizing clarity, practicality, and customizability.',
    category: 'excel-template',
    categoryLabel: 'Excel Template',
    downloadUrl: SPACES_FILES.cashFlowTemplate,
    fileName: 'RPC Cash Flow Statement.xlsx',
    requiresLeadCapture: true,
    benefits: [
      'Track cash inflows and outflows',
      'Monitor liquidity and cash position',
      'Plan for major expenditures',
      'Professional Excel template format',
      'Customizable to your business needs'
    ],
    features: [
      'Operating activities tracking',
      'Investing activities tracking',
      'Financing activities tracking',
      'Beginning and ending cash balance',
      'Easy-to-use Excel format'
    ],
    metaDescription: 'Free Cash Flow Statement Excel template. Track cash inflows and outflows, monitor liquidity, and make informed financial decisions for your business.',
    keywords: ['cash flow template', 'Excel template', 'financial planning', 'cash flow statement', 'Ottawa']
  },
  {
    slug: 'cfi-financial-ratios-guide',
    title: 'CFI Financial Ratios Guide',
    shortDescription: 'Comprehensive guide covering key financial ratios, their calculations, and how to interpret them for business analysis and decision-making.',
    longDescription: 'This comprehensive 40+ page guide from Corporate Finance Institute (CFI) covers key financial ratios, their calculations, and how to interpret them for business analysis and decision-making. Learn about liquidity ratios, profitability ratios, efficiency ratios, and leverage ratios. Understand how to use these ratios to assess your business performance, compare against industry standards, and make informed financial decisions. This definitive guide is an essential resource for business owners, financial analysts, and accounting professionals who want to master financial ratio analysis.',
    category: 'publication',
    categoryLabel: 'Guide',
    downloadUrl: SPACES_FILES.financialRatiosGuide,
    fileName: 'CFI-Financial-Ratios-Definitive-Guide.pdf',
    fileSize: '44.6 MB',
    requiresLeadCapture: true,
    benefits: [
      'Understand key financial ratios and their calculations',
      'Learn how to interpret ratios for business analysis',
      'Compare your business against industry standards',
      'Make informed financial decisions',
      'Comprehensive 40+ page guide from CFI',
      'Essential resource for business owners and financial professionals'
    ],
    features: [
      'Liquidity ratios explained (current ratio, quick ratio, cash ratio)',
      'Profitability ratios explained (gross margin, net margin, ROE, ROA)',
      'Efficiency ratios explained (asset turnover, inventory turnover)',
      'Leverage ratios explained (debt-to-equity, debt-to-assets)',
      'Industry benchmarks and comparisons',
      'Real-world examples and case studies',
      'Step-by-step calculation formulas',
      'Interpretation guidelines for each ratio type'
    ],
    metaDescription: 'Free comprehensive guide to financial ratios from CFI. Learn how to calculate and interpret key financial ratios for business analysis and decision-making. Essential resource for business owners and accounting professionals.',
    keywords: ['financial ratios', 'business analysis', 'financial ratios guide', 'accounting guide', 'CFI guide', 'financial analysis', 'Ottawa']
  }
]

export const getResourceBySlug = (slug: string): ResourceDetail | undefined => {
  return resources.find(resource => resource.slug === slug)
}

export const getResourcesByCategory = (category: 'calculator' | 'excel-template' | 'publication'): ResourceDetail[] => {
  return resources.filter(resource => resource.category === category)
}

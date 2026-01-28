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
    longDescription: `A cash flow statement (also referred to as a statement of cash flows) summarizes how cash moves through a business over a specific period—where cash came from and how it was used. In this context, "cash" generally includes funds held in operating bank accounts, not just physical currency.

This statement is most effective when reviewed alongside the income statement and balance sheet, as each report answers a different financial question:
• Income statement: profitability
• Balance sheet: financial position
• Cash flow statement: liquidity and timing
Together, they provide a complete financial picture.

**Why Cash Flow Matters**

Profit does not equal cash. A business can be profitable on paper while still facing cash shortages due to timing differences such as:
• Delayed customer collections
• Payroll and supplier payments occurring before revenue is received
• Inventory purchases
• Loan repayments
• Income tax instalments

A cash flow statement helps business owners and decision-makers:
• Monitor liquidity and short-term solvency
• Identify operational cash pressure early
• Plan for major expenditures and financing needs
• Support discussions with lenders, investors, and advisors
• Build realistic cash flow forecasts and budgets

**What This Template Is Designed to Do**

This template is designed for small and owner-managed businesses that want a clear, practical cash flow statement they can understand, maintain, and customize. It can be adapted to match your chart of accounts and reporting needs, whether you are:
• Monitoring monthly cash flow
• Comparing year-over-year cash performance
• Preparing internal management reports
• Supporting financing or planning discussions

**The Three Core Sections of a Cash Flow Statement**

Most cash flow statements are organized into three standard sections:

**1) Operating Activities**
Cash generated or used in day-to-day business operations, including cash received from customers, payments to suppliers, payroll and employee benefits, and rent, utilities, and other operating expenses. This section reflects the cash impact of core business activities and is closely tied to working capital management.

**2) Investing Activities**
Cash related to the acquisition or disposal of long-term assets, such as equipment and machinery purchases, property and capital asset transactions, and certain investments or loans made by the business. These activities typically reflect longer-term strategic decisions.

**3) Financing Activities**
Cash flows associated with funding the business, including loan proceeds and repayments, owner contributions or withdrawals, equity transactions, and dividends or profit distributions (where applicable). This section explains how the business is financed and how capital is returned to lenders or owners.

**Practical Guidance for Using the Template**

For many small businesses, the most straightforward approach is to build the cash flow statement directly from actual cash transactions, categorizing each inflow and outflow into operating, investing, or financing activities. Businesses with well-maintained accounting records may also prepare cash flow statements using accounting data, but this approach depends on accurate and consistent bookkeeping across the income statement and balance sheet.

**Common Use Cases**
• Monthly cash flow monitoring
• Identifying seasonal cash patterns
• Planning for tax payments and instalments
• Evaluating hiring decisions or expansion plans
• Preparing lender-ready financial information (when paired with a balance sheet and income statement)

**Important Note**

This resource is provided for general informational purposes only and does not constitute accounting, tax, or financial advice. Professional guidance may be required depending on your specific circumstances and reporting needs.`,
    category: 'excel-template',
    categoryLabel: 'Excel Template',
    downloadUrl: SPACES_FILES.cashFlowTemplate,
    fileName: 'RPC Cash Flow Statement.xlsx',
    requiresLeadCapture: true,
    benefits: [
      'Monitor liquidity and short-term solvency',
      'Identify operational cash pressure early',
      'Plan for major expenditures and financing needs',
      'Support discussions with lenders, investors, and advisors',
      'Build realistic cash flow forecasts and budgets',
      'Understand the difference between profit and cash'
    ],
    features: [
      'Operating activities tracking (cash from customers, payments to suppliers, payroll)',
      'Investing activities tracking (equipment purchases, property transactions)',
      'Financing activities tracking (loans, owner contributions, equity)',
      'Customizable line items and categories',
      'Flexible structure for detailed or simplified reporting',
      'Ability to present multiple periods for comparison',
      'Designed for small and owner-managed businesses',
      'Easy-to-use Excel format'
    ],
    metaDescription: 'Free Cash Flow Statement Excel template for small businesses. Track operating, investing, and financing activities to monitor liquidity and make informed financial decisions.',
    keywords: ['cash flow template', 'Excel template', 'financial planning', 'cash flow statement', 'operating activities', 'investing activities', 'financing activities', 'liquidity', 'Ottawa']
  },
  {
    slug: 'cfi-financial-ratios-guide',
    title: 'CFI Financial Ratios Guide',
    shortDescription: 'Comprehensive guide covering key financial ratios, their calculations, and how to interpret them for business analysis and decision-making.',
    longDescription: `Financial ratios are powerful tools that transform raw financial data into meaningful insights about your business's performance, health, and potential. This comprehensive 40+ page guide from Corporate Finance Institute (CFI) provides a definitive resource for understanding, calculating, and interpreting the key financial ratios that drive informed business decisions.

Financial ratios allow you to:
• Assess your business's financial health and performance
• Compare your results against industry benchmarks and competitors
• Identify trends and potential issues before they become problems
• Make data-driven decisions about operations, investments, and financing
• Communicate your business's financial position to stakeholders, lenders, and investors

**Why Financial Ratios Matter**

Numbers alone don't tell the full story. A business with high revenue might still struggle with cash flow. A profitable company might be over-leveraged. Financial ratios provide context and reveal relationships between different aspects of your financial statements that raw numbers cannot.

Understanding financial ratios helps you:
• Identify strengths and weaknesses in your business operations
• Spot warning signs of financial distress early
• Benchmark your performance against industry standards
• Support strategic planning and goal setting
• Enhance credibility when seeking financing or investment
• Make more informed decisions about pricing, inventory, and capital allocation

**What This Guide Is Designed to Do**

This guide is designed for business owners, financial analysts, and accounting professionals who want to master financial ratio analysis. Whether you're analyzing your own business, evaluating investment opportunities, or preparing for lender meetings, this resource provides the knowledge and tools you need.

The guide covers:
• Step-by-step calculation formulas for each ratio
• Clear explanations of what each ratio measures
• Interpretation guidelines to understand what the numbers mean
• Industry benchmarks and typical ranges
• Real-world examples and case studies
• Common pitfalls and how to avoid them

**The Four Core Categories of Financial Ratios**

Financial ratios are typically organized into four main categories, each providing insights into different aspects of your business:

**1) Liquidity Ratios**

Liquidity ratios measure your business's ability to meet short-term obligations and convert assets to cash. Key ratios include the current ratio, quick ratio (acid-test), and cash ratio. These ratios help you understand whether you have sufficient liquid assets to cover immediate liabilities and maintain operations during cash flow fluctuations.

**2) Profitability Ratios**

Profitability ratios assess your business's ability to generate profits relative to revenue, assets, or equity. Common ratios include gross profit margin, net profit margin, return on assets (ROA), and return on equity (ROE). These ratios reveal how efficiently your business converts sales into profits and how effectively you're using your resources to generate returns.

**3) Efficiency Ratios**

Efficiency ratios (also called activity ratios) measure how effectively your business uses its assets and manages operations. Key ratios include asset turnover, inventory turnover, accounts receivable turnover, and accounts payable turnover. These ratios help identify operational strengths and areas where you can improve resource utilization and cash flow management.

**4) Leverage Ratios**

Leverage ratios evaluate your business's debt levels and ability to meet long-term financial obligations. Important ratios include debt-to-equity, debt-to-assets, interest coverage, and equity multiplier. These ratios help you understand your capital structure, assess financial risk, and determine your capacity to take on additional debt or financing.

**Practical Guidance for Using Financial Ratios**

Effective ratio analysis requires more than just calculating numbers. This guide provides practical strategies for:
• Selecting the most relevant ratios for your business type and industry
• Establishing baseline measurements and tracking trends over time
• Comparing your ratios against industry benchmarks and competitors
• Identifying red flags and areas requiring immediate attention
• Using ratio analysis to support strategic decision-making
• Presenting ratio analysis to stakeholders, lenders, and investors

**Common Use Cases**

Financial ratio analysis supports a wide range of business activities:
• Annual financial planning and budgeting
• Performance monitoring and management reporting
• Lender applications and credit assessments
• Investment evaluation and due diligence
• Operational improvement initiatives
• Benchmarking against industry standards
• Identifying opportunities for cost reduction or efficiency gains
• Supporting merger and acquisition decisions

**Important Note**

This resource is provided for general informational purposes only and does not constitute accounting, tax, or financial advice. Financial ratios are tools that provide insights, but they should be interpreted in context and considered alongside other qualitative and quantitative factors. Professional guidance from qualified accountants or financial advisors may be required depending on your specific circumstances and business needs.`,
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

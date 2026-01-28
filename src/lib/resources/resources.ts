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
    longDescription: `This comprehensive, practitioner-focused guide from Corporate Finance Institute (CFI) provides a structured framework for understanding, calculating, and interpreting the most important financial ratios used in professional financial analysis. Designed for analysts, accountants, finance leaders, lenders, and investors, this definitive resource offers a consistent, best-practice approach to evaluating business performance and financial health.

Financial ratio analysis transforms raw financial data into actionable insights that support:
• Investment and lending decisions
• Management performance evaluation
• Strategic planning and forecasting
• Credit risk assessment
• Valuation and M&A analysis
• Executive decision-making

**Financial Ratio Analysis: Foundations**

The guide begins by establishing why financial ratios matter and how they are used across corporate finance, banking, credit analysis, valuation, and executive decision-making. This foundational section explains:

What ratio analysis is and how it supports investment, lending, and management decisions

Why ratios are essential for comparing companies of different sizes and business models

The distinction between performance ratios and financial leverage ratios

How ratios are used by CFOs, bankers, rating agencies, and equity analysts

This section sets the conceptual foundation needed to interpret ratios correctly rather than treating them as isolated calculations, emphasizing that context and understanding drive meaningful analysis.

**A Best-Practice Framework for Ratio Analysis**

Rather than focusing only on formulas, the guide introduces a four-step professional workflow for effective ratio analysis:

Collect multiple years of financial statements

Calculate relevant ratios consistently

Interpret trends and underlying drivers

Benchmark results against peers and industry norms

The guide emphasizes trend analysis over single-period results, reinforcing that ratios are most powerful when viewed across time. This systematic approach ensures consistent, reliable analysis that supports sound decision-making.

**Return, Profitability, and Expense Ratios**

The guide provides in-depth coverage of ratios that measure how effectively a business generates profits and returns for shareholders and capital providers. Covered ratios include:

Return on Equity (ROE) – measures shareholder return

Return on Assets (ROA) – assesses asset efficiency

Return on Invested Capital (ROIC) – evaluates capital allocation

Gross Margin, Operating Profit Margin, and Net Profit Margin – analyze profitability at different levels

Interest burden and tax burden metrics – identify cost drivers

Each ratio is explained with clear definitions, formula logic, interpretation guidance, and industry context with comparative examples to help you understand what the numbers mean in practice.

**Asset Utilization (Efficiency) Ratios**

This section examines how efficiently a company uses its assets to generate revenue and manage working capital. Key ratios include:

Total asset turnover and Property, plant & equipment (PP&E) turnover

Cash turnover and cash days

Accounts receivable turnover and days

Inventory turnover and days

Accounts payable turnover and days

The guide explains why "days" metrics matter and how working-capital efficiency differs across industries and business models. Understanding these ratios helps identify operational strengths and opportunities for improvement in resource utilization.

**Solvency and Financial Leverage Ratios**

This section focuses on capital structure, debt risk, and long-term financial stability. Ratios covered include:

Total assets to equity

Debt to equity and Debt to tangible net worth

Debt to EBITDA

The guide explains how lenders, investors, and M&A professionals use these ratios to assess financial risk, debt capacity, creditworthiness, and capital structure efficiency. These metrics are critical for understanding a company's financial stability and ability to meet long-term obligations.

**Liquidity Ratios**

Liquidity ratios assess a company's ability to meet short-term obligations and manage near-term cash needs. Key ratios include:

Current ratio

Quick ratio (acid-test)

EBITDA to interest (interest coverage)

The guide emphasizes industry context, explaining why "healthy" liquidity levels vary widely between sectors such as retail, manufacturing, and technology. These ratios help identify potential cash flow challenges and assess short-term financial flexibility.

**Trend Analysis and Benchmarking**

This section focuses on how to extract insight from ratios, not just compute them. Key concepts include:

Horizontal (trend) analysis across multi-year periods

Recognizing growth, decline, volatility, and structural shifts

The importance of visualizing ratios to identify patterns

Industry benchmarking vs. peer-group benchmarking

Selecting appropriate peer companies based on business and financial characteristics

This section is particularly valuable for analysts involved in forecasting, valuation, and strategic planning, providing the tools needed to identify trends and make meaningful comparisons.

**The DuPont Pyramid of Ratios**

The guide concludes with an advanced analytical framework: the DuPont Pyramid. This section demonstrates how ROE can be broken down into profitability drivers, asset utilization efficiency, and financial leverage. Both the traditional three-lever model and the expanded five-lever model are explained, showing how operating margins, interest burden, and tax burden interact to drive shareholder returns. This framework provides a comprehensive view of what drives business performance and helps identify specific areas for improvement.

**Who This Guide Is For**

This guide is especially valuable for accountants and financial analysts, CFOs and finance managers, business owners and advisors, bankers and credit analysts, and investors and valuation professionals. It serves as both a reference guide and a training resource for consistent, professional financial analysis.

**Important Note**

This resource is provided for general informational purposes only and does not constitute accounting, tax, or financial advice. Financial ratios are analytical tools that provide insights, but they should be interpreted in context and considered alongside other qualitative and quantitative factors. Professional guidance from qualified accountants or financial advisors may be required depending on your specific circumstances and business needs.`,
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

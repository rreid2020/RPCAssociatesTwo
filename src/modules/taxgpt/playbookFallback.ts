import type { TaxgptPlaybook } from '../../domains/taxgpt'

export const TAXGPT_PLAYBOOK_FALLBACK: TaxgptPlaybook[] = [
  {
    id: 'rrsp-tfsa-mix',
    title: 'RRSP vs TFSA',
    prompt: 'How should I decide between RRSP and TFSA contributions for Canadian tax planning?',
    usageCount: 0
  },
  {
    id: 'fhsa-first-home',
    title: 'FHSA for first home',
    prompt: 'How does the First Home Savings Account (FHSA) work for tax planning compared with RRSP and TFSA?',
    usageCount: 0
  },
  {
    id: 'ccpc-salary-dividend',
    title: 'CCPC: salary vs dividend',
    prompt: 'How can a Canadian CCPC owner structure salary vs dividends to reduce overall tax?',
    usageCount: 0
  },
  {
    id: 'income-splitting',
    title: 'Income splitting',
    prompt: 'What are CRA-compliant income-splitting strategies for a Canadian family or small business?',
    usageCount: 0
  },
  {
    id: 'home-office-deduction',
    title: 'Home office deduction',
    prompt: 'What tax strategies and deductions apply when working from home in Canada?',
    usageCount: 0
  },
  {
    id: 'incorporation-timing',
    title: 'When to incorporate',
    prompt: 'What are the tax implications and planning considerations when incorporating a sole proprietorship in Canada?',
    usageCount: 0
  },
  {
    id: 'rental-property-tax',
    title: 'Rental property taxes',
    prompt: 'What tax strategies and deductions should a Canadian rental property owner consider?',
    usageCount: 0
  },
  {
    id: 'tax-loss-selling',
    title: 'Tax-loss selling',
    prompt: 'How does tax-loss selling work in Canada and what capital gains planning strategies should I know?',
    usageCount: 0
  },
  {
    id: 'self-employed-tax-savings',
    title: 'Self-employed tax savings',
    prompt: 'What are the most effective legal tax strategies for self-employed Canadians to reduce taxes?',
    usageCount: 0
  },
  {
    id: 'lifetime-cge',
    title: 'Lifetime capital gains exemption',
    prompt: 'How does the lifetime capital gains exemption work when selling shares of a qualified small business corporation?',
    usageCount: 0
  }
]

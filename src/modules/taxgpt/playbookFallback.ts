import type { TaxgptPlaybook } from '../../../domains/taxgpt'

export const TAXGPT_PLAYBOOK_FALLBACK: TaxgptPlaybook[] = [
  {
    id: 'ccpc-salary-dividend',
    title: 'CCPC: salary vs dividend',
    prompt: 'How can a Canadian CCPC owner structure salary vs dividends to reduce overall tax?',
    usageCount: 0
  },
  {
    id: 'lifetime-cge',
    title: 'Lifetime capital gains exemption',
    prompt: 'How does the lifetime capital gains exemption work for selling a qualified small business corporation share?',
    usageCount: 0
  },
  {
    id: 'income-splitting',
    title: 'Income splitting',
    prompt: 'What are CRA-compliant income-splitting strategies for a family business?',
    usageCount: 0
  },
  {
    id: 'incorporation-timing',
    title: 'When to incorporate',
    prompt: 'What are the tax implications and planning considerations when incorporating a sole proprietorship?',
    usageCount: 0
  },
  {
    id: 'rrsp-tfsa-mix',
    title: 'RRSP vs TFSA mix',
    prompt: 'How should I think about RRSP versus TFSA contributions for tax planning?',
    usageCount: 0
  },
  {
    id: 'rental-holdco',
    title: 'Rental / holdco structure',
    prompt: 'What are common tax structuring considerations for rental property or a holdco?',
    usageCount: 0
  },
  {
    id: 'estate-succession',
    title: 'Estate / succession planning',
    prompt: 'What tax strategies should a Canadian business owner consider for succession or estate planning?',
    usageCount: 0
  },
  {
    id: 'stock-options',
    title: 'Stock options / equity comp',
    prompt: 'How are stock options taxed in Canada and what planning considerations apply?',
    usageCount: 0
  }
]

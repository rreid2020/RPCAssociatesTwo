export type SlipTarget = {
  kind: 'income' | 'deduction'
  category: string
  description: string
  lineRef?: string
  scheduleRef?: string
  asWithholding?: boolean
}

export type SlipBoxDefinition = {
  code: string
  label: string
  type: 'currency' | 'number'
  targets: SlipTarget[]
}

export type SlipDefinition = {
  code: string
  name: string
  payerLabel: string
  boxes: SlipBoxDefinition[]
}

const noTarget: SlipTarget[] = []

export const SLIP_DEFINITIONS: SlipDefinition[] = [
  {
    code: 'T4',
    name: 'Statement of Remuneration Paid',
    payerLabel: 'Employer name',
    boxes: [
      { code: '14', label: 'Employment income', type: 'currency', targets: [{ kind: 'income', category: 'employment_income', description: 'T4 box 14 employment income', lineRef: '10100' }] },
      { code: '16', label: 'Employee CPP contributions', type: 'currency', targets: [{ kind: 'deduction', category: 'cpp_contributions', description: 'T4 box 16 CPP contributions', lineRef: '30800' }] },
      { code: '16A', label: 'Employee second CPP contributions', type: 'currency', targets: [{ kind: 'deduction', category: 'cpp2_contributions', description: 'T4 box 16A CPP2 contributions', lineRef: '22215' }] },
      { code: '18', label: 'Employee EI premiums', type: 'currency', targets: [{ kind: 'deduction', category: 'ei_premiums', description: 'T4 box 18 EI premiums', lineRef: '31200' }] },
      { code: '22', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'T4 box 22 tax withheld', lineRef: '43700', asWithholding: true }] },
      { code: '44', label: 'Union dues', type: 'currency', targets: [{ kind: 'deduction', category: 'union_dues', description: 'T4 box 44 union dues', lineRef: '21200' }] }
    ]
  },
  {
    code: 'T5',
    name: 'Statement of Investment Income',
    payerLabel: 'Payer name',
    boxes: [
      { code: '13', label: 'Interest from Canadian sources', type: 'currency', targets: [{ kind: 'income', category: 'interest_income', description: 'T5 box 13 interest income', lineRef: '12100' }] },
      { code: '15', label: 'Eligible dividends', type: 'currency', targets: [{ kind: 'income', category: 'eligible_dividends', description: 'T5 box 15 eligible dividends', lineRef: '12000' }] },
      { code: '16', label: 'Taxable amount of eligible dividends', type: 'currency', targets: [{ kind: 'income', category: 'taxable_eligible_dividends', description: 'T5 box 16 taxable eligible dividends', lineRef: '12000' }] },
      { code: '24', label: 'Actual amount of dividends (other than eligible)', type: 'currency', targets: [{ kind: 'income', category: 'other_dividends', description: 'T5 box 24 other dividends', lineRef: '12010' }] },
      { code: '25', label: 'Taxable amount of dividends (other than eligible)', type: 'currency', targets: [{ kind: 'income', category: 'taxable_other_dividends', description: 'T5 box 25 taxable other dividends', lineRef: '12010' }] }
    ]
  },
  {
    code: 'T3',
    name: 'Statement of Trust Income Allocations and Designations',
    payerLabel: 'Trust name',
    boxes: [
      { code: '26', label: 'Other income', type: 'currency', targets: [{ kind: 'income', category: 'trust_other_income', description: 'T3 box 26 other income', lineRef: '13000' }] },
      { code: '30', label: 'Capital gains', type: 'currency', targets: [{ kind: 'income', category: 'capital_gains', description: 'T3 box 30 capital gains', lineRef: '12700', scheduleRef: 'Schedule 3' }] },
      { code: '32', label: 'Eligible dividends', type: 'currency', targets: [{ kind: 'income', category: 'eligible_dividends', description: 'T3 box 32 eligible dividends', lineRef: '12000' }] },
      { code: '49', label: 'AMT adjustment', type: 'currency', targets: noTarget }
    ]
  },
  {
    code: 'T4A',
    name: 'Statement of Pension, Retirement, Annuity, and Other Income',
    payerLabel: 'Payer name',
    boxes: [
      { code: '16', label: 'Pension or superannuation', type: 'currency', targets: [{ kind: 'income', category: 'pension_income', description: 'T4A box 16 pension income', lineRef: '11500' }] },
      { code: '18', label: 'Lump-sum payments', type: 'currency', targets: [{ kind: 'income', category: 'lump_sum_income', description: 'T4A box 18 lump-sum payments', lineRef: '13000' }] },
      { code: '20', label: 'Self-employed commissions', type: 'currency', targets: [{ kind: 'income', category: 'self_employed_commissions', description: 'T4A box 20 commissions', lineRef: '13499', scheduleRef: 'T2125' }] },
      { code: '22', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'T4A box 22 tax withheld', lineRef: '43700', asWithholding: true }] },
      { code: '48', label: 'Fees for services', type: 'currency', targets: [{ kind: 'income', category: 'professional_fees', description: 'T4A box 48 fees for services', lineRef: '13499', scheduleRef: 'T2125' }] }
    ]
  },
  {
    code: 'T4E',
    name: 'Statement of Employment Insurance and Other Benefits',
    payerLabel: 'Issuer name',
    boxes: [
      { code: '14', label: 'Total benefits paid', type: 'currency', targets: [{ kind: 'income', category: 'ei_benefits', description: 'T4E box 14 EI benefits', lineRef: '11900' }] },
      { code: '15', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'T4E box 15 tax withheld', lineRef: '43700', asWithholding: true }] },
      { code: '18', label: 'Repayment rate', type: 'number', targets: noTarget }
    ]
  },
  {
    code: 'T4RSP',
    name: 'Statement of RRSP Income',
    payerLabel: 'Issuer name',
    boxes: [
      { code: '22', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'T4RSP box 22 tax withheld', lineRef: '43700', asWithholding: true }] },
      { code: '34', label: 'RRSP income', type: 'currency', targets: [{ kind: 'income', category: 'rrsp_income', description: 'T4RSP box 34 RRSP income', lineRef: '12900' }] },
      { code: '35', label: 'Lifelong learning plan amount', type: 'currency', targets: noTarget }
    ]
  },
  {
    code: 'T4RIF',
    name: 'Statement of Income From a Registered Retirement Income Fund',
    payerLabel: 'Issuer name',
    boxes: [
      { code: '16', label: 'Taxable amount', type: 'currency', targets: [{ kind: 'income', category: 'rrif_income', description: 'T4RIF box 16 taxable amount', lineRef: '11500' }] },
      { code: '22', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'T4RIF box 22 tax withheld', lineRef: '43700', asWithholding: true }] }
    ]
  },
  {
    code: 'T5008',
    name: 'Statement of Securities Transactions',
    payerLabel: 'Broker or dealer name',
    boxes: [
      { code: '20', label: 'Cost or book value', type: 'currency', targets: noTarget },
      { code: '21', label: 'Proceeds of disposition', type: 'currency', targets: [{ kind: 'income', category: 'capital_disposition_proceeds', description: 'T5008 box 21 proceeds', lineRef: '12700', scheduleRef: 'Schedule 3' }] }
    ]
  },
  {
    code: 'T2202',
    name: 'Tuition and Enrolment Certificate',
    payerLabel: 'Educational institution',
    boxes: [
      { code: 'A', label: 'Eligible tuition fees', type: 'currency', targets: [{ kind: 'deduction', category: 'tuition_amount', description: 'T2202 eligible tuition amount', lineRef: '32300' }] }
    ]
  },
  {
    code: 'RC62',
    name: 'Universal Child Care Benefit Statement',
    payerLabel: 'Issuer name',
    boxes: [
      { code: '10', label: 'UCCB amount', type: 'currency', targets: [{ kind: 'income', category: 'uccb_income', description: 'RC62 UCCB amount', lineRef: '11700' }] },
      { code: '12', label: 'Repayment', type: 'currency', targets: [{ kind: 'deduction', category: 'uccb_repayment', description: 'RC62 repayment', lineRef: '21300' }] }
    ]
  },
  {
    code: 'T5007',
    name: 'Statement of Benefits',
    payerLabel: 'Issuer name',
    boxes: [
      { code: '10', label: 'Social assistance payments', type: 'currency', targets: [{ kind: 'income', category: 'social_assistance', description: 'T5007 box 10 social assistance', lineRef: '14500' }] },
      { code: '11', label: 'Workers compensation benefits', type: 'currency', targets: [{ kind: 'income', category: 'workers_compensation', description: 'T5007 box 11 workers compensation', lineRef: '14400' }] }
    ]
  },
  {
    code: 'T5013',
    name: 'Statement of Partnership Income',
    payerLabel: 'Partnership name',
    boxes: [
      { code: '118', label: 'Business income (loss)', type: 'currency', targets: [{ kind: 'income', category: 'partnership_business_income', description: 'T5013 business income', lineRef: '13500', scheduleRef: 'T2125' }] },
      { code: '151', label: 'Capital gains (losses)', type: 'currency', targets: [{ kind: 'income', category: 'partnership_capital_gains', description: 'T5013 capital gains', lineRef: '12700', scheduleRef: 'Schedule 3' }] }
    ]
  },
  {
    code: 'T5018',
    name: 'Statement of Contract Payments',
    payerLabel: 'Payer name',
    boxes: [
      { code: '22', label: 'Payments to subcontractors', type: 'currency', targets: [{ kind: 'income', category: 'contract_payments', description: 'T5018 contract payments', lineRef: '13499', scheduleRef: 'T2125' }] }
    ]
  },
  {
    code: 'T4PS',
    name: 'Statement of Employee Profit-Sharing Plan Allocations and Payments',
    payerLabel: 'Plan administrator',
    boxes: [
      { code: '35', label: 'Amount allocated by trustee', type: 'currency', targets: [{ kind: 'income', category: 'dpsp_allocation', description: 'T4PS box 35 DPSP allocation', lineRef: '13000' }] },
      { code: '36', label: 'Amount paid out of plan', type: 'currency', targets: [{ kind: 'income', category: 'dpsp_payout', description: 'T4PS box 36 DPSP payout', lineRef: '13000' }] }
    ]
  }
]

export const SLIP_DEFINITIONS_BY_CODE = Object.fromEntries(SLIP_DEFINITIONS.map((d) => [d.code, d])) as Record<string, SlipDefinition>


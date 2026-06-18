const noTarget = []

/** Forms in form_registry that are not taxpayer information slips for box entry. */
export const EXCLUDED_SLIP_FORM_NUMBERS = new Set([
  'T400A',
  'T4004',
  'T183',
  'T183R',
  'T1013',
  'T2201',
  'T2209',
  'T2033',
  'T2036'
])

/** Authoritative complete slip box schemas — seeded into taxgpt.slip_schemas / slip_box_schemas. */
export const COMPLETE_SLIP_DEFINITIONS = [
  {
    code: 'T4',
    name: 'Statement of Remuneration Paid',
    payerLabel: 'Employer name',
    boxes: [
      { code: '10', label: 'Province of employment', type: 'number', targets: noTarget },
      { code: '14', label: 'Employment income', type: 'currency', targets: [{ kind: 'income', category: 'employment_income', description: 'T4 box 14 employment income', lineRef: '10100' }] },
      { code: '16', label: 'Employee CPP contributions', type: 'currency', targets: [{ kind: 'deduction', category: 'cpp_contributions', description: 'T4 box 16 CPP contributions', lineRef: '30800' }] },
      { code: '16A', label: 'Employee second CPP contributions', type: 'currency', targets: [{ kind: 'deduction', category: 'cpp2_contributions', description: 'T4 box 16A CPP2 contributions', lineRef: '22215' }] },
      { code: '17', label: 'Employee QPP contributions', type: 'currency', targets: [{ kind: 'deduction', category: 'qpp_contributions', description: 'T4 box 17 QPP contributions', lineRef: '30800' }] },
      { code: '17A', label: 'Employee second QPP contributions', type: 'currency', targets: [{ kind: 'deduction', category: 'qpp2_contributions', description: 'T4 box 17A QPP2 contributions', lineRef: '22300' }] },
      { code: '18', label: 'Employee EI premiums', type: 'currency', targets: [{ kind: 'deduction', category: 'ei_premiums', description: 'T4 box 18 EI premiums', lineRef: '31200' }] },
      { code: '22', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'T4 box 22 tax withheld', lineRef: '43700', asWithholding: true }] },
      { code: '24', label: 'EI insurable earnings', type: 'currency', targets: noTarget },
      { code: '26', label: 'CPP/QPP pensionable earnings', type: 'currency', targets: noTarget },
      { code: '40', label: 'Other taxable allowances and benefits', type: 'currency', targets: [{ kind: 'income', category: 'other_taxable_benefits', description: 'T4 code 40 taxable benefits', lineRef: '10100' }] },
      { code: '42', label: 'Employment commissions', type: 'currency', targets: [{ kind: 'income', category: 'employment_commissions', description: 'T4 code 42 commissions', lineRef: '10120' }] },
      { code: '44', label: 'Union dues', type: 'currency', targets: [{ kind: 'deduction', category: 'union_dues', description: 'T4 box 44 union dues', lineRef: '21200' }] },
      { code: '52', label: 'Pension adjustment', type: 'currency', targets: noTarget },
      { code: '55', label: 'Employee PPIP premiums', type: 'currency', targets: [{ kind: 'deduction', category: 'ppip_premiums', description: 'T4 box 55 PPIP premiums', lineRef: '31205' }] },
      { code: '56', label: 'PPIP insurable earnings', type: 'currency', targets: noTarget },
      { code: '85', label: 'Employee-paid PHSP premiums', type: 'currency', targets: [{ kind: 'deduction', category: 'phsp_premiums', description: 'T4 code 85 PHSP premiums', lineRef: '33099' }] },
      { code: '90', label: 'Security options benefits', type: 'currency', targets: [{ kind: 'income', category: 'security_option_benefits', description: 'T4 code 90 security options', lineRef: '10100' }] }
    ]
  },
  {
    code: 'T5',
    name: 'Statement of Investment Income',
    payerLabel: 'Payer name',
    boxes: [
      { code: '10', label: 'Actual amount of dividends (eligible)', type: 'currency', targets: noTarget },
      { code: '11', label: 'Taxable amount of dividends (eligible)', type: 'currency', targets: noTarget },
      { code: '12', label: 'Dividend tax credit (eligible)', type: 'currency', targets: noTarget },
      { code: '13', label: 'Interest from Canadian sources', type: 'currency', targets: [{ kind: 'income', category: 'interest_income', description: 'T5 box 13 interest income', lineRef: '12100' }] },
      { code: '15', label: 'Eligible dividends', type: 'currency', targets: [{ kind: 'income', category: 'eligible_dividends', description: 'T5 box 15 eligible dividends', lineRef: '12000' }] },
      { code: '16', label: 'Taxable amount of eligible dividends', type: 'currency', targets: [{ kind: 'income', category: 'taxable_eligible_dividends', description: 'T5 box 16 taxable eligible dividends', lineRef: '12000' }] },
      { code: '18', label: 'Capital gains dividends', type: 'currency', targets: [{ kind: 'income', category: 'capital_gains_dividends', description: 'T5 box 18 capital gains dividends', lineRef: '12700', scheduleRef: 'Schedule 3' }] },
      { code: '23', label: 'Recipient type code', type: 'number', targets: noTarget },
      { code: '24', label: 'Actual amount of dividends (other than eligible)', type: 'currency', targets: [{ kind: 'income', category: 'other_dividends', description: 'T5 box 24 other dividends', lineRef: '12010' }] },
      { code: '25', label: 'Taxable amount of dividends (other than eligible)', type: 'currency', targets: [{ kind: 'income', category: 'taxable_other_dividends', description: 'T5 box 25 taxable other dividends', lineRef: '12010' }] },
      { code: '34', label: 'Foreign income tax paid', type: 'currency', targets: noTarget }
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
      { code: '28', label: 'Other income', type: 'currency', targets: [{ kind: 'income', category: 'other_income', description: 'T4A box 28 other income', lineRef: '13000' }] },
      { code: '48', label: 'Fees for services', type: 'currency', targets: [{ kind: 'income', category: 'professional_fees', description: 'T4A box 48 fees for services', lineRef: '13499', scheduleRef: 'T2125' }] },
      { code: '104', label: 'Research grants', type: 'currency', targets: [{ kind: 'income', category: 'research_grants', description: 'T4A box 104 research grants', lineRef: '13000' }] },
      { code: '105', label: 'Scholarships, bursaries, fellowships', type: 'currency', targets: [{ kind: 'income', category: 'scholarship_income', description: 'T4A box 105 scholarships', lineRef: '13010' }] },
      { code: '119', label: 'Premiums paid to a group term life insurance plan', type: 'currency', targets: noTarget },
      { code: '135', label: 'Registered disability savings plan income', type: 'currency', targets: [{ kind: 'income', category: 'rdsp_income', description: 'T4A box 135 RDSP income', lineRef: '12500' }] }
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
      { code: 'A', label: 'Part-time months', type: 'number', targets: noTarget },
      { code: 'B', label: 'Full-time months', type: 'number', targets: noTarget },
      { code: '11', label: 'Eligible tuition fees', type: 'currency', targets: [{ kind: 'deduction', category: 'tuition_amount', description: 'T2202 eligible tuition amount', lineRef: '32300' }] }
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
      { code: '35', label: 'Amount allocated by trustee', type: 'currency', targets: [{ kind: 'income', category: 'dpsp_allocation', description: 'T4PS box 35 DPSP allocation', lineRef: '13000' }], extractionHints: { legacyFieldKey: 'amount_allocated_by_trustee', labelPatterns: ['amount[_\\s-]*allocated[_\\s-]*by[_\\s-]*trustee'] } },
      { code: '36', label: 'Amount paid out of plan', type: 'currency', targets: [{ kind: 'income', category: 'dpsp_payout', description: 'T4PS box 36 DPSP payout', lineRef: '13000' }], extractionHints: { legacyFieldKey: 'amount_paid_out_of_plan', labelPatterns: ['amount[_\\s-]*paid[_\\s-]*out[_\\s-]*of[_\\s-]*plan'] } }
    ]
  },
  {
    code: 'T4FHSA',
    name: 'First Home Savings Account Statement',
    payerLabel: 'Issuer name',
    boxes: [
      { code: '20', label: 'Taxable withdrawals', type: 'currency', targets: [{ kind: 'income', category: 'fhsa_taxable_withdrawal', description: 'T4FHSA box 20 taxable withdrawals', lineRef: '13000' }], extractionHints: { legacyFieldKey: 'taxable_withdrawals', labelPatterns: ['taxable[_\\s-]*withdrawals?'] } },
      { code: '22', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'T4FHSA box 22 tax withheld', lineRef: '43700', asWithholding: true }], extractionHints: { legacyFieldKey: 'income_tax_deducted', labelPatterns: ['income[_\\s-]*tax[_\\s-]*deducted'] } },
      { code: '26', label: 'Qualifying withdrawals', type: 'currency', targets: noTarget, extractionHints: { legacyFieldKey: 'qualifying_withdrawals', labelPatterns: ['qualifying[_\\s-]*withdrawals?'] } }
    ]
  },
  {
    code: 'T4A-RCA',
    name: 'Statement of Distributions from a Retirement Compensation Arrangement (RCA)',
    payerLabel: 'Issuer name',
    boxes: [
      { code: '16', label: 'Distributions from RCA', type: 'currency', targets: [{ kind: 'income', category: 'rca_distribution', description: 'T4A-RCA box 16 RCA distribution', lineRef: '13000' }], extractionHints: { legacyFieldKey: 'rca_distribution', labelPatterns: ['distributions?[_\\s-]*from[_\\s-]*rca', 'box[_\\s-]*16'] } },
      { code: '22', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'T4A-RCA box 22 tax withheld', lineRef: '43700', asWithholding: true }], extractionHints: { legacyFieldKey: 'income_tax_deducted', labelPatterns: ['income[_\\s-]*tax[_\\s-]*deducted'] } }
    ]
  },
  {
    code: 'T4EQ',
    name: 'Statement of Employment Insurance and Other Benefits (Quebec)',
    payerLabel: 'Issuer name',
    boxes: [
      { code: '14', label: 'Total benefits paid', type: 'currency', targets: [{ kind: 'income', category: 'ei_benefits', description: 'T4EQ box 14 EI benefits', lineRef: '11900' }], extractionHints: { legacyFieldKey: 'total_benefits_paid', labelPatterns: ['total[_\\s-]*benefits[_\\s-]*paid'] } },
      { code: '15', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'T4EQ box 15 tax withheld', lineRef: '43700', asWithholding: true }], extractionHints: { legacyFieldKey: 'income_tax_deducted', labelPatterns: ['income[_\\s-]*tax[_\\s-]*deducted'] } }
    ]
  },
  {
    code: 'T4A-NR',
    name: 'Statement of Fees, Commissions, or Other Amounts Paid to Non-Residents',
    payerLabel: 'Payer name',
    boxes: [
      { code: '16', label: 'Fees, commissions, or other amounts', type: 'currency', targets: [{ kind: 'income', category: 'non_resident_fees', description: 'T4A-NR box 16 fees/commissions', lineRef: '13000' }], extractionHints: { legacyFieldKey: 'fees_commissions', labelPatterns: ['fees?[_\\s-]*commissions?', 'other[_\\s-]*amounts?'] } },
      { code: '22', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'T4A-NR box 22 tax withheld', lineRef: '43700', asWithholding: true }], extractionHints: { legacyFieldKey: 'income_tax_deducted', labelPatterns: ['income[_\\s-]*tax[_\\s-]*deducted'] } }
    ]
  },
  {
    code: 'NR4',
    name: 'Statement of Amounts Paid or Credited to Non-Residents of Canada',
    payerLabel: 'Payer name',
    boxes: [
      { code: '16', label: 'Self-employment income', type: 'currency', targets: [{ kind: 'income', category: 'non_resident_self_employment', description: 'NR4 box 16 self-employment income', lineRef: '13499', scheduleRef: 'T2125' }], extractionHints: { legacyFieldKey: 'self_employment_income', labelPatterns: ['self[_\\s-]*employment[_\\s-]*income'] } },
      { code: '26', label: 'Other income', type: 'currency', targets: [{ kind: 'income', category: 'non_resident_other_income', description: 'NR4 box 26 other income', lineRef: '13000' }], extractionHints: { legacyFieldKey: 'other_income', labelPatterns: ['other[_\\s-]*income'] } },
      { code: '28', label: 'Capital gains', type: 'currency', targets: [{ kind: 'income', category: 'capital_gains', description: 'NR4 box 28 capital gains', lineRef: '12700', scheduleRef: 'Schedule 3' }], extractionHints: { legacyFieldKey: 'capital_gains', labelPatterns: ['capital[_\\s-]*gains?'] } },
      { code: '30', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'NR4 box 30 tax withheld', lineRef: '43700', asWithholding: true }], extractionHints: { legacyFieldKey: 'income_tax_deducted', labelPatterns: ['income[_\\s-]*tax[_\\s-]*deducted'] } }
    ]
  },
  {
    code: 'T1198',
    name: 'Statement of Qualifying Retroactive Lump-Sum Payment',
    payerLabel: 'Payer name',
    boxes: [
      { code: '10', label: 'Qualifying retroactive lump-sum payment', type: 'currency', targets: [{ kind: 'income', category: 'retroactive_lump_sum', description: 'T1198 box 10 retroactive lump-sum', lineRef: '13000' }], extractionHints: { legacyFieldKey: 'retroactive_lump_sum', labelPatterns: ['retroactive[_\\s-]*lump[_\\s-]*sum', 'qualifying[_\\s-]*retroactive'] } }
    ]
  },
  {
    code: 'T1212',
    name: 'Statement of Deferred Security Options Benefits',
    payerLabel: 'Employer name',
    boxes: [
      { code: '38', label: 'Security options benefits', type: 'currency', targets: [{ kind: 'income', category: 'security_option_benefits', description: 'T1212 box 38 security options benefits', lineRef: '10100' }], extractionHints: { legacyFieldKey: 'security_options_benefits', labelPatterns: ['security[_\\s-]*options?[_\\s-]*benefits?'] } },
      { code: '12', label: 'Security options deduction', type: 'currency', targets: [{ kind: 'deduction', category: 'security_options_deduction', description: 'T1212 box 12 security options deduction', lineRef: '24900' }], extractionHints: { legacyFieldKey: 'security_options_deduction', labelPatterns: ['security[_\\s-]*options?[_\\s-]*deduction'] } }
    ]
  },
  {
    code: 'NR4OAS',
    name: 'Statement of Old Age Security Pension Paid or Credited to Non-Residents of Canada',
    payerLabel: 'Issuer name',
    boxes: [
      { code: '16', label: 'Gross Old Age Security pension', type: 'currency', targets: [{ kind: 'income', category: 'oas_pension', description: 'NR4OAS box 16 OAS pension', lineRef: '11300' }], extractionHints: { legacyFieldKey: 'gross_oas_pension', labelPatterns: ['gross[_\\s-]*old[_\\s-]*age[_\\s-]*security', 'box[_\\s-]*16'] } },
      { code: '17', label: 'Non-resident tax withheld', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'NR4OAS box 17 tax withheld', lineRef: '43700', asWithholding: true }], extractionHints: { legacyFieldKey: 'non_resident_tax_withheld', labelPatterns: ['non[_\\s-]*resident[_\\s-]*tax[_\\s-]*withheld'] } },
      { code: '27', label: 'Recovery tax withheld', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'NR4OAS box 27 recovery tax withheld', lineRef: '43700', asWithholding: true }], extractionHints: { legacyFieldKey: 'recovery_tax_withheld', labelPatterns: ['recovery[_\\s-]*tax[_\\s-]*withheld'] } }
    ]
  },
  {
    code: 'T4AOAS',
    name: 'Statement of Old Age Security',
    payerLabel: 'Issuer name',
    boxes: [
      { code: '18', label: 'Taxable pension paid', type: 'currency', targets: [{ kind: 'income', category: 'oas_pension', description: 'T4A(OAS) box 18 taxable pension', lineRef: '11300' }], extractionHints: { legacyFieldKey: 'taxable_pension_paid', labelPatterns: ['taxable[_\\s-]*pension[_\\s-]*paid'] } },
      { code: '22', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'T4A(OAS) box 22 tax withheld', lineRef: '43700', asWithholding: true }], extractionHints: { legacyFieldKey: 'income_tax_deducted', labelPatterns: ['income[_\\s-]*tax[_\\s-]*deducted'] } }
    ]
  },
  {
    code: 'T4AP',
    name: 'Statement of Canada Pension Plan Benefits',
    payerLabel: 'Issuer name',
    boxes: [
      { code: '20', label: 'Taxable CPP benefits', type: 'currency', targets: [{ kind: 'income', category: 'cpp_benefits', description: 'T4A(P) box 20 CPP benefits', lineRef: '11400' }], extractionHints: { legacyFieldKey: 'taxable_cpp_benefits', labelPatterns: ['taxable[_\\s-]*cpp[_\\s-]*benefits?'] } },
      { code: '22', label: 'Income tax deducted', type: 'currency', targets: [{ kind: 'income', category: 'tax_withheld', description: 'T4A(P) box 22 tax withheld', lineRef: '43700', asWithholding: true }], extractionHints: { legacyFieldKey: 'income_tax_deducted', labelPatterns: ['income[_\\s-]*tax[_\\s-]*deducted'] } }
    ]
  }
]

export const COMPLETE_SLIP_DEFINITIONS_BY_CODE = Object.fromEntries(
  COMPLETE_SLIP_DEFINITIONS.map((d) => [d.code, d])
)

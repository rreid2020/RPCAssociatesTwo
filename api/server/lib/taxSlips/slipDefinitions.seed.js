const noTarget = []

function cur (code, label, targets, hints) {
  return {
    code,
    label,
    type: 'currency',
    targets: targets || noTarget,
    ...(hints ? { extractionHints: hints } : {})
  }
}

function num (code, label, targets = noTarget) {
  return { code, label, type: 'number', targets }
}

function withheld (code, label = 'Income tax deducted', description) {
  return cur(code, label, [{
    kind: 'income',
    category: 'tax_withheld',
    description: description || `Box ${code} tax withheld`,
    lineRef: '43700',
    asWithholding: true
  }])
}

function quebecWithheld (code = '23') {
  return cur(code, 'Quebec income tax deducted', [{
    kind: 'income',
    category: 'quebec_tax_withheld',
    description: `Box ${code} Quebec tax withheld`,
    lineRef: '43700',
    asWithholding: true
  }])
}

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

const T4AOAS_BOXES = [
  cur('18', 'Taxable pension paid', [{ kind: 'income', category: 'oas_pension', description: 'T4A(OAS) box 18 taxable pension', lineRef: '11300' }], { legacyFieldKey: 'taxable_pension_paid', labelPatterns: ['taxable[_\\s-]*pension[_\\s-]*paid', 'box[_\\s-]*18'] }),
  cur('19', 'Gross pension paid', [{ kind: 'income', category: 'oas_gross_pension', description: 'T4A(OAS) box 19 gross pension (OAS recovery)', lineRef: '11300' }], { legacyFieldKey: 'gross_pension_paid', labelPatterns: ['gross[_\\s-]*pension[_\\s-]*paid', 'box[_\\s-]*19'] }),
  cur('20', 'Overpayment recovered', [{ kind: 'deduction', category: 'oas_overpayment_recovered', description: 'T4A(OAS) box 20 overpayment recovered', lineRef: '23500' }], { legacyFieldKey: 'overpayment_recovered', labelPatterns: ['overpayment[_\\s-]*recovered', 'box[_\\s-]*20'] }),
  cur('21', 'Net supplements paid', [{ kind: 'income', category: 'oas_net_supplements', description: 'T4A(OAS) box 21 net supplements', lineRef: '14600' }], { legacyFieldKey: 'net_supplements_paid', labelPatterns: ['net[_\\s-]*supplements[_\\s-]*paid', 'box[_\\s-]*21'] }),
  withheld('22', 'Income tax deducted', 'T4A(OAS) box 22 tax withheld'),
  quebecWithheld('23')
]

const T4AP_BOXES = [
  cur('14', 'Retirement benefit', [{ kind: 'income', category: 'cpp_retirement_benefit', description: 'T4A(P) box 14 retirement benefit', lineRef: '11400' }], { legacyFieldKey: 'cpp_retirement_benefit', labelPatterns: ['retirement[_\\s-]*benefit', 'box[_\\s-]*14'] }),
  cur('15', 'Survivor benefit', [{ kind: 'income', category: 'cpp_survivor_benefit', description: 'T4A(P) box 15 survivor benefit', lineRef: '11400' }], { legacyFieldKey: 'cpp_survivor_benefit', labelPatterns: ['survivor[_\\s-]*benefit', 'box[_\\s-]*15'] }),
  cur('16', 'Disability benefit', [{ kind: 'income', category: 'cpp_disability_benefit', description: 'T4A(P) box 16 disability benefit', lineRef: '11400' }], { legacyFieldKey: 'cpp_disability_benefit', labelPatterns: ['disability[_\\s-]*benefit', 'box[_\\s-]*16'] }),
  cur('17', 'Death benefit', [{ kind: 'income', category: 'cpp_death_benefit', description: 'T4A(P) box 17 death benefit', lineRef: '13000' }], { legacyFieldKey: 'cpp_death_benefit', labelPatterns: ['death[_\\s-]*benefit', 'box[_\\s-]*17'] }),
  cur('18', 'Child benefit', [{ kind: 'income', category: 'cpp_child_benefit', description: 'T4A(P) box 18 child benefit', lineRef: '11400' }], { legacyFieldKey: 'cpp_child_benefit', labelPatterns: ['child[_\\s-]*benefit', 'box[_\\s-]*18'] }),
  cur('20', 'Taxable CPP benefits', [{ kind: 'income', category: 'cpp_benefits', description: 'T4A(P) box 20 taxable CPP benefits', lineRef: '11400' }], { legacyFieldKey: 'taxable_cpp_benefits', labelPatterns: ['taxable[_\\s-]*cpp[_\\s-]*benefits?', 'box[_\\s-]*20'] }),
  withheld('22', 'Income tax deducted', 'T4A(P) box 22 tax withheld'),
  quebecWithheld('23')
]

/** Authoritative complete slip box schemas — seeded into taxgpt.slip_schemas / slip_box_schemas. */
export const COMPLETE_SLIP_DEFINITIONS = [
  {
    code: 'T4',
    name: 'Statement of Remuneration Paid',
    payerLabel: 'Employer name',
    boxes: [
      num('10', 'Province of employment'),
      cur('14', 'Employment income', [{ kind: 'income', category: 'employment_income', description: 'T4 box 14 employment income', lineRef: '10100' }]),
      cur('16', 'Employee CPP contributions', [{ kind: 'deduction', category: 'cpp_contributions', description: 'T4 box 16 CPP contributions', lineRef: '30800' }]),
      cur('16A', 'Employee second CPP contributions', [{ kind: 'deduction', category: 'cpp2_contributions', description: 'T4 box 16A CPP2 contributions', lineRef: '22215' }]),
      cur('17', 'Employee QPP contributions', [{ kind: 'deduction', category: 'qpp_contributions', description: 'T4 box 17 QPP contributions', lineRef: '30800' }]),
      cur('17A', 'Employee second QPP contributions', [{ kind: 'deduction', category: 'qpp2_contributions', description: 'T4 box 17A QPP2 contributions', lineRef: '22300' }]),
      cur('18', 'Employee EI premiums', [{ kind: 'deduction', category: 'ei_premiums', description: 'T4 box 18 EI premiums', lineRef: '31200' }]),
      withheld('22', 'Income tax deducted', 'T4 box 22 tax withheld'),
      cur('24', 'EI insurable earnings'),
      cur('26', 'CPP/QPP pensionable earnings'),
      cur('30', 'Board and lodging (other information)', [{ kind: 'income', category: 'board_and_lodging', description: 'T4 code 30 board and lodging', lineRef: '10100' }]),
      cur('31', 'Travel in a prescribed zone (other information)', [{ kind: 'income', category: 'northern_travel_benefit', description: 'T4 code 31 northern travel', lineRef: '10100' }]),
      cur('32', 'Use of employer automobile (other information)', [{ kind: 'income', category: 'automobile_benefit', description: 'T4 code 32 automobile benefit', lineRef: '10100' }]),
      cur('33', 'Low-interest loan (other information)', [{ kind: 'income', category: 'low_interest_loan_benefit', description: 'T4 code 33 loan benefit', lineRef: '10100' }]),
      cur('34', 'Parking (other information)', [{ kind: 'income', category: 'parking_benefit', description: 'T4 code 34 parking benefit', lineRef: '10100' }]),
      cur('38', 'Security options deduction (other information)', [{ kind: 'deduction', category: 'security_options_deduction', description: 'T4 code 38 security options deduction', lineRef: '24900' }]),
      cur('39', 'Security options benefits 110(1)(d) (other information)', [{ kind: 'income', category: 'security_option_benefits', description: 'T4 code 39 security options', lineRef: '10100' }]),
      cur('40', 'Other taxable allowances and benefits', [{ kind: 'income', category: 'other_taxable_benefits', description: 'T4 code 40 taxable benefits', lineRef: '10100' }]),
      cur('41', 'Security options benefits 110(1)(d.1) (other information)', [{ kind: 'income', category: 'security_option_benefits', description: 'T4 code 41 security options', lineRef: '10100' }]),
      cur('42', 'Employment commissions', [{ kind: 'income', category: 'employment_commissions', description: 'T4 code 42 commissions', lineRef: '10120' }]),
      cur('43', 'Canadian Armed Forces personnel and police deduction (other information)', [{ kind: 'deduction', category: 'caf_police_deduction', description: 'T4 code 43 CAF/police deduction', lineRef: '24400' }]),
      cur('44', 'Union dues', [{ kind: 'deduction', category: 'union_dues', description: 'T4 box 44 union dues', lineRef: '21200' }]),
      cur('45', 'Employer-paid dental benefits (other information)'),
      cur('46', 'Charitable donations (other information)', [{ kind: 'deduction', category: 'charitable_donations_payroll', description: 'T4 code 46 charitable donations', lineRef: '34900' }]),
      cur('52', 'Pension adjustment'),
      cur('55', 'Employee PPIP premiums', [{ kind: 'deduction', category: 'ppip_premiums', description: 'T4 box 55 PPIP premiums', lineRef: '31205' }]),
      cur('56', 'PPIP insurable earnings'),
      cur('66', 'Eligible retiring allowance (other information)', [{ kind: 'income', category: 'eligible_retiring_allowance', description: 'T4 code 66 eligible retiring allowance', lineRef: '13000' }]),
      cur('67', 'Non-eligible retiring allowance (other information)', [{ kind: 'income', category: 'non_eligible_retiring_allowance', description: 'T4 code 67 non-eligible retiring allowance', lineRef: '13000' }]),
      cur('85', 'Employee-paid PHSP premiums', [{ kind: 'deduction', category: 'phsp_premiums', description: 'T4 code 85 PHSP premiums', lineRef: '33099' }]),
      cur('86', 'Security options election (other information)', [{ kind: 'income', category: 'security_option_benefits', description: 'T4 code 86 security options election', lineRef: '10100' }]),
      cur('90', 'Security options benefits', [{ kind: 'income', category: 'security_option_benefits', description: 'T4 code 90 security options', lineRef: '10100' }])
    ]
  },
  {
    code: 'T5',
    name: 'Statement of Investment Income',
    payerLabel: 'Payer name',
    boxes: [
      cur('10', 'Actual amount of dividends (eligible)'),
      cur('11', 'Taxable amount of dividends (eligible)'),
      cur('12', 'Dividend tax credit (eligible)'),
      cur('13', 'Interest from Canadian sources', [{ kind: 'income', category: 'interest_income', description: 'T5 box 13 interest income', lineRef: '12100' }]),
      cur('14', 'Other income from Canadian sources', [{ kind: 'income', category: 'other_investment_income', description: 'T5 box 14 other Canadian investment income', lineRef: '13000' }]),
      cur('15', 'Eligible dividends', [{ kind: 'income', category: 'eligible_dividends', description: 'T5 box 15 eligible dividends', lineRef: '12000' }]),
      cur('16', 'Taxable amount of eligible dividends', [{ kind: 'income', category: 'taxable_eligible_dividends', description: 'T5 box 16 taxable eligible dividends', lineRef: '12000' }]),
      cur('17', 'Foreign income', [{ kind: 'income', category: 'foreign_investment_income', description: 'T5 box 17 foreign income', lineRef: '12100' }]),
      cur('18', 'Capital gains dividends', [{ kind: 'income', category: 'capital_gains_dividends', description: 'T5 box 18 capital gains dividends', lineRef: '12700', scheduleRef: 'Schedule 3' }]),
      cur('19', 'Accrued income — bond discount'),
      cur('21', 'Bond interest'),
      cur('22', 'Other interest'),
      num('23', 'Recipient type code'),
      cur('24', 'Actual amount of dividends (other than eligible)', [{ kind: 'income', category: 'other_dividends', description: 'T5 box 24 other dividends', lineRef: '12010' }]),
      cur('25', 'Taxable amount of dividends (other than eligible)', [{ kind: 'income', category: 'taxable_other_dividends', description: 'T5 box 25 taxable other dividends', lineRef: '12010' }]),
      cur('26', 'Other income', [{ kind: 'income', category: 'other_investment_income', description: 'T5 box 26 other income', lineRef: '13000' }]),
      cur('27', 'Foreign non-business income', [{ kind: 'income', category: 'foreign_non_business_income', description: 'T5 box 27 foreign non-business income', lineRef: '12100' }]),
      cur('28', 'Foreign tax paid — other than United States'),
      cur('29', 'Foreign tax paid — United States'),
      cur('30', 'Capital gains', [{ kind: 'income', category: 'capital_gains', description: 'T5 box 30 capital gains', lineRef: '12700', scheduleRef: 'Schedule 3' }]),
      cur('33', 'Foreign non-business income tax credit'),
      cur('34', 'Foreign income tax paid')
    ]
  },
  {
    code: 'T3',
    name: 'Statement of Trust Income Allocations and Designations',
    payerLabel: 'Trust name',
    boxes: [
      cur('12', 'Interest from Canadian sources', [{ kind: 'income', category: 'interest_income', description: 'T3 box 12 interest income', lineRef: '12100' }]),
      cur('13', 'Interest from other sources', [{ kind: 'income', category: 'interest_income', description: 'T3 box 13 interest from other sources', lineRef: '12100' }]),
      cur('14', 'Other income from Canadian sources', [{ kind: 'income', category: 'trust_other_income', description: 'T3 box 14 other Canadian income', lineRef: '13000' }]),
      cur('15', 'Foreign income other than United States', [{ kind: 'income', category: 'foreign_investment_income', description: 'T3 box 15 foreign income', lineRef: '12100' }]),
      cur('16', 'Foreign income — United States', [{ kind: 'income', category: 'foreign_investment_income', description: 'T3 box 16 US foreign income', lineRef: '12100' }]),
      cur('17', 'Capital gains dividends', [{ kind: 'income', category: 'capital_gains_dividends', description: 'T3 box 17 capital gains dividends', lineRef: '12700', scheduleRef: 'Schedule 3' }]),
      cur('18', 'Capital gains', [{ kind: 'income', category: 'capital_gains', description: 'T3 box 18 capital gains', lineRef: '12700', scheduleRef: 'Schedule 3' }]),
      cur('21', 'Actual amount of eligible dividends'),
      cur('22', 'Taxable amount of eligible dividends', [{ kind: 'income', category: 'taxable_eligible_dividends', description: 'T3 box 22 taxable eligible dividends', lineRef: '12000' }]),
      cur('23', 'Dividend tax credit for eligible dividends'),
      cur('24', 'Actual amount of dividends (other than eligible)'),
      cur('25', 'Taxable amount of dividends (other than eligible)', [{ kind: 'income', category: 'taxable_other_dividends', description: 'T3 box 25 taxable other dividends', lineRef: '12010' }]),
      cur('26', 'Other income', [{ kind: 'income', category: 'trust_other_income', description: 'T3 box 26 other income', lineRef: '13000' }]),
      cur('27', 'Return of capital'),
      cur('28', 'Other amounts'),
      cur('30', 'Capital gains', [{ kind: 'income', category: 'capital_gains', description: 'T3 box 30 capital gains', lineRef: '12700', scheduleRef: 'Schedule 3' }]),
      cur('32', 'Eligible dividends', [{ kind: 'income', category: 'eligible_dividends', description: 'T3 box 32 eligible dividends', lineRef: '12000' }]),
      cur('33', 'Taxable amount of eligible dividends', [{ kind: 'income', category: 'taxable_eligible_dividends', description: 'T3 box 33 taxable eligible dividends', lineRef: '12000' }]),
      cur('34', 'Foreign non-business income', [{ kind: 'income', category: 'foreign_non_business_income', description: 'T3 box 34 foreign non-business income', lineRef: '12100' }]),
      cur('35', 'Foreign business income', [{ kind: 'income', category: 'foreign_business_income', description: 'T3 box 35 foreign business income', lineRef: '12600' }]),
      cur('42', 'Amount resulting in cost base adjustment'),
      cur('49', 'AMT adjustment'),
      cur('50', 'Capital gains eligible for deduction', [{ kind: 'income', category: 'capital_gains', description: 'T3 box 50 capital gains eligible for deduction', lineRef: '12700', scheduleRef: 'Schedule 3' }])
    ]
  },
  {
    code: 'T4A',
    name: 'Statement of Pension, Retirement, Annuity, and Other Income',
    payerLabel: 'Payer name',
    boxes: [
      cur('14', 'Payer-offered dental benefits'),
      cur('15', 'Deferred profit sharing plan — contributions'),
      cur('16', 'Pension or superannuation', [{ kind: 'income', category: 'pension_income', description: 'T4A box 16 pension income', lineRef: '11500' }]),
      cur('18', 'Lump-sum payments', [{ kind: 'income', category: 'lump_sum_income', description: 'T4A box 18 lump-sum payments', lineRef: '13000' }]),
      cur('20', 'Self-employed commissions', [{ kind: 'income', category: 'self_employed_commissions', description: 'T4A box 20 commissions', lineRef: '13499', scheduleRef: 'T2125' }]),
      cur('22', 'Income tax deducted', [{ kind: 'income', category: 'tax_withheld', description: 'T4A box 22 tax withheld', lineRef: '43700', asWithholding: true }]),
      cur('24', 'Annuities', [{ kind: 'income', category: 'annuity_income', description: 'T4A box 24 annuities', lineRef: '13000' }]),
      cur('27', 'RESP accumulated income payments', [{ kind: 'income', category: 'resp_accumulated_income', description: 'T4A box 27 RESP accumulated income', lineRef: '13000' }]),
      cur('28', 'Other income', [{ kind: 'income', category: 'other_income', description: 'T4A box 28 other income', lineRef: '13000' }]),
      cur('30', 'Patronage allocations', [{ kind: 'income', category: 'patronage_allocations', description: 'T4A box 30 patronage allocations', lineRef: '13000' }]),
      cur('32', 'Registered pension plan contributions', [{ kind: 'deduction', category: 'rpp_contributions', description: 'T4A box 32 RPP contributions', lineRef: '20700' }]),
      cur('34', 'Pension adjustment', [{ kind: 'deduction', category: 'pension_adjustment', description: 'T4A box 34 pension adjustment', lineRef: '20600' }]),
      cur('37', 'Premiums paid to a group term life insurance plan'),
      cur('38', 'Foreign income', [{ kind: 'income', category: 'foreign_investment_income', description: 'T4A box 38 foreign income', lineRef: '12100' }]),
      cur('40', 'RESP educational assistance payments', [{ kind: 'income', category: 'resp_educational_assistance', description: 'T4A box 40 RESP EAP', lineRef: '13010' }]),
      cur('42', 'RESP accumulated income payments', [{ kind: 'income', category: 'resp_accumulated_income', description: 'T4A box 42 RESP accumulated income', lineRef: '13000' }]),
      cur('48', 'Fees for services', [{ kind: 'income', category: 'professional_fees', description: 'T4A box 48 fees for services', lineRef: '13499', scheduleRef: 'T2125' }]),
      cur('102', 'Lump-sum payments — non-resident'),
      cur('104', 'Research grants', [{ kind: 'income', category: 'research_grants', description: 'T4A box 104 research grants', lineRef: '13000' }]),
      cur('105', 'Scholarships, bursaries, fellowships', [{ kind: 'income', category: 'scholarship_income', description: 'T4A box 105 scholarships', lineRef: '13010' }]),
      cur('107', 'Payments from an RDSP'),
      cur('119', 'Premiums paid to a group term life insurance plan'),
      cur('133', 'Variable payment life annuity'),
      cur('135', 'Registered disability savings plan income', [{ kind: 'income', category: 'rdsp_income', description: 'T4A box 135 RDSP income', lineRef: '12500' }])
    ]
  },
  {
    code: 'T4E',
    name: 'Statement of Employment Insurance and Other Benefits',
    payerLabel: 'Issuer name',
    boxes: [
      cur('14', 'Total benefits paid', [{ kind: 'income', category: 'ei_benefits', description: 'T4E box 14 EI benefits', lineRef: '11900' }]),
      withheld('15', 'Income tax deducted', 'T4E box 15 tax withheld'),
      cur('16', 'EI premiums — repayment'),
      cur('17', 'Repayment of EI benefits', [{ kind: 'deduction', category: 'ei_repayment', description: 'T4E box 17 EI repayment', lineRef: '23500' }]),
      num('18', 'Repayment rate'),
      cur('22', 'Income tax deducted on repayment'),
      cur('30', 'Taxable EI benefits', [{ kind: 'income', category: 'ei_benefits', description: 'T4E box 30 taxable EI benefits', lineRef: '11900' }]),
      cur('36', 'PPIP premiums', [{ kind: 'deduction', category: 'ppip_premiums', description: 'T4E box 36 PPIP premiums', lineRef: '31205' }])
    ]
  },
  {
    code: 'T4RSP',
    name: 'Statement of RRSP Income',
    payerLabel: 'Issuer name',
    boxes: [
      cur('16', 'Annuity payments', [{ kind: 'income', category: 'rrsp_annuity', description: 'T4RSP box 16 annuity payments', lineRef: '12900' }]),
      cur('18', 'Refund of premiums to deceased annuitant'),
      withheld('22', 'Income tax deducted', 'T4RSP box 22 tax withheld'),
      cur('24', 'Amount deemed received on death'),
      cur('25', 'Lifelong learning plan withdrawal', [{ kind: 'income', category: 'llp_withdrawal', description: 'T4RSP box 25 LLP withdrawal', lineRef: '12900' }]),
      cur('26', 'Home Buyers\' Plan withdrawal', [{ kind: 'income', category: 'hbp_withdrawal', description: 'T4RSP box 26 HBP withdrawal', lineRef: '12900' }]),
      cur('28', 'Other income', [{ kind: 'income', category: 'rrsp_other_income', description: 'T4RSP box 28 other income', lineRef: '12900' }]),
      cur('34', 'RRSP income', [{ kind: 'income', category: 'rrsp_income', description: 'T4RSP box 34 RRSP income', lineRef: '12900' }]),
      cur('35', 'Total amount withdrawn'),
      cur('40', 'Amount transferred')
    ]
  },
  {
    code: 'T4RIF',
    name: 'Statement of Income From a Registered Retirement Income Fund',
    payerLabel: 'Issuer name',
    boxes: [
      cur('16', 'Taxable amount', [{ kind: 'income', category: 'rrif_income', description: 'T4RIF box 16 taxable amount', lineRef: '11500' }]),
      withheld('22', 'Income tax deducted', 'T4RIF box 22 tax withheld'),
      cur('24', 'Excess amount', [{ kind: 'income', category: 'rrif_excess_amount', description: 'T4RIF box 24 excess amount', lineRef: '11500' }]),
      cur('28', 'Other income', [{ kind: 'income', category: 'rrif_other_income', description: 'T4RIF box 28 other income', lineRef: '11500' }]),
      cur('36', 'Taxable amount — total')
    ]
  },
  {
    code: 'T5008',
    name: 'Statement of Securities Transactions',
    payerLabel: 'Broker or dealer name',
    boxes: [
      num('10', 'Security type code'),
      num('11', 'Quantity'),
      cur('20', 'Cost or book value'),
      cur('21', 'Proceeds of disposition', [{ kind: 'income', category: 'capital_disposition_proceeds', description: 'T5008 box 21 proceeds', lineRef: '12700', scheduleRef: 'Schedule 3' }]),
      cur('23', 'Gain (loss) on disposition', [{ kind: 'income', category: 'capital_gains', description: 'T5008 box 23 gain or loss', lineRef: '12700', scheduleRef: 'Schedule 3' }])
    ]
  },
  {
    code: 'T2202',
    name: 'Tuition and Enrolment Certificate',
    payerLabel: 'Educational institution',
    boxes: [
      num('A', 'Part-time months'),
      num('B', 'Full-time months'),
      num('C', 'Part-time months (institution 2)'),
      num('D', 'Full-time months (institution 2)'),
      cur('11', 'Eligible tuition fees', [{ kind: 'deduction', category: 'tuition_amount', description: 'T2202 eligible tuition amount', lineRef: '32300' }])
    ]
  },
  {
    code: 'RC62',
    name: 'Universal Child Care Benefit Statement',
    payerLabel: 'Issuer name',
    boxes: [
      cur('10', 'UCCB amount', [{ kind: 'income', category: 'uccb_income', description: 'RC62 UCCB amount', lineRef: '11700' }]),
      cur('12', 'Repayment', [{ kind: 'deduction', category: 'uccb_repayment', description: 'RC62 repayment', lineRef: '21300' }])
    ]
  },
  {
    code: 'T5007',
    name: 'Statement of Benefits',
    payerLabel: 'Issuer name',
    boxes: [
      cur('10', 'Social assistance payments', [{ kind: 'income', category: 'social_assistance', description: 'T5007 box 10 social assistance', lineRef: '14500' }]),
      cur('11', 'Workers compensation benefits', [{ kind: 'income', category: 'workers_compensation', description: 'T5007 box 11 workers compensation', lineRef: '14400' }]),
      cur('12', 'Wage earner protection program payments', [{ kind: 'income', category: 'wepp_payments', description: 'T5007 box 12 WEPP payments', lineRef: '13000' }]),
      cur('13', 'Maternity, parental, or adoption benefits'),
      cur('14', 'Provincial/territorial benefits'),
      cur('15', 'Compassionate care benefits')
    ]
  },
  {
    code: 'T5013',
    name: 'Statement of Partnership Income',
    payerLabel: 'Partnership name',
    boxes: [
      cur('101', 'Limited partnership loss'),
      cur('102', 'Partnership income (loss)'),
      cur('103', 'Business income (loss)', [{ kind: 'income', category: 'partnership_business_income', description: 'T5013 box 103 business income', lineRef: '13500', scheduleRef: 'T2125' }]),
      cur('105', 'Farming income (loss)'),
      cur('106', 'Fishing income (loss)'),
      cur('112', 'Interest income', [{ kind: 'income', category: 'interest_income', description: 'T5013 box 112 interest income', lineRef: '12100' }]),
      cur('113', 'Taxable dividends'),
      cur('114', 'Eligible dividends', [{ kind: 'income', category: 'eligible_dividends', description: 'T5013 box 114 eligible dividends', lineRef: '12000' }]),
      cur('117', 'Business income (loss)', [{ kind: 'income', category: 'partnership_business_income', description: 'T5013 box 117 business income', lineRef: '13500', scheduleRef: 'T2125' }]),
      cur('118', 'Business income (loss)', [{ kind: 'income', category: 'partnership_business_income', description: 'T5013 box 118 business income', lineRef: '13500', scheduleRef: 'T2125' }]),
      cur('119', 'Recaptured cost allowance'),
      cur('120', 'Rental income (loss)', [{ kind: 'income', category: 'rental_income', description: 'T5013 box 120 rental income', lineRef: '12600' }]),
      cur('121', 'Limited partner active business income'),
      cur('126', 'Foreign income', [{ kind: 'income', category: 'foreign_investment_income', description: 'T5013 box 126 foreign income', lineRef: '12100' }]),
      cur('132', 'Other deductions'),
      cur('133', 'Canadian dividends'),
      cur('135', 'Taxable amount of eligible dividends'),
      cur('151', 'Capital gains (losses)', [{ kind: 'income', category: 'partnership_capital_gains', description: 'T5013 box 151 capital gains', lineRef: '12700', scheduleRef: 'Schedule 3' }])
    ]
  },
  {
    code: 'T5018',
    name: 'Statement of Contract Payments',
    payerLabel: 'Payer name',
    boxes: [
      cur('20', 'Fees for services'),
      cur('22', 'Payments to subcontractors', [{ kind: 'income', category: 'contract_payments', description: 'T5018 box 22 contract payments', lineRef: '13499', scheduleRef: 'T2125' }])
    ]
  },
  {
    code: 'T4PS',
    name: 'Statement of Employee Profit-Sharing Plan Allocations and Payments',
    payerLabel: 'Plan administrator',
    boxes: [
      cur('25', 'Employee contributions'),
      cur('26', 'Past service contributions'),
      cur('30', 'Employer contributions'),
      cur('35', 'Amount allocated by trustee', [{ kind: 'income', category: 'dpsp_allocation', description: 'T4PS box 35 DPSP allocation', lineRef: '13000' }], { legacyFieldKey: 'amount_allocated_by_trustee', labelPatterns: ['amount[_\\s-]*allocated[_\\s-]*by[_\\s-]*trustee'] }),
      cur('36', 'Amount paid out of plan', [{ kind: 'income', category: 'dpsp_payout', description: 'T4PS box 36 DPSP payout', lineRef: '13000' }], { legacyFieldKey: 'amount_paid_out_of_plan', labelPatterns: ['amount[_\\s-]*paid[_\\s-]*out[_\\s-]*of[_\\s-]*plan'] }),
      withheld('37', 'Income tax deducted', 'T4PS box 37 tax withheld'),
      cur('38', 'Interest earned on contributions')
    ]
  },
  {
    code: 'T4FHSA',
    name: 'First Home Savings Account Statement',
    payerLabel: 'Issuer name',
    boxes: [
      cur('18', 'Taxable designated withdrawal', [{ kind: 'income', category: 'fhsa_taxable_withdrawal', description: 'T4FHSA box 18 taxable designated withdrawal', lineRef: '13000' }], { legacyFieldKey: 'taxable_designated_withdrawal', labelPatterns: ['taxable[_\\s-]*designated[_\\s-]*withdrawals?'] }),
      cur('20', 'Taxable withdrawals', [{ kind: 'income', category: 'fhsa_taxable_withdrawal', description: 'T4FHSA box 20 taxable withdrawals', lineRef: '13000' }], { legacyFieldKey: 'taxable_withdrawals', labelPatterns: ['taxable[_\\s-]*withdrawals?'] }),
      withheld('22', 'Income tax deducted', 'T4FHSA box 22 tax withheld'),
      cur('26', 'Qualifying withdrawals', null, { legacyFieldKey: 'qualifying_withdrawals', labelPatterns: ['qualifying[_\\s-]*withdrawals?'] }),
      cur('28', 'Taxable amount on death'),
      cur('30', 'FHSA issuer payment'),
      cur('34', 'Taxable withdrawals on death')
    ]
  },
  {
    code: 'T4A-RCA',
    name: 'Statement of Distributions from a Retirement Compensation Arrangement (RCA)',
    payerLabel: 'Issuer name',
    boxes: [
      cur('16', 'Distributions from RCA', [{ kind: 'income', category: 'rca_distribution', description: 'T4A-RCA box 16 RCA distribution', lineRef: '13000' }], { legacyFieldKey: 'rca_distribution', labelPatterns: ['distributions?[_\\s-]*from[_\\s-]*rca', 'box[_\\s-]*16'] }),
      withheld('22', 'Income tax deducted', 'T4A-RCA box 22 tax withheld')
    ]
  },
  {
    code: 'T4EQ',
    name: 'Statement of Employment Insurance and Other Benefits (Quebec)',
    payerLabel: 'Issuer name',
    boxes: [
      cur('14', 'Total benefits paid', [{ kind: 'income', category: 'ei_benefits', description: 'T4EQ box 14 EI benefits', lineRef: '11900' }], { legacyFieldKey: 'total_benefits_paid', labelPatterns: ['total[_\\s-]*benefits[_\\s-]*paid'] }),
      withheld('15', 'Income tax deducted', 'T4EQ box 15 tax withheld'),
      cur('17', 'Repayment of benefits', [{ kind: 'deduction', category: 'ei_repayment', description: 'T4EQ box 17 benefit repayment', lineRef: '23500' }]),
      num('18', 'Repayment rate'),
      cur('36', 'PPIP premiums', [{ kind: 'deduction', category: 'ppip_premiums', description: 'T4EQ box 36 PPIP premiums', lineRef: '31205' }])
    ]
  },
  {
    code: 'T4A-NR',
    name: 'Statement of Fees, Commissions, or Other Amounts Paid to Non-Residents',
    payerLabel: 'Payer name',
    boxes: [
      cur('16', 'Fees, commissions, or other amounts', [{ kind: 'income', category: 'non_resident_fees', description: 'T4A-NR box 16 fees/commissions', lineRef: '13000' }], { legacyFieldKey: 'fees_commissions', labelPatterns: ['fees?[_\\s-]*commissions?', 'other[_\\s-]*amounts?'] }),
      withheld('22', 'Income tax deducted', 'T4A-NR box 22 tax withheld'),
      cur('23', 'Quebec income tax deducted', [{ kind: 'income', category: 'quebec_tax_withheld', description: 'T4A-NR box 23 Quebec tax withheld', lineRef: '43700', asWithholding: true }])
    ]
  },
  {
    code: 'NR4',
    name: 'Statement of Amounts Paid or Credited to Non-Residents of Canada',
    payerLabel: 'Payer name',
    boxes: [
      cur('14', 'Regulated investment company income'),
      cur('15', 'Imperial Oil Limited dividends'),
      cur('16', 'Self-employment income', [{ kind: 'income', category: 'non_resident_self_employment', description: 'NR4 box 16 self-employment income', lineRef: '13499', scheduleRef: 'T2125' }], { legacyFieldKey: 'self_employment_income', labelPatterns: ['self[_\\s-]*employment[_\\s-]*income'] }),
      cur('18', 'Registered pension plan income'),
      cur('20', 'Pensions'),
      cur('25', 'Interest', [{ kind: 'income', category: 'interest_income', description: 'NR4 box 25 interest', lineRef: '12100' }]),
      cur('26', 'Other income', [{ kind: 'income', category: 'non_resident_other_income', description: 'NR4 box 26 other income', lineRef: '13000' }], { legacyFieldKey: 'other_income', labelPatterns: ['other[_\\s-]*income'] }),
      cur('27', 'Royalties'),
      cur('28', 'Capital gains', [{ kind: 'income', category: 'capital_gains', description: 'NR4 box 28 capital gains', lineRef: '12700', scheduleRef: 'Schedule 3' }], { legacyFieldKey: 'capital_gains', labelPatterns: ['capital[_\\s-]*gains?'] }),
      cur('29', 'Dividends'),
      withheld('30', 'Income tax deducted', 'NR4 box 30 tax withheld')
    ]
  },
  {
    code: 'T1198',
    name: 'Statement of Qualifying Retroactive Lump-Sum Payment',
    payerLabel: 'Payer name',
    boxes: [
      cur('10', 'Qualifying retroactive lump-sum payment', [{ kind: 'income', category: 'retroactive_lump_sum', description: 'T1198 box 10 retroactive lump-sum', lineRef: '13000' }], { legacyFieldKey: 'retroactive_lump_sum', labelPatterns: ['retroactive[_\\s-]*lump[_\\s-]*sum', 'qualifying[_\\s-]*retroactive'] })
    ]
  },
  {
    code: 'T1212',
    name: 'Statement of Deferred Security Options Benefits',
    payerLabel: 'Employer name',
    boxes: [
      cur('12', 'Security options deduction', [{ kind: 'deduction', category: 'security_options_deduction', description: 'T1212 box 12 security options deduction', lineRef: '24900' }], { legacyFieldKey: 'security_options_deduction', labelPatterns: ['security[_\\s-]*options?[_\\s-]*deduction'] }),
      cur('38', 'Security options benefits', [{ kind: 'income', category: 'security_option_benefits', description: 'T1212 box 38 security options benefits', lineRef: '10100' }], { legacyFieldKey: 'security_options_benefits', labelPatterns: ['security[_\\s-]*options?[_\\s-]*benefits?'] })
    ]
  },
  {
    code: 'NR4OAS',
    name: 'Statement of Old Age Security Pension Paid or Credited to Non-Residents of Canada',
    payerLabel: 'Issuer name',
    boxes: [
      cur('16', 'Gross Old Age Security pension', [{ kind: 'income', category: 'oas_pension', description: 'NR4OAS box 16 OAS pension', lineRef: '11300' }], { legacyFieldKey: 'gross_oas_pension', labelPatterns: ['gross[_\\s-]*old[_\\s-]*age[_\\s-]*security', 'box[_\\s-]*16'] }),
      cur('17', 'Non-resident tax withheld', [{ kind: 'income', category: 'tax_withheld', description: 'NR4OAS box 17 tax withheld', lineRef: '43700', asWithholding: true }], { legacyFieldKey: 'non_resident_tax_withheld', labelPatterns: ['non[_\\s-]*resident[_\\s-]*tax[_\\s-]*withheld'] }),
      cur('27', 'Recovery tax withheld', [{ kind: 'income', category: 'tax_withheld', description: 'NR4OAS box 27 recovery tax withheld', lineRef: '43700', asWithholding: true }], { legacyFieldKey: 'recovery_tax_withheld', labelPatterns: ['recovery[_\\s-]*tax[_\\s-]*withheld'] })
    ]
  },
  {
    code: 'T4AOAS',
    name: 'Statement of Old Age Security',
    payerLabel: 'Issuer name',
    boxes: T4AOAS_BOXES
  },
  {
    code: 'T4A(OAS)',
    name: 'Statement of Old Age Security',
    payerLabel: 'Issuer name',
    boxes: T4AOAS_BOXES
  },
  {
    code: 'T4AP',
    name: 'Statement of Canada Pension Plan Benefits',
    payerLabel: 'Issuer name',
    boxes: T4AP_BOXES
  },
  {
    code: 'T4A(P)',
    name: 'Statement of Canada Pension Plan Benefits',
    payerLabel: 'Issuer name',
    boxes: T4AP_BOXES
  },
  {
    code: 'AGR-1',
    name: 'Statement of Farm-Support Payments',
    payerLabel: 'Issuer name',
    boxes: [
      cur('16', 'Program payments', [{ kind: 'income', category: 'farm_support_payments', description: 'AGR-1 box 16 farm support payments', lineRef: '13000' }])
    ]
  },
  {
    code: 'T737-RCA',
    name: 'Statement of Contributions Paid to an RCA Custodian',
    payerLabel: 'Custodian name',
    boxes: [
      cur('20', 'Contributions paid to RCA custodian', [{ kind: 'deduction', category: 'rca_contributions', description: 'T737-RCA box 20 RCA contributions', lineRef: '20700' }])
    ]
  },
  {
    code: 'RC71',
    name: 'Statement of Discounting Transaction',
    payerLabel: 'Discounter name',
    boxes: [
      cur('20', 'Discounting fee', [{ kind: 'deduction', category: 'refund_discounting_fee', description: 'RC71 box 20 discounting fee', lineRef: '23200' }])
    ]
  },
  {
    code: 'RL1',
    name: 'RL-1 — Employment and Other Income (Revenu Québec)',
    payerLabel: 'Employer name',
    boxes: [
      cur('A', 'Employment income', [{ kind: 'income', category: 'employment_income', description: 'RL-1 box A employment income', lineRef: '10100' }]),
      cur('B', 'QPP contributions', [{ kind: 'deduction', category: 'qpp_contributions', description: 'RL-1 box B QPP contributions', lineRef: '30800' }]),
      cur('C', 'QPIP premiums', [{ kind: 'deduction', category: 'qpip_premiums', description: 'RL-1 box C QPIP premiums', lineRef: '31210' }]),
      cur('E', 'Quebec income tax withheld', [{ kind: 'income', category: 'quebec_tax_withheld', description: 'RL-1 box E Quebec tax withheld', lineRef: '43700', asWithholding: true }]),
      cur('G', 'Taxable benefits', [{ kind: 'income', category: 'employment_benefits', description: 'RL-1 box G taxable benefits', lineRef: '10100' }]),
      cur('I', 'Other income', [{ kind: 'income', category: 'other_income', description: 'RL-1 box I other income', lineRef: '13000' }])
    ]
  },
  {
    code: 'RL2',
    name: 'RL-2 — Retirement and Annuity Income (Revenu Québec)',
    payerLabel: 'Payer name',
    boxes: [
      cur('A', 'Pension or annuity income', [{ kind: 'income', category: 'pension_income', description: 'RL-2 box A pension income', lineRef: '11500' }]),
      cur('B', 'Lump-sum payments', [{ kind: 'income', category: 'retiring_allowance', description: 'RL-2 box B lump-sum payments', lineRef: '13000' }]),
      cur('C', 'Death benefits', [{ kind: 'income', category: 'death_benefits', description: 'RL-2 box C death benefits', lineRef: '13000' }]),
      cur('E', 'Quebec income tax withheld', [{ kind: 'income', category: 'quebec_tax_withheld', description: 'RL-2 box E Quebec tax withheld', lineRef: '43700', asWithholding: true }])
    ]
  },
  {
    code: 'RL3',
    name: 'RL-3 — Investment Income (Revenu Québec)',
    payerLabel: 'Payer name',
    boxes: [
      cur('A', 'Interest income', [{ kind: 'income', category: 'interest_income', description: 'RL-3 box A interest income', lineRef: '12100' }]),
      cur('B', 'Dividend income', [{ kind: 'income', category: 'dividend_income', description: 'RL-3 box B dividend income', lineRef: '12010' }]),
      cur('C', 'Capital gains dividends', [{ kind: 'income', category: 'capital_gains_dividends', description: 'RL-3 box C capital gains dividends', lineRef: '12700' }]),
      cur('E', 'Quebec income tax withheld', [{ kind: 'income', category: 'quebec_tax_withheld', description: 'RL-3 box E Quebec tax withheld', lineRef: '43700', asWithholding: true }])
    ]
  },
  {
    code: 'RL5',
    name: 'RL-5 — Income Support Payments (Revenu Québec)',
    payerLabel: 'Issuer name',
    boxes: [
      cur('A', 'Social assistance payments', [{ kind: 'income', category: 'social_assistance', description: 'RL-5 box A social assistance', lineRef: '14500' }]),
      cur('B', "Workers' compensation benefits", [{ kind: 'income', category: 'workers_compensation', description: "RL-5 box B workers' compensation", lineRef: '14400' }]),
      cur('C', 'Quebec income tax withheld', [{ kind: 'income', category: 'quebec_tax_withheld', description: 'RL-5 box C Quebec tax withheld', lineRef: '43700', asWithholding: true }])
    ]
  },
  {
    code: 'RL6',
    name: 'RL-6 — Self-Employment and Other Income (Revenu Québec)',
    payerLabel: 'Payer name',
    boxes: [
      cur('A', 'Self-employment income', [{ kind: 'income', category: 'self_employed_commissions', description: 'RL-6 box A self-employment income', lineRef: '13500' }]),
      cur('B', 'Professional fees', [{ kind: 'income', category: 'professional_fees', description: 'RL-6 box B professional fees', lineRef: '13500' }]),
      cur('C', 'Other income', [{ kind: 'income', category: 'other_income', description: 'RL-6 box C other income', lineRef: '13000' }]),
      cur('E', 'Quebec income tax withheld', [{ kind: 'income', category: 'quebec_tax_withheld', description: 'RL-6 box E Quebec tax withheld', lineRef: '43700', asWithholding: true }])
    ]
  }
]

export const COMPLETE_SLIP_DEFINITIONS_BY_CODE = Object.fromEntries(
  COMPLETE_SLIP_DEFINITIONS.map((d) => [d.code, d])
)

/** Minimum expected box counts for audit tooling. */
export const COMPLETE_SLIP_MIN_BOX_COUNTS = {
  T4: 25,
  T5: 18,
  T3: 18,
  T4A: 20,
  T4E: 7,
  T4RSP: 8,
  T4RIF: 5,
  T5008: 5,
  T2202: 5,
  T5007: 6,
  T5013: 12,
  T4PS: 7,
  T4FHSA: 6,
  NR4: 8,
  T4AOAS: 6,
  'T4A(OAS)': 6,
  T4AP: 8,
  'T4A(P)': 8,
  RL1: 6,
  RL2: 4,
  RL3: 4,
  RL5: 3,
  RL6: 4
}

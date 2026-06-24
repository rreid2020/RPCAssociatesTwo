function txt (code, label, options = {}) {
  return { code, label, type: 'text', ...options }
}

function cur (code, label, options = {}) {
  return {
    code,
    label,
    type: 'currency',
    lineRef: options.lineRef || code,
    ...options
  }
}

function computed (code, label, options = {}) {
  return {
    code,
    label,
    type: 'computed',
    lineRef: options.lineRef || code,
    compute: options.compute,
    readOnly: true
  }
}

/** Authoritative CRA schedule worksheet field schemas for Return Builder data entry. */
export const COMPLETE_FORM_WORKSHEET_DEFINITIONS = [
  {
    code: 'T2125',
    name: 'Statement of Business or Professional Activities',
    registryTitle: 'T2125 Statement of Business or Professional Activities',
    landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html',
    formFamily: 't1_form',
    sections: [
      {
        id: 'identification',
        title: 'Business identification',
        description: 'Business name, industry, and fiscal period details from Part 1 of the T2125.',
        fields: [
          txt('business_name', 'Business name'),
          txt('business_number', 'Business number (BN)'),
          txt('main_product_service', 'Main product or service'),
          txt('industry_code', 'Industry code (NAICS)'),
          txt('fiscal_period_from', 'Fiscal period from (YYYY-MM-DD)'),
          txt('fiscal_period_to', 'Fiscal period to (YYYY-MM-DD)')
        ]
      },
      {
        id: 'income',
        title: 'Business income',
        description: 'Gross business income before expenses.',
        fields: [
          cur('8299', 'Gross sales, commissions, and fees', {
            lineRef: '8299',
            targets: [{ kind: 'income', category: 'business_gross_income', lineRef: '8299', scheduleRef: 'T2125' }]
          }),
          cur('8230', 'Other income', {
            lineRef: '8230',
            targets: [{ kind: 'income', category: 'business_other_income', lineRef: '8230', scheduleRef: 'T2125' }]
          })
        ]
      },
      {
        id: 'expenses',
        title: 'Business expenses',
        description: 'Allowable business expenses claimed on the T2125.',
        fields: [
          cur('8521', 'Advertising', { lineRef: '8521' }),
          cur('8523', 'Meals and entertainment', { lineRef: '8523' }),
          cur('8690', 'Insurance', { lineRef: '8690' }),
          cur('8710', 'Interest and bank charges', { lineRef: '8710' }),
          cur('8760', 'Business taxes, licences, and memberships', { lineRef: '8760' }),
          cur('8810', 'Office expenses', { lineRef: '8810' }),
          cur('8811', 'Office stationery and supplies', { lineRef: '8811' }),
          cur('8860', 'Professional fees', { lineRef: '8860' }),
          cur('8871', 'Management and administration fees', { lineRef: '8871' }),
          cur('8910', 'Rent', { lineRef: '8910' }),
          cur('8960', 'Repairs and maintenance', { lineRef: '8960' }),
          cur('9060', 'Salaries, wages, and benefits', { lineRef: '9060' }),
          cur('9180', 'Property taxes', { lineRef: '9180' }),
          cur('9200', 'Travel expenses', { lineRef: '9200' }),
          cur('9220', 'Utilities', { lineRef: '9220' }),
          cur('9275', 'Motor vehicle expenses (not including CCA)', { lineRef: '9275' }),
          cur('9281', 'Capital cost allowance (CCA)', { lineRef: '9281' }),
          cur('9282', 'Other expenses', { lineRef: '9282' }),
          computed('9368', 'Total expenses', {
            lineRef: '9368',
            compute: 'sum_expenses'
          })
        ]
      },
      {
        id: 'summary',
        title: 'Net business income',
        description: 'Net income flows to federal line 13500 on the T1 return.',
        fields: [
          computed('9946', 'Net income (loss) before adjustments', {
            lineRef: '9946',
            compute: 'net_income',
            targets: [{ kind: 'income', category: 'business_income', lineRef: '13500', scheduleRef: 'T2125' }]
          })
        ]
      }
    ]
  }
]

export const T2125_EXPENSE_FIELD_CODES = [
  '8521', '8523', '8690', '8710', '8760', '8810', '8811', '8860', '8871',
  '8910', '8960', '9060', '9180', '9200', '9220', '9275', '9281', '9282'
]

export const T2125_INCOME_FIELD_CODES = ['8299', '8230']

export function computeT2125Totals (values = {}) {
  const n = (key) => {
    const raw = values[key]
    const out = Number(raw || 0)
    return Number.isFinite(out) ? out : 0
  }
  const grossIncome = T2125_INCOME_FIELD_CODES.reduce((sum, code) => sum + n(code), 0)
  const totalExpenses = T2125_EXPENSE_FIELD_CODES.reduce((sum, code) => sum + n(code), 0)
  const netIncome = grossIncome - totalExpenses
  return { grossIncome, totalExpenses, netIncome }
}

function sumFieldCodes (values, codes) {
  return codes.reduce((sum, code) => {
    const out = Number(values[code] || 0)
    return sum + (Number.isFinite(out) ? out : 0)
  }, 0)
}

function incomeExpenseTotals (values, incomeCodes, expenseCodes) {
  const grossIncome = sumFieldCodes(values, incomeCodes)
  const totalExpenses = sumFieldCodes(values, expenseCodes)
  return { grossIncome, totalExpenses, netIncome: grossIncome - totalExpenses }
}

const RENTAL_EXPENSE_CODES = [
  '8521', '8690', '8710', '8760', '8810', '8860', '8871', '8960', '9180', '9220', '9275', '9281', '9282'
]
const FISHING_EXPENSE_CODES = [
  '8521', '8690', '8710', '8760', '8810', '8860', '8910', '8960', '9060', '9180', '9200', '9220', '9275', '9281', '9282'
]
const FARMING_EXPENSE_CODES = [
  '8521', '8690', '8710', '8760', '8810', '8860', '8910', '8960', '9060', '9180', '9200', '9220', '9275', '9281', '9282'
]
const EMPLOYMENT_EXPENSE_CODES = [
  '9281', '9282', '9283', '9284', '9285', '9286', '9287', '9288', '9289', '9290'
]

export function computeT776Totals (values = {}) {
  return incomeExpenseTotals(values, ['8141', '8230'], RENTAL_EXPENSE_CODES)
}

export function computeT777Totals (values = {}) {
  const totalExpenses = sumFieldCodes(values, EMPLOYMENT_EXPENSE_CODES)
  return { grossIncome: 0, totalExpenses, netIncome: totalExpenses }
}

export function computeT2121Totals (values = {}) {
  return incomeExpenseTotals(values, ['8299', '8230'], FISHING_EXPENSE_CODES)
}

export function computeT2042Totals (values = {}) {
  return incomeExpenseTotals(values, ['8299', '8230'], FARMING_EXPENSE_CODES)
}

export function computeT778Totals (values = {}) {
  const totalClaim = sumFieldCodes(values, ['total_eligible', 'total_disabled', 'total_overnight'])
  return { totalClaim, netIncome: totalClaim, grossIncome: 0, totalExpenses: totalClaim }
}

COMPLETE_FORM_WORKSHEET_DEFINITIONS.push(
  {
    code: 'T776',
    name: 'Statement of Real Estate Rentals',
    registryTitle: 'T776 Statement of Real Estate Rentals',
    landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t776.html',
    formFamily: 't1_form',
    sections: [
      {
        id: 'identification',
        title: 'Rental property identification',
        fields: [
          txt('property_address', 'Rental property address'),
          txt('units', 'Number of units', { type: 'text' }),
          txt('ownership_percent', 'Your % of ownership')
        ]
      },
      {
        id: 'income',
        title: 'Rental income',
        fields: [
          cur('8141', 'Gross rent', {
            lineRef: '8141',
            targets: [{ kind: 'income', category: 'rental_gross_income', lineRef: '8141', scheduleRef: 'T776' }]
          }),
          cur('8230', 'Other rental income', { lineRef: '8230' })
        ]
      },
      {
        id: 'expenses',
        title: 'Rental expenses',
        fields: [
          cur('8521', 'Advertising', { lineRef: '8521' }),
          cur('8690', 'Insurance', { lineRef: '8690' }),
          cur('8710', 'Interest and bank charges', { lineRef: '8710' }),
          cur('8760', 'Property taxes, licences, and memberships', { lineRef: '8760' }),
          cur('8810', 'Office expenses', { lineRef: '8810' }),
          cur('8860', 'Professional fees', { lineRef: '8860' }),
          cur('8871', 'Management and administration fees', { lineRef: '8871' }),
          cur('8960', 'Repairs and maintenance', { lineRef: '8960' }),
          cur('9180', 'Property taxes', { lineRef: '9180' }),
          cur('9220', 'Utilities', { lineRef: '9220' }),
          cur('9275', 'Motor vehicle expenses (not including CCA)', { lineRef: '9275' }),
          cur('9281', 'Capital cost allowance (CCA)', { lineRef: '9281' }),
          cur('9282', 'Other expenses', { lineRef: '9282' }),
          computed('9368', 'Total expenses', { lineRef: '9368', compute: 'sum_expenses' })
        ]
      },
      {
        id: 'summary',
        title: 'Net rental income',
        fields: [
          computed('9946', 'Net rental income (loss)', {
            lineRef: '9946',
            compute: 'net_income',
            targets: [{ kind: 'income', category: 'rental_income', lineRef: '12600', scheduleRef: 'T776' }]
          })
        ]
      }
    ]
  },
  {
    code: 'T777',
    name: 'Statement of Employment Expenses',
    registryTitle: 'T777 Statement of Employment Expenses',
    landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t777.html',
    formFamily: 't1_form',
    sections: [
      {
        id: 'identification',
        title: 'Employment details',
        fields: [
          txt('employer_name', 'Employer name'),
          txt('occupation', 'Occupation'),
          txt('t2200_on_file', 'Form T2200 on file (yes/no)')
        ]
      },
      {
        id: 'expenses',
        title: 'Allowable employment expenses',
        description: 'Expenses deductible against employment income (line 22900).',
        fields: [
          cur('9281', 'Fuel and oil (motor vehicle)', { lineRef: '9281' }),
          cur('9282', 'Maintenance and repairs (motor vehicle)', { lineRef: '9282' }),
          cur('9283', 'Licence and insurance (motor vehicle)', { lineRef: '9283' }),
          cur('9284', 'Interest (motor vehicle)', { lineRef: '9284' }),
          cur('9285', 'Leasing costs (motor vehicle)', { lineRef: '9285' }),
          cur('9286', 'Parking and tolls', { lineRef: '9286' }),
          cur('9287', 'Supplies', { lineRef: '9287' }),
          cur('9288', 'Other expenses', { lineRef: '9288' }),
          cur('9289', 'Accounting and legal fees', { lineRef: '9289' }),
          cur('9290', 'Travel expenses', { lineRef: '9290' }),
          computed('9368', 'Total employment expenses', { lineRef: '9368', compute: 'sum_expenses' })
        ]
      }
    ]
  },
  {
    code: 'T2121',
    name: 'Statement of Fishing Activities',
    registryTitle: 'T2121 Statement of Fishing Activities',
    landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2121.html',
    formFamily: 't1_form',
    sections: [
      {
        id: 'identification',
        title: 'Fishing operation identification',
        fields: [
          txt('operation_name', 'Fishing operation name'),
          txt('species', 'Main species fished'),
          txt('fiscal_period_from', 'Fiscal period from (YYYY-MM-DD)'),
          txt('fiscal_period_to', 'Fiscal period to (YYYY-MM-DD)')
        ]
      },
      {
        id: 'income',
        title: 'Fishing income',
        fields: [
          cur('8299', 'Gross fishing income', { lineRef: '8299' }),
          cur('8230', 'Other fishing income', { lineRef: '8230' })
        ]
      },
      {
        id: 'expenses',
        title: 'Fishing expenses',
        fields: FISHING_EXPENSE_CODES.map((code) => {
          const labels = {
            '8521': 'Advertising',
            '8690': 'Insurance',
            '8710': 'Interest and bank charges',
            '8760': 'Licences and memberships',
            '8810': 'Office expenses',
            '8860': 'Professional fees',
            '8910': 'Rent',
            '8960': 'Repairs and maintenance',
            '9060': 'Salaries, wages, and benefits',
            '9180': 'Property taxes',
            '9200': 'Travel expenses',
            '9220': 'Utilities',
            '9275': 'Motor vehicle expenses',
            '9281': 'Capital cost allowance (CCA)',
            '9282': 'Other expenses'
          }
          return cur(code, labels[code] || code, { lineRef: code })
        }).concat([
          computed('9368', 'Total expenses', { lineRef: '9368', compute: 'sum_expenses' })
        ])
      },
      {
        id: 'summary',
        title: 'Net fishing income',
        fields: [
          computed('9946', 'Net fishing income (loss)', {
            lineRef: '9946',
            compute: 'net_income',
            targets: [{ kind: 'income', category: 'fishing_income', lineRef: '14300', scheduleRef: 'T2121' }]
          })
        ]
      }
    ]
  },
  {
    code: 'T2042',
    name: 'Statement of Farming Activities',
    registryTitle: 'T2042 Statement of Farming Activities',
    landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2042.html',
    formFamily: 't1_form',
    sections: [
      {
        id: 'identification',
        title: 'Farm identification',
        fields: [
          txt('farm_name', 'Farm name'),
          txt('main_product', 'Main farm product'),
          txt('fiscal_period_from', 'Fiscal period from (YYYY-MM-DD)'),
          txt('fiscal_period_to', 'Fiscal period to (YYYY-MM-DD)')
        ]
      },
      {
        id: 'income',
        title: 'Farm income',
        fields: [
          cur('8299', 'Gross farm income', { lineRef: '8299' }),
          cur('8230', 'Other farm income', { lineRef: '8230' })
        ]
      },
      {
        id: 'expenses',
        title: 'Farm expenses',
        fields: FARMING_EXPENSE_CODES.map((code) => cur(code, `Farm expense ${code}`, { lineRef: code })).concat([
          computed('9368', 'Total expenses', { lineRef: '9368', compute: 'sum_expenses' })
        ])
      },
      {
        id: 'summary',
        title: 'Net farming income',
        fields: [
          computed('9946', 'Net farming income (loss)', {
            lineRef: '9946',
            compute: 'net_income',
            targets: [{ kind: 'income', category: 'farming_income', lineRef: '14100', scheduleRef: 'T2042' }]
          })
        ]
      }
    ]
  },
  {
    code: 'T778',
    name: 'Child Care Expenses Deduction',
    registryTitle: 'T778 Child Care Expenses Deduction',
    landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t778.html',
    formFamily: 't1_form',
    sections: [
      {
        id: 'childcare',
        title: 'Child care expenses',
        description: 'Eligible child care expenses deductible on line 21400.',
        fields: [
          cur('total_eligible', 'Total eligible child care expenses', { lineRef: '21400' }),
          cur('total_disabled', 'Additional amount for eligible dependant with disability', { lineRef: '21400' }),
          cur('total_overnight', 'Overnight camp and boarding school', { lineRef: '21400' }),
          computed('total_claim', 'Total child care deduction claim', {
            lineRef: '21400',
            compute: 'sum_expenses',
            targets: [{ kind: 'deduction', category: 'child_care_expenses', lineRef: '21400', scheduleRef: 'T778' }]
          })
        ]
      }
    ]
  }
)

export const SCHEDULE_3_GAIN_FIELD_CODES = [
  'gain_loss_1', 'gain_loss_2', 'gain_loss_3', 'capital_gains_dividends', 'other_capital_gains'
]
export const SCHEDULE_3_LOSS_FIELD_CODES = ['allowable_capital_loss', 'prior_year_losses_applied']

export function computeSchedule3Totals (values = {}) {
  const totalGains = sumFieldCodes(values, SCHEDULE_3_GAIN_FIELD_CODES)
  const totalLosses = sumFieldCodes(values, SCHEDULE_3_LOSS_FIELD_CODES)
  const netIncome = totalGains - totalLosses
  return { grossIncome: totalGains, totalExpenses: totalLosses, netIncome: Math.max(0, netIncome) }
}

export const SCHEDULE_7_CONTRIBUTION_FIELD_CODES = [
  'rrsp_contributions_current_year', 'rrsp_contributions_first_60_days', 'rrsp_spousal_contributions'
]

export function computeSchedule7Totals (values = {}) {
  const totalDeduction = Number(values.rrsp_deduction_claimed || 0) || sumFieldCodes(values, SCHEDULE_7_CONTRIBUTION_FIELD_CODES)
  return { totalDeduction, netIncome: totalDeduction, grossIncome: 0, totalExpenses: totalDeduction }
}

export const SCHEDULE_9_DONATION_FIELD_CODES = ['donations_cash', 'donations_kind', 'donations_carryforward']

export function computeSchedule9Totals (values = {}) {
  const totalClaim = sumFieldCodes(values, SCHEDULE_9_DONATION_FIELD_CODES)
  return { totalClaim, netIncome: totalClaim, grossIncome: 0, totalExpenses: totalClaim }
}

export const SCHEDULE_11_TUITION_FIELD_CODES = ['tuition_eligible', 'tuition_received_transfer']

export function computeSchedule11Totals (values = {}) {
  const eligible = sumFieldCodes(values, SCHEDULE_11_TUITION_FIELD_CODES)
  const transferredOut = Number(values.tuition_transferred_out || 0)
  const totalClaim = Math.max(0, eligible - transferredOut)
  return { totalClaim, netIncome: totalClaim, grossIncome: 0, totalExpenses: totalClaim }
}

export const ON479_CREDIT_FIELD_CODES = [
  'line_61010', 'line_61070', 'line_61500', 'line_63100', 'line_63640', 'line_63800'
]

export function computeOn479Totals (values = {}) {
  const totalClaim = sumFieldCodes(values, ON479_CREDIT_FIELD_CODES)
  return { totalClaim, netIncome: totalClaim, grossIncome: 0, totalExpenses: totalClaim }
}

COMPLETE_FORM_WORKSHEET_DEFINITIONS.push(
  {
    code: 'Schedule 3',
    name: 'Capital Gains (or Losses)',
    registryTitle: 'Schedule 3 Capital Gains (or Losses)',
    landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-archives/general-income-tax-benefit-package/5000-s3.html',
    formFamily: 't1_schedule',
    sections: [
      {
        id: 'dispositions',
        title: 'Capital property dispositions',
        description: 'Summary of capital gains and losses for the year.',
        fields: [
          txt('property_1', 'Property 1 — description'),
          cur('gain_loss_1', 'Property 1 — gain (loss)', { lineRef: 'gain_loss' }),
          txt('property_2', 'Property 2 — description'),
          cur('gain_loss_2', 'Property 2 — gain (loss)', { lineRef: 'gain_loss' }),
          txt('property_3', 'Property 3 — description'),
          cur('gain_loss_3', 'Property 3 — gain (loss)', { lineRef: 'gain_loss' }),
          cur('capital_gains_dividends', 'Capital gains dividends', { lineRef: 'capital_gains_dividends' }),
          cur('other_capital_gains', 'Other capital gains', { lineRef: 'other_capital_gains' })
        ]
      },
      {
        id: 'losses',
        title: 'Capital losses',
        fields: [
          cur('allowable_capital_loss', 'Allowable capital loss', { lineRef: 'allowable_capital_loss' }),
          cur('prior_year_losses_applied', 'Prior-year net capital losses applied', { lineRef: 'prior_year_losses' })
        ]
      },
      {
        id: 'summary',
        title: 'Taxable capital gains',
        fields: [
          computed('taxable_capital_gains', 'Taxable capital gains (T1 line 12700)', {
            lineRef: '12700',
            compute: 'net_income',
            targets: [{ kind: 'income', category: 'capital_gains', lineRef: '12700', scheduleRef: 'Schedule 3' }]
          })
        ]
      }
    ]
  },
  {
    code: 'Schedule 7',
    name: 'RRSP, PRPP, and SPP Unused Contributions and HBP/LLP',
    registryTitle: 'Schedule 7 RRSP and PRPP',
    landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-archives/general-income-tax-benefit-package/5000-s7.html',
    formFamily: 't1_schedule',
    sections: [
      {
        id: 'room',
        title: 'RRSP deduction room',
        fields: [
          cur('rrsp_unused_at_start', 'Unused RRSP contributions at start of year', { lineRef: 'unused_start' }),
          cur('pension_adjustment', 'Pension adjustment', { lineRef: 'pension_adjustment' }),
          cur('rrsp_deduction_limit', 'RRSP deduction limit for the year', { lineRef: 'deduction_limit' })
        ]
      },
      {
        id: 'contributions',
        title: 'Contributions',
        fields: [
          cur('rrsp_contributions_current_year', 'Contributions made in the year', { lineRef: 'contributions' }),
          cur('rrsp_contributions_first_60_days', 'Contributions in first 60 days of next year', { lineRef: 'contributions_60_days' }),
          cur('rrsp_spousal_contributions', 'Spousal RRSP contributions', { lineRef: 'spousal_contributions' })
        ]
      },
      {
        id: 'claim',
        title: 'RRSP deduction claimed',
        fields: [
          cur('rrsp_deduction_claimed', 'RRSP deduction claimed this year', {
            lineRef: '20800',
            targets: [{ kind: 'deduction', category: 'rrsp', lineRef: '20800', scheduleRef: 'Schedule 7' }]
          })
        ]
      }
    ]
  },
  {
    code: 'Schedule 9',
    name: 'Donations and Gifts',
    registryTitle: 'Schedule 9 Donations and Gifts',
    landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-archives/general-income-tax-benefit-package/5000-s9.html',
    formFamily: 't1_schedule',
    sections: [
      {
        id: 'donations',
        title: 'Donations and gifts',
        description: 'Eligible charitable donations and gifts for the non-refundable tax credit (line 34900).',
        fields: [
          cur('donations_cash', 'Cash donations', { lineRef: 'donations_cash' }),
          cur('donations_kind', 'Gifts of capital property or ecologically sensitive land', { lineRef: 'donations_kind' }),
          cur('donations_carryforward', 'Unused donations carried forward', { lineRef: 'donations_carryforward' }),
          computed('total_donations_claim', 'Total donations claim (line 34900)', {
            lineRef: '34900',
            compute: 'sum_expenses',
            targets: [{ kind: 'deduction', category: 'donations', lineRef: '34900', scheduleRef: 'Schedule 9' }]
          })
        ]
      }
    ]
  },
  {
    code: 'Schedule 11',
    name: 'Tuition, Education, and Textbook Amounts',
    registryTitle: 'Schedule 11 Tuition Amounts',
    landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-archives/general-income-tax-benefit-package/5000-s11.html',
    formFamily: 't1_schedule',
    sections: [
      {
        id: 'tuition',
        title: 'Tuition amounts',
        description: 'Eligible tuition fees from T2202 and transfers (line 32300).',
        fields: [
          cur('tuition_eligible', 'Eligible tuition fees (from T2202)', { lineRef: 'tuition_eligible' }),
          cur('tuition_received_transfer', 'Tuition transferred from child or spouse', { lineRef: 'tuition_received' }),
          cur('tuition_transferred_out', 'Tuition amount transferred to spouse, parent, or grandparent', { lineRef: 'tuition_transferred' }),
          computed('tuition_amount_claimed', 'Tuition amount claimed (line 32300)', {
            lineRef: '32300',
            compute: 'net_income',
            targets: [{ kind: 'deduction', category: 'tuition_amount', lineRef: '32300', scheduleRef: 'Schedule 11' }]
          })
        ]
      }
    ]
  },
  {
    code: 'T2200',
    name: 'Declaration of Conditions of Employment',
    registryTitle: 'T2200 Declaration of Conditions of Employment',
    landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2200.html',
    formFamily: 't1_form',
    sections: [
      {
        id: 'employer',
        title: 'Employer declaration',
        fields: [
          txt('employer_name', 'Employer name'),
          txt('employer_address', 'Employer address'),
          txt('employee_name', 'Employee name'),
          txt('employee_occupation', 'Employee occupation'),
          txt('employment_period', 'Period of employment')
        ]
      },
      {
        id: 'conditions',
        title: 'Conditions of employment',
        description: 'Employer confirms the employee was required to pay these expenses to earn employment income (supports T777).',
        fields: [
          txt('expenses_required', 'Required to pay expenses not reimbursed (yes/no)'),
          txt('motor_vehicle_required', 'Required to use a motor vehicle for employment (yes/no)'),
          txt('travel_required', 'Required to travel away from the employer\'s place of business (yes/no)'),
          txt('home_office_required', 'Required to have a home office (yes/no)'),
          txt('supplies_required', 'Required to pay for supplies used directly in work (yes/no)'),
          txt('employer_signed', 'Form signed by authorized employer representative (yes/no)')
        ]
      }
    ]
  },
  {
    code: 'ON479',
    name: 'Ontario Credits',
    registryTitle: 'ON479 Ontario Tax Credits',
    landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-archives/general-income-tax-benefit-package/5000-on479.html',
    formFamily: 't1_form',
    sections: [
      {
        id: 'ontario_credits',
        title: 'Ontario tax credits',
        description: 'Common Ontario non-refundable tax credits (flows to provincial line 47900).',
        fields: [
          cur('line_61010', 'Low-income individuals and families tax credit (line 61010)', { lineRef: '61010' }),
          cur('line_61070', 'Community food program donation tax credit (line 61070)', { lineRef: '61070' }),
          cur('line_61500', 'Ontario energy and property tax credit (line 61500)', { lineRef: '61500' }),
          cur('line_63100', 'Ontario seniors\' public transit tax credit (line 63100)', { lineRef: '63100' }),
          cur('line_63640', 'Ontario child care tax credit (line 63640)', { lineRef: '63640' }),
          cur('line_63800', 'Ontario jobs training tax credit (line 63800)', { lineRef: '63800' }),
          computed('total_ontario_credits', 'Total Ontario credits (line 47900)', {
            lineRef: '47900',
            compute: 'sum_expenses',
            targets: [{ kind: 'deduction', category: 'provincial_tax_credits', lineRef: '47900', scheduleRef: 'ON479' }]
          })
        ]
      }
    ]
  }
)

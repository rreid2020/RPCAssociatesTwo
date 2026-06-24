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

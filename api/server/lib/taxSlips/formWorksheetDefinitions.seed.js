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

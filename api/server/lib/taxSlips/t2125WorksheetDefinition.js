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

/** CRA T2125 (25) line-aligned worksheet — Parts 1–9, Areas A–G, Charts A–C (summary fields). */
export const T2125_WORKSHEET_DEFINITION = {
  code: 'T2125',
  name: 'Statement of Business or Professional Activities',
  registryTitle: 'T2125 Statement of Business or Professional Activities',
  landingUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html',
  formFamily: 't1_form',
  sections: [
    {
      id: 'part1_identification',
      title: 'Part 1 — Identification',
      fields: [
        txt('taxpayer_name', 'Your name'),
        txt('sin', 'Social insurance number'),
        txt('business_name', 'Business name'),
        txt('business_number', 'Business number (BN)'),
        txt('business_address', 'Business address'),
        txt('business_city', 'City'),
        txt('business_province', 'Prov./Terr.'),
        txt('business_postal', 'Postal code'),
        txt('fiscal_period_from', 'Fiscal period from (YYYYMMDD)'),
        txt('fiscal_period_to', 'Fiscal period to (YYYYMMDD)'),
        txt('last_year_of_business', 'Was this your last year of business? (yes/no)'),
        txt('main_product_service', 'Main product or service'),
        txt('industry_code', 'Industry code (NAICS)'),
        txt('accounting_method', 'Accounting method (cash/accrual)'),
        txt('tax_shelter_id', 'Tax shelter identification number'),
        txt('partnership_bn', 'Partnership business number'),
        txt('partnership_percent', 'Your percentage of the partnership (%)'),
        txt('preparer_name_address', 'Name and address of person or firm preparing this form')
      ]
    },
    {
      id: 'part2_internet',
      title: 'Part 2 — Internet business activities',
      fields: [
        txt('internet_page_count', 'Number of Internet web pages/sites earning income (0 if none)'),
        txt('website_url_1', 'Main website address 1'),
        txt('website_url_2', 'Main website address 2'),
        txt('website_url_3', 'Main website address 3'),
        txt('website_url_4', 'Main website address 4'),
        txt('website_url_5', 'Main website address 5'),
        txt('internet_income_percent', 'Percentage of gross income from web pages/sites (%)')
      ]
    },
    {
      id: 'part3a_business_income',
      title: 'Part 3A — Business income',
      description: 'Fill in only if you have business income (not professional income).',
      fields: [
        cur('3A', 'Gross sales, commissions, or fees (include GST/HST)', { lineRef: '3A' }),
        cur('3B', 'GST/HST, PST, returns, allowances, and discounts (included in 3A)', { lineRef: '3B' }),
        computed('3C', 'Subtotal: 3A minus 3B', { lineRef: '3C', compute: 't2125_3c' }),
        cur('3D', 'GST/HST collected on sales eligible for quick method', { lineRef: '3D' }),
        cur('3E', 'GST/HST remitted (quick method)', { lineRef: '3E' }),
        computed('3F', 'Subtotal: 3D minus 3E', { lineRef: '3F', compute: 't2125_3f' }),
        computed('3G', 'Adjusted gross sales (3C plus 3F) — enter on line 8000', { lineRef: '3G', compute: 't2125_3g' })
      ]
    },
    {
      id: 'part3b_professional_income',
      title: 'Part 3B — Professional income',
      description: 'Fill in only if you have professional income (not business income).',
      fields: [
        cur('3H', 'Gross professional fees including WIP and GST/HST', { lineRef: '3H' }),
        cur('3I', 'GST/HST, PST, returns, allowances, and discounts (included in 3H)', { lineRef: '3I' }),
        computed('3J', 'Subtotal: 3H minus 3I', { lineRef: '3J', compute: 't2125_3j' }),
        cur('3K', 'GST/HST collected on fees eligible for quick method', { lineRef: '3K' }),
        cur('3L', 'GST/HST remitted (quick method)', { lineRef: '3L' }),
        computed('3M', 'Subtotal: 3K minus 3L', { lineRef: '3M', compute: 't2125_3m' }),
        computed('3N', 'Adjusted professional fees (3J plus 3M) — enter on line 8000', { lineRef: '3N', compute: 't2125_3n' })
      ]
    },
    {
      id: 'part3c_gross_income',
      title: 'Part 3C — Gross business or professional income',
      fields: [
        cur('8000', 'Adjusted gross sales (3G) or adjusted professional fees (3N)', { lineRef: '8000' }),
        cur('8290', 'Reserves deducted last year', { lineRef: '8290' }),
        txt('8230_description', 'Other income — description'),
        cur('8230', 'Other income', { lineRef: '8230' }),
        computed('8299', 'Gross business or professional income (8000 + 8290 + 8230)', {
          lineRef: '8299',
          compute: 't2125_8299',
          targets: [{ kind: 'income', category: 'business_gross_income', lineRef: '8299', scheduleRef: 'T2125' }]
        }),
        txt('income_report_line', 'Report on T1 line: business (13499) / professional (13699) / commission (13899)')
      ]
    },
    {
      id: 'part3d_cogs',
      title: 'Part 3D — Cost of goods sold and gross profit',
      description: 'Business income only. Enter only the business part of costs.',
      fields: [
        cur('8300', 'Opening inventory', { lineRef: '8300' }),
        cur('8320', 'Purchases during the year (net of returns)', { lineRef: '8320' }),
        cur('8340', 'Direct wage costs', { lineRef: '8340' }),
        cur('8360', 'Subcontracts', { lineRef: '8360' }),
        cur('8450', 'Other costs', { lineRef: '8450' }),
        cur('8500', 'Closing inventory', { lineRef: '8500' }),
        computed('8518', 'Cost of goods sold', { lineRef: '8518', compute: 't2125_8518' }),
        computed('8519', 'Gross profit (loss): line 8299 minus 8518', { lineRef: '8519', compute: 't2125_8519' })
      ]
    },
    {
      id: 'part4_expenses',
      title: 'Part 4 — Net income (loss) before adjustments',
      description: 'Expenses (business part only). Line numbers match CRA Form T2125.',
      fields: [
        computed('4A', 'Gross income (8299) or gross profit (8519)', { lineRef: '4A', compute: 't2125_4a' }),
        cur('8521', 'Advertising', { lineRef: '8521' }),
        cur('8523', 'Meals and entertainment', { lineRef: '8523' }),
        cur('8590', 'Bad debts', { lineRef: '8590' }),
        cur('8690', 'Insurance', { lineRef: '8690' }),
        cur('8710', 'Interest and bank charges', { lineRef: '8710' }),
        cur('8760', 'Business taxes, licences, and memberships', { lineRef: '8760' }),
        cur('8810', 'Office expenses', { lineRef: '8810' }),
        cur('8811', 'Office stationery and supplies', { lineRef: '8811' }),
        cur('8860', 'Professional fees (legal and accounting)', { lineRef: '8860' }),
        cur('8871', 'Management and administration fees', { lineRef: '8871' }),
        cur('8910', 'Rent', { lineRef: '8910' }),
        cur('8960', 'Repairs and maintenance', { lineRef: '8960' }),
        cur('9060', 'Salaries, wages, and benefits (incl. employer contributions)', { lineRef: '9060' }),
        cur('9180', 'Property taxes', { lineRef: '9180' }),
        cur('9200', 'Travel expenses', { lineRef: '9200' }),
        cur('9220', 'Utilities', { lineRef: '9220' }),
        cur('9224', 'Fuel costs (except for motor vehicles)', { lineRef: '9224' }),
        cur('9275', 'Delivery, freight, and express', { lineRef: '9275' }),
        cur('9281', 'Motor vehicle expenses (Chart A amount 16)', { lineRef: '9281' }),
        cur('9936', 'Capital cost allowance (CCA) — Area A total', { lineRef: '9936' }),
        txt('9270_description', 'Other expenses — description'),
        cur('9270', 'Other expenses', { lineRef: '9270' }),
        computed('9368', 'Total expenses (lines 8521–9270)', { lineRef: '9368', compute: 'sum_expenses' }),
        computed('9369', 'Net income (loss) before adjustments: 4A minus 9368', { lineRef: '9369', compute: 't2125_9369' })
      ]
    },
    {
      id: 'part5_net_income',
      title: 'Part 5 — Your net income (loss)',
      fields: [
        cur('5A', 'Your share of line 9369 or T5013 partnership amount', { lineRef: '5A' }),
        cur('5B', 'Canadian journalism labour tax credit (T5013 box 236)', { lineRef: '5B' }),
        cur('9974', 'GST/HST rebate for partners received in the year', { lineRef: '9974' }),
        computed('5C', 'Total: 5A + 5B + 9974', { lineRef: '5C', compute: 't2125_5c' }),
        cur('9943', 'Other amounts deductible from partnership income (Part 6)', { lineRef: '9943' }),
        computed('5D', 'Net income after adjustments: 5C minus 9943', { lineRef: '5D', compute: 't2125_5d' }),
        cur('9945', 'Business-use-of-home expenses (Part 7 amount 7P)', { lineRef: '9945' }),
        computed('9946', 'Your net income (loss): 5D minus 9945', {
          lineRef: '9946',
          compute: 'net_income',
          targets: [{ kind: 'income', category: 'business_income', lineRef: '13500', scheduleRef: 'T2125' }]
        }),
        txt('net_report_line', 'Report net on T1: business (13500) / professional (13700) / commission (13900)')
      ]
    },
    {
      id: 'part6_partnership',
      title: 'Part 6 — Other amounts deductible from partnership income (loss)',
      fields: [
        txt('6A_description', 'Expense 1 — description'),
        cur('6A', 'Expense 1 — amount', { lineRef: '6A' }),
        txt('6B_description', 'Expense 2 — description'),
        cur('6B', 'Expense 2 — amount', { lineRef: '6B' }),
        txt('6C_description', 'Expense 3 — description'),
        cur('6C', 'Expense 3 — amount', { lineRef: '6C' }),
        txt('6D_description', 'Expense 4 — description'),
        cur('6D', 'Expense 4 — amount', { lineRef: '6D' }),
        txt('6E_description', 'Expense 5 — description'),
        cur('6E', 'Expense 5 — amount', { lineRef: '6E' }),
        computed('6F', 'Total Part 6 (enter on line 9943)', { lineRef: '6F', compute: 't2125_6f' })
      ]
    },
    {
      id: 'part7_home_office',
      title: 'Part 7 — Calculating business-use-of-home expenses',
      fields: [
        cur('7A', 'Heat', { lineRef: '7A' }),
        cur('7B', 'Electricity', { lineRef: '7B' }),
        cur('7C', 'Insurance', { lineRef: '7C' }),
        cur('7D', 'Maintenance', { lineRef: '7D' }),
        cur('7E', 'Mortgage interest', { lineRef: '7E' }),
        cur('7F', 'Property taxes', { lineRef: '7F' }),
        cur('7G', 'Other home office expenses', { lineRef: '7G' }),
        computed('7H', 'Subtotal: 7A to 7G', { lineRef: '7H', compute: 't2125_7h' }),
        cur('7I', 'Personal-use part of home expenses', { lineRef: '7I' }),
        computed('7J', 'Subtotal: 7H minus 7I', { lineRef: '7J', compute: 't2125_7j' }),
        cur('7K', 'CCA (business part only)', { lineRef: '7K' }),
        cur('7L', 'Amount carried forward from previous year', { lineRef: '7L' }),
        computed('7M', 'Subtotal: 7J + 7K + 7L', { lineRef: '7M', compute: 't2125_7m' }),
        cur('7N', 'Net income after adjustments (5D) — if negative enter 0', { lineRef: '7N' }),
        computed('7O', 'Home expenses available to carry forward', { lineRef: '7O', compute: 't2125_7o' }),
        computed('7P', 'Allowable claim (enter on line 9945)', { lineRef: '7P', compute: 't2125_7p' })
      ]
    },
    {
      id: 'part8_partners',
      title: 'Part 8 — Details of other partners',
      description: 'Do not complete if filing a partnership information return.',
      fields: [
        txt('partner1_name', 'Partner 1 — name'),
        txt('partner1_address', 'Partner 1 — address'),
        txt('partner1_province', 'Partner 1 — Prov./Terr.'),
        txt('partner1_postal', 'Partner 1 — postal code'),
        cur('partner1_share', 'Partner 1 — share of net income (loss)', { lineRef: 'partner1_share' }),
        txt('partner1_percent', 'Partner 1 — percentage of partnership (%)'),
        txt('partner2_name', 'Partner 2 — name'),
        txt('partner2_address', 'Partner 2 — address'),
        cur('partner2_share', 'Partner 2 — share of net income (loss)', { lineRef: 'partner2_share' }),
        txt('partner2_percent', 'Partner 2 — percentage of partnership (%)')
      ]
    },
    {
      id: 'part9_equity',
      title: 'Part 9 — Details of equity',
      fields: [
        cur('9931', 'Total business liabilities', { lineRef: '9931' }),
        cur('9932', 'Drawings in the current year', { lineRef: '9932' }),
        cur('9933', 'Capital contributions in the current year', { lineRef: '9933' })
      ]
    },
    {
      id: 'area_a_cca',
      title: 'Area A — Capital cost allowance (CCA) claim',
      description: 'Enter the total CCA claim from Area A column 21 on line 9936 in Part 4. Full class grid entry is recorded in supporting schedules.',
      fields: [
        cur('area_a_total_cca', 'Total CCA claim for the year (Area A column 21 total)', { lineRef: '9936' }),
        cur('area_a_immediate_expensing', 'Total immediate expensing claim (column 9 total)', { lineRef: 'area_a_i' })
      ]
    },
    {
      id: 'areas_b_f',
      title: 'Areas B–F — Asset additions and dispositions',
      fields: [
        cur('9925', 'Total equipment additions (Area B)', { lineRef: '9925' }),
        cur('9927', 'Total building additions (Area C)', { lineRef: '9927' }),
        cur('9926', 'Total equipment dispositions (Area D)', { lineRef: '9926' }),
        cur('9928', 'Total building dispositions (Area E)', { lineRef: '9928' }),
        cur('9923', 'Total cost of land additions (Area F)', { lineRef: '9923' }),
        cur('9924', 'Total proceeds from land dispositions (Area F)', { lineRef: '9924' })
      ]
    },
    {
      id: 'chart_a_motor_vehicle',
      title: 'Chart A — Motor vehicle expenses',
      description: 'Allowable amount (16) flows to line 9281 in Part 4.',
      fields: [
        txt('chart_a_km_business', 'Kilometres driven for business income'),
        txt('chart_a_km_total', 'Total kilometres driven in fiscal period'),
        cur('chart_a_fuel', 'Fuel and oil', { lineRef: 'chart_a_3' }),
        cur('chart_a_interest', 'Interest (Chart B)', { lineRef: 'chart_a_4' }),
        cur('chart_a_insurance', 'Insurance', { lineRef: 'chart_a_5' }),
        cur('chart_a_licence', 'Licence and registration', { lineRef: 'chart_a_6' }),
        cur('chart_a_maintenance', 'Maintenance and repairs', { lineRef: 'chart_a_7' }),
        cur('chart_a_leasing', 'Leasing (Chart C)', { lineRef: 'chart_a_8' }),
        cur('chart_a_electricity', 'Electricity for zero-emission vehicles', { lineRef: 'chart_a_9' }),
        cur('chart_a_other', 'Other motor vehicle expenses', { lineRef: 'chart_a_10' }),
        computed('chart_a_total', 'Total motor vehicle expenses (amount 12)', { lineRef: 'chart_a_12', compute: 't2125_chart_a_12' }),
        computed('chart_a_business_part', 'Business use part (amount 13)', { lineRef: 'chart_a_13', compute: 't2125_chart_a_13' }),
        cur('chart_a_parking', 'Business parking fees', { lineRef: 'chart_a_14' }),
        cur('chart_a_supp_insurance', 'Supplementary business insurance', { lineRef: 'chart_a_15' }),
        computed('chart_a_allowable', 'Allowable motor vehicle expenses (amount 16 → line 9281)', {
          lineRef: 'chart_a_16',
          compute: 't2125_chart_a_16'
        })
      ]
    },
    {
      id: 'chart_b_interest',
      title: 'Chart B — Available interest expense for passenger vehicles',
      fields: [
        cur('chart_b_17', 'Total interest payable or paid in fiscal period', { lineRef: 'chart_b_17' }),
        cur('chart_b_18', 'Available interest expense (amount 17 or 18, whichever is less)', { lineRef: 'chart_b_19' })
      ]
    },
    {
      id: 'chart_c_leasing',
      title: 'Chart C — Eligible leasing cost for passenger vehicles',
      fields: [
        cur('chart_c_20', 'Total lease charges in current fiscal period', { lineRef: 'chart_c_20' }),
        cur('chart_c_21', 'Total lease payments deducted in prior periods', { lineRef: 'chart_c_21' }),
        cur('chart_c_22', 'Total days vehicle was leased (current and prior periods)', { lineRef: 'chart_c_22' }),
        cur('chart_c_23', "Manufacturer's list price", { lineRef: 'chart_c_23' }),
        computed('chart_c_28', 'Eligible leasing cost (amount 28 → Chart A amount 8)', {
          lineRef: 'chart_c_28',
          compute: 't2125_chart_c_28'
        })
      ]
    },
    {
      id: 'area_g_epop',
      title: 'Area G — Agreement between associated EPOPs',
      fields: [
        txt('area_g_associated', 'Associated with EPOPs under Reg. 1104(3.3)? (yes/no)'),
        txt('area_g_epop1_name', 'EPOP 1 — name'),
        txt('area_g_epop1_id', 'EPOP 1 — identification number'),
        txt('area_g_epop1_percent', 'EPOP 1 — percentage assigned (%)'),
        computed('area_g_iii', 'Immediate expensing limit allocated to your business', {
          lineRef: 'area_g_iii',
          compute: 't2125_area_g_iii'
        })
      ]
    }
  ]
}

export const T2125_EXPENSE_FIELD_CODES = [
  '8521', '8523', '8590', '8690', '8710', '8760', '8810', '8811', '8860', '8871',
  '8910', '8960', '9060', '9180', '9200', '9220', '9224', '9275', '9281', '9936', '9270'
]

export const T2125_INCOME_FIELD_CODES = ['8000', '8290', '8230', '8299']

export const T2125_PART6_FIELD_CODES = ['6A', '6B', '6C', '6D', '6E']
export const T2125_HOME_OFFICE_FIELD_CODES = ['7A', '7B', '7C', '7D', '7E', '7F', '7G']
export const T2125_CHART_A_EXPENSE_CODES = [
  'chart_a_fuel', 'chart_a_interest', 'chart_a_insurance', 'chart_a_licence',
  'chart_a_maintenance', 'chart_a_leasing', 'chart_a_electricity', 'chart_a_other'
]

function n (values, key) {
  const out = Number(values[key] || 0)
  return Number.isFinite(out) ? out : 0
}

function sumCodes (values, codes) {
  return codes.reduce((sum, code) => sum + n(values, code), 0)
}

export function computeT2125Field (fieldCode, values = {}) {
  switch (fieldCode) {
    case '3C': return n(values, '3A') - n(values, '3B')
    case '3F': return n(values, '3D') - n(values, '3E')
    case '3G': return computeT2125Field('3C', values) + computeT2125Field('3F', values)
    case '3J': return n(values, '3H') - n(values, '3I')
    case '3M': return n(values, '3K') - n(values, '3L')
    case '3N': return computeT2125Field('3J', values) + computeT2125Field('3M', values)
    case '8299': {
      if (values['8299'] != null && values['8299'] !== '' && Number(values['8299']) !== 0) return n(values, '8299')
      const from8000 = n(values, '8000') + n(values, '8290') + n(values, '8230')
      if (from8000 !== 0) return from8000
      const from3G = computeT2125Field('3G', values)
      if (from3G !== 0) return from3G
      return computeT2125Field('3N', values)
    }
    case '8518': {
      const subtotal = sumCodes(values, ['8300', '8320', '8340', '8360', '8450'])
      return subtotal - n(values, '8500')
    }
    case '8519': return computeT2125Field('8299', values) - computeT2125Field('8518', values)
    case '4A':
      if (n(values, '8519')) return n(values, '8519')
      return computeT2125Field('8299', values)
    case '9368': return sumCodes(values, T2125_EXPENSE_FIELD_CODES)
    case '9369': return computeT2125Field('4A', values) - computeT2125Field('9368', values)
    case '5C': return n(values, '5A') + n(values, '5B') + n(values, '9974')
    case '5D': {
      if (values['5D'] != null && values['5D'] !== '' && Number(values['5D']) !== 0) return n(values, '5D')
      const from5 = computeT2125Field('5C', values) - n(values, '9943')
      if (from5 !== 0 || n(values, '5A') || n(values, '5B') || n(values, '9974')) return from5
      return computeT2125Field('9369', values)
    }
    case '6F': return sumCodes(values, T2125_PART6_FIELD_CODES)
    case '7H': return sumCodes(values, T2125_HOME_OFFICE_FIELD_CODES) + n(values, '7G')
    case '7J': return computeT2125Field('7H', values) - n(values, '7I')
    case '7M': return computeT2125Field('7J', values) + n(values, '7K') + n(values, '7L')
    case '7O': return Math.max(0, computeT2125Field('7M', values) - n(values, '7N'))
    case '7P': {
      const m = computeT2125Field('7M', values)
      const netAdj = Math.max(0, n(values, '7N') || computeT2125Field('5D', values))
      return Math.min(m, netAdj)
    }
    case 'chart_a_12': return sumCodes(values, T2125_CHART_A_EXPENSE_CODES)
    case 'chart_a_13': {
      const kmB = n(values, 'chart_a_km_business')
      const kmT = n(values, 'chart_a_km_total')
      if (!kmT) return 0
      return (kmB / kmT) * computeT2125Field('chart_a_12', values)
    }
    case 'chart_a_16':
      return computeT2125Field('chart_a_13', values) + n(values, 'chart_a_parking') + n(values, 'chart_a_supp_insurance')
    case 'chart_c_28':
      return Math.min(
        Math.max(0, n(values, 'chart_c_26')),
        n(values, 'chart_c_27')
      )
    case 'area_g_iii': {
      const pct = n(values, 'area_g_epop1_percent') / 100
      return pct > 0 ? 1_500_000 * pct : 0
    }
    case '9946':
      return computeT2125Field('5D', values) - n(values, '9945')
    default:
      return undefined
  }
}

export function computeT2125Totals (values = {}) {
  const grossIncome = computeT2125Field('8299', values)
  const totalExpenses = computeT2125Field('9368', values)
  const netBeforeAdj = computeT2125Field('9369', values)
  const netIncome = computeT2125Field('9946', values)
  return { grossIncome, totalExpenses, netIncome: netIncome ?? netBeforeAdj }
}

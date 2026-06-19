export const INTERVIEW_TOPICS_VERSION = 1

/**
 * Tax situation interview topics — drives per-taxpayer workspace setup.
 * Each topic maps to slips (data entry) and/or forms & schedules (output).
 */
export const INTERVIEW_TOPIC_CATEGORIES = [
  {
    id: 'specific_situations',
    title: 'Specific situations',
    summary: 'Residency, deceased filers, representatives, and CRA Auto-fill.',
    icon: 'SS',
    topics: [
      {
        id: 'cra_autofill',
        label: 'CRA Auto-fill my return',
        description: 'Import slips and amounts from CRA My Account (when connected).',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Setup'
      },
      {
        id: 'immigrant_emigrant',
        label: 'Immigrant or emigrant in the tax year',
        description: 'Part-year residency, entry or departure dates, and world income.',
        slipCodes: [],
        formCodes: ['T2209'],
        linkedStep: 'Setup'
      },
      {
        id: 'deceased_taxpayer',
        label: 'Filing for a deceased person',
        description: 'Date of death and final return considerations.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Setup'
      },
      {
        id: 'legal_representative',
        label: 'Legal representative or executor',
        description: 'Representative filing authority and related disclosures.',
        slipCodes: [],
        formCodes: ['T1013'],
        linkedStep: 'Setup'
      }
    ]
  },
  {
    id: 'employment',
    title: 'Employment and other benefits',
    summary: 'Employment income, EI, social assistance, and related slips.',
    icon: 'EB',
    topics: [
      {
        id: 'employment_t4',
        label: 'T4 — employment income',
        description: 'Salary, wages, CPP/EI, tax withheld, and taxable benefits.',
        slipCodes: ['T4'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'employment_t4e',
        label: 'T4E — employment insurance benefits',
        description: 'EI benefits and repayments.',
        slipCodes: ['T4E', 'T4EQ'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'employment_rl1',
        label: 'RL-1 — Quebec employment income',
        description: 'Quebec Revenu Québec employment slip (federal linkage via T4 where applicable).',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'employment_rl6',
        label: 'RL-6 — Quebec self-employment and other income',
        description: 'Quebec RL-6 slip for certain employment-related amounts.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'social_assistance_t5007',
        label: 'T5007 / RL-5 — social assistance or workers compensation',
        description: 'Social assistance, workers compensation, and related benefits.',
        slipCodes: ['T5007'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'employment_expenses',
        label: 'Employment expenses (T777)',
        description: 'Motor vehicle, supplies, and other deductible employment expenses.',
        slipCodes: [],
        formCodes: ['T777'],
        linkedStep: 'Deductions'
      }
    ]
  },
  {
    id: 'pension',
    title: 'Pension and other income',
    summary: 'Retirement, annuity, CPP, OAS, RRSP, and RRIF income.',
    icon: 'PI',
    topics: [
      {
        id: 'pension_t4a',
        label: 'T4A — pension, retirement, annuity, and other income',
        description: 'Pensions, lump sums, scholarships, fees for services, and other T4A boxes.',
        slipCodes: ['T4A'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'pension_t4ap',
        label: 'T4A(P) — Canada Pension Plan benefits',
        description: 'CPP retirement, survivor, disability, and related benefits.',
        slipCodes: ['T4AP', 'T4A(P)'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'pension_t4aoas',
        label: 'T4A(OAS) — Old Age Security',
        description: 'OAS pension, supplements, recovery, and tax withheld.',
        slipCodes: ['T4AOAS', 'T4A(OAS)', 'NR4OAS'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'pension_t4rif',
        label: 'T4RIF — registered retirement income fund',
        description: 'RRIF withdrawals and tax withheld.',
        slipCodes: ['T4RIF'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'pension_t4rsp',
        label: 'T4RSP — RRSP income',
        description: 'RRSP withdrawals, HBP, LLP, and other RRSP income.',
        slipCodes: ['T4RSP'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'pension_rl2',
        label: 'RL-2 — Quebec retirement and annuity income',
        description: 'Quebec RL-2 retirement income slip.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'pension_rca',
        label: 'T4A-RCA / T737-RCA — retirement compensation arrangement',
        description: 'RCA distributions and custodian contributions.',
        slipCodes: ['T4A-RCA', 'T737-RCA'],
        formCodes: [],
        linkedStep: 'Income'
      }
    ]
  },
  {
    id: 'rental',
    title: 'Rental income',
    summary: 'Rental property income and expenses.',
    icon: 'RI',
    topics: [
      {
        id: 'rental_income',
        label: 'Rental income and expenses (T776)',
        description: 'Rental statements of income and expenses.',
        slipCodes: [],
        formCodes: ['T776'],
        linkedStep: 'Income'
      }
    ]
  },
  {
    id: 'investment',
    title: 'Investment income and expenses',
    summary: 'Interest, dividends, trusts, partnerships, and capital transactions.',
    icon: 'IN',
    topics: [
      {
        id: 'investment_t3',
        label: 'T3 — trust income',
        description: 'Trust allocations of income, dividends, and capital gains.',
        slipCodes: ['T3'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'investment_t5',
        label: 'T5 — investment income',
        description: 'Interest, dividends, and other investment income.',
        slipCodes: ['T5'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'investment_t5013',
        label: 'T5013 — partnership income',
        description: 'Partnership income allocations and capital gains.',
        slipCodes: ['T5013'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'investment_t5008',
        label: 'T5008 — securities transactions',
        description: 'Proceeds and cost base for securities dispositions.',
        slipCodes: ['T5008'],
        formCodes: ['Schedule 3'],
        linkedStep: 'Income'
      },
      {
        id: 'investment_capital_gains',
        label: 'Capital gains or losses (Schedule 3)',
        description: 'Principal residence, other real estate, and capital property dispositions.',
        slipCodes: [],
        formCodes: ['Schedule 3'],
        linkedStep: 'Income'
      },
      {
        id: 'investment_foreign_property',
        label: 'Foreign property over $100,000 (T1135)',
        description: 'Foreign income verification statement for specified foreign property.',
        slipCodes: [],
        formCodes: ['T1135'],
        linkedStep: 'Review'
      },
      {
        id: 'investment_rl3',
        label: 'RL-3 — Quebec investment income',
        description: 'Quebec investment income slip.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Income'
      }
    ]
  },
  {
    id: 'self_employment',
    title: 'Self-employment',
    summary: 'Business, professional, farming, fishing, and commission income.',
    icon: 'SE',
    topics: [
      {
        id: 'self_employment_business',
        label: 'Business or professional income (T2125)',
        description: 'Self-employment, commissions, and professional fees.',
        slipCodes: ['T4A', 'T5018'],
        formCodes: ['T2125'],
        linkedStep: 'Income'
      },
      {
        id: 'self_employment_farming',
        label: 'Farming income (T2042)',
        description: 'Farm income and expenses.',
        slipCodes: ['AGR-1'],
        formCodes: ['T2042'],
        linkedStep: 'Income'
      },
      {
        id: 'self_employment_fishing',
        label: 'Fishing income (T2121)',
        description: 'Fishing income and expenses.',
        slipCodes: [],
        formCodes: ['T2121'],
        linkedStep: 'Income'
      },
      {
        id: 'self_employment_non_resident',
        label: 'T4A-NR / NR4 — non-resident fees or income',
        description: 'Amounts paid to non-residents or received as a non-resident.',
        slipCodes: ['T4A-NR', 'NR4'],
        formCodes: [],
        linkedStep: 'Income'
      }
    ]
  },
  {
    id: 'student',
    title: 'Student',
    summary: 'Tuition, education amounts, loans, and training credits.',
    icon: 'ST',
    topics: [
      {
        id: 'student_t2202',
        label: 'T2202 — tuition and enrolment certificate',
        description: 'Eligible tuition fees and full-time or part-time months.',
        slipCodes: ['T2202'],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'student_loans',
        label: 'Student loan interest',
        description: 'Interest paid on qualifying student loans.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'student_training_credit',
        label: 'Canada training credit',
        description: 'Training credit limit and eligible fees.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      }
    ]
  },
  {
    id: 'deductions',
    title: 'Common tax deductions',
    summary: 'Medical, disability, donations, and registered plans.',
    icon: 'CD',
    topics: [
      {
        id: 'deduction_medical',
        label: 'Medical expenses',
        description: 'Medical and disability-related expenses for you and dependants.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_disability',
        label: 'Disability amount (T2201)',
        description: 'Disability tax credit certificate and related claims.',
        slipCodes: [],
        formCodes: ['T2201'],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_donations',
        label: 'Charitable donations',
        description: 'Donations and gifts to registered charities.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_rrsp',
        label: 'RRSP, PRPP, LLP, or HBP',
        description: 'RRSP contributions, home buyers plan, and lifelong learning plan.',
        slipCodes: ['T4RSP'],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_fhsa',
        label: 'FHSA contributions or withdrawals',
        description: 'First Home Savings Account contributions and taxable withdrawals.',
        slipCodes: ['T4FHSA'],
        formCodes: [],
        linkedStep: 'Deductions'
      }
    ]
  },
  {
    id: 'family',
    title: 'Parents and children',
    summary: 'Dependants, child benefits, support payments, and adoption.',
    icon: 'PC',
    topics: [
      {
        id: 'family_support_payments',
        label: 'Spousal or child support payments',
        description: 'Support paid or received during the year.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'family_uccb',
        label: 'RC62 — Universal Child Care Benefit',
        description: 'UCCB amounts and repayments.',
        slipCodes: ['RC62'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'family_childcare',
        label: 'Child care expenses',
        description: 'Child care costs for eligible dependants.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'family_adoption',
        label: 'Adoption expenses',
        description: 'Eligible adoption-related expenses.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      }
    ]
  },
  {
    id: 'instalments',
    title: 'Instalments and tax transfer',
    summary: 'Tax instalments paid and transfers to a spouse.',
    icon: 'IT',
    topics: [
      {
        id: 'instalments_paid',
        label: 'Tax instalments paid',
        description: 'Instalment payments made during the year.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'instalments_transfer',
        label: 'Transfer to spouse or common-law partner',
        description: 'Pension income, age amount, or disability amount transfers.',
        slipCodes: [],
        formCodes: ['Schedule 2'],
        linkedStep: 'Deductions'
      }
    ]
  },
  {
    id: 'other',
    title: 'Other topics',
    summary: 'Moving expenses, income repayments, and miscellaneous items.',
    icon: 'OT',
    topics: [
      {
        id: 'other_moving',
        label: 'Moving expenses',
        description: 'Eligible moving expenses for work or study relocation.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'other_repayment',
        label: 'Repayment of income (T1198, T4E repayments)',
        description: 'Retroactive lump-sum payments and benefit repayments.',
        slipCodes: ['T1198', 'T4E'],
        formCodes: ['T1198'],
        linkedStep: 'Income'
      },
      {
        id: 'other_dpsp',
        label: 'T4PS — deferred profit sharing plan',
        description: 'DPSP allocations and payouts.',
        slipCodes: ['T4PS'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'other_security_options',
        label: 'T1212 — security options benefits',
        description: 'Deferred security option benefits and deductions.',
        slipCodes: ['T1212'],
        formCodes: ['T1212'],
        linkedStep: 'Income'
      },
      {
        id: 'other_refund_discount',
        label: 'RC71 — refund discounting fee',
        description: 'Tax refund discounter fees.',
        slipCodes: ['RC71'],
        formCodes: [],
        linkedStep: 'Deductions'
      }
    ]
  },
  {
    id: 'carryforward',
    title: 'Carryforward amounts and prior year information',
    summary: 'Losses and amounts carried forward from prior years.',
    icon: 'CF',
    topics: [
      {
        id: 'carryforward_losses',
        label: 'Non-capital or net capital losses from prior years',
        description: 'Loss carryforwards applied on the current return.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Review'
      },
      {
        id: 'carryforward_prior_year',
        label: 'Prior year information and adjustments',
        description: 'Prior-year slips, reassessments, and balance adjustments.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Review'
      }
    ]
  }
]

const TOPIC_BY_ID = new Map()
for (const category of INTERVIEW_TOPIC_CATEGORIES) {
  for (const topic of category.topics) {
    TOPIC_BY_ID.set(topic.id, { ...topic, categoryId: category.id, categoryTitle: category.title })
  }
}

export function listInterviewTopicCatalog () {
  return {
    version: INTERVIEW_TOPICS_VERSION,
    categories: INTERVIEW_TOPIC_CATEGORIES.map((category) => ({
      id: category.id,
      title: category.title,
      summary: category.summary,
      icon: category.icon,
      topics: category.topics.map((topic) => ({
        id: topic.id,
        categoryId: category.id,
        label: topic.label,
        description: topic.description,
        slipCodes: topic.slipCodes,
        formCodes: topic.formCodes,
        linkedStep: topic.linkedStep
      }))
    }))
  }
}

export function normalizeInterviewTopicIds (value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const out = []
  for (const raw of value) {
    const id = String(raw || '').trim()
    if (!id || !TOPIC_BY_ID.has(id) || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export function resolveInterviewTopicArtifacts (selectedTopicIds) {
  const ids = normalizeInterviewTopicIds(selectedTopicIds)
  const slipCodes = new Set()
  const formCodes = new Set()
  const topics = []

  for (const id of ids) {
    const topic = TOPIC_BY_ID.get(id)
    if (!topic) continue
    topics.push({
      id: topic.id,
      label: topic.label,
      categoryId: topic.categoryId,
      categoryTitle: topic.categoryTitle
    })
    for (const code of topic.slipCodes || []) slipCodes.add(String(code).toUpperCase())
    for (const code of topic.formCodes || []) formCodes.add(String(code).trim())
  }

  return {
    selectedTopicIds: ids,
    topics,
    slipCodes: Array.from(slipCodes).sort(),
    formCodes: Array.from(formCodes).sort((a, b) => a.localeCompare(b))
  }
}
